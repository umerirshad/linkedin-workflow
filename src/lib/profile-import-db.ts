import type { Prisma, PrismaClient } from "@prisma/client";
import { parseImportContent, type ParsedImport } from "@/modules/profile-imports/import-service";
import type { ImportRequest } from "@/lib/import-api";

type Database = PrismaClient | Prisma.TransactionClient;
type ImportPreviewError = { error: string; status: 404 };
export type ImportPreview = {
  list: { id: string; name: string };
  parsed: ParsedImport;
  profiles: Array<{ id: string; profileUrl: string | null; fullName: string }>;
  existingProfileUrls: string[];
  existingMembershipProfileIds: string[];
  summary: { newProfiles: number; existingProfiles: number; duplicateInputRows: number; invalidRows: number; membershipsAlreadyPresent: number };
};

export async function buildImportPreview(db: Database, input: ImportRequest): Promise<ImportPreview | ImportPreviewError> {
  const parsed = parseImportContent(input.mode, input.content);
  const list = await db.profileList.findUnique({ where: { id: input.listId }, select: { id: true, name: true } });
  if (!list) return { error: "Selected list was not found", status: 404 as const };

  const urls = parsed.candidates.map((candidate) => candidate.profileUrl);
  const profiles = urls.length
    ? await db.profile.findMany({ where: { profileUrl: { in: urls } }, select: { id: true, profileUrl: true, fullName: true } })
    : [];
  const profileIds = profiles.map((profile) => profile.id);
  const memberships = profileIds.length
    ? await db.listProfile.findMany({ where: { listId: input.listId, profileId: { in: profileIds } }, select: { profileId: true } })
    : [];
  const existingUrls = new Set(profiles.map((profile) => profile.profileUrl).filter((url): url is string => Boolean(url)));
  const membershipIds = new Set(memberships.map((membership) => membership.profileId));

  return {
    list,
    parsed,
    profiles,
    existingProfileUrls: [...existingUrls],
    existingMembershipProfileIds: [...membershipIds],
    summary: {
      newProfiles: parsed.candidates.filter((candidate) => !existingUrls.has(candidate.profileUrl)).length,
      existingProfiles: parsed.candidates.filter((candidate) => existingUrls.has(candidate.profileUrl)).length,
      duplicateInputRows: parsed.duplicateInputRows.length,
      invalidRows: parsed.invalidRows.length,
      membershipsAlreadyPresent: profiles.filter((profile) => membershipIds.has(profile.id)).length,
    },
  };
}

export async function importParsedProfiles(db: PrismaClient, input: ImportRequest, preview: Awaited<ReturnType<typeof buildImportPreview>>) {
  if ("error" in preview) throw new Error(preview.error);

  return db.$transaction(async (transaction) => {
    const run = await transaction.importRun.create({
      data: {
        source: input.mode === "csv" ? "CSV" : "PASTED_URLS",
        sourceLabel: input.sourceSearchUrl,
        totalRows: preview.parsed.candidates.length + preview.parsed.invalidRows.length + preview.parsed.duplicateInputRows.length,
        acceptedRows: preview.parsed.candidates.length,
        rejectedRows: preview.parsed.invalidRows.length + preview.parsed.duplicateInputRows.length,
      },
    });
    let profilesCreated = 0;
    let membershipsAdded = 0;
    const existingProfileUrls = new Set(preview.existingProfileUrls);
    const existingMembershipProfileIds = new Set(preview.existingMembershipProfileIds);

    for (const candidate of preview.parsed.candidates) {
      const profileData = {
        fullName: candidate.fullName,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        headline: candidate.headline,
        company: candidate.company,
        profileUrl: candidate.profileUrl,
        email: candidate.email,
        notes: candidate.notes,
      };
      const profile = await transaction.profile.upsert({
        where: { profileUrl: candidate.profileUrl },
        update: {},
        create: profileData,
      });
      if (!existingProfileUrls.has(candidate.profileUrl)) profilesCreated += 1;

      await transaction.listProfile.upsert({
        where: { listId_profileId: { listId: input.listId, profileId: profile.id } },
        update: {},
        create: { listId: input.listId, profileId: profile.id },
      });
      if (!existingMembershipProfileIds.has(profile.id)) membershipsAdded += 1;
    }

    const completed = await transaction.importRun.update({
      where: { id: run.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
    return { run: completed, profilesCreated, membershipsAdded };
  });
}
