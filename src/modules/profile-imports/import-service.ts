import Papa from "papaparse";
import { normalizeProfileUrl, profileInputSchema, type ProfileInput } from "../../lib/validation.ts";

export const MAX_IMPORT_CONTENT_BYTES = 900_000;
export const MAX_IMPORT_ROWS = 2_000;

export type ImportMode = "urls" | "csv";

export type InvalidImportRow = {
  row: number;
  reason: string;
  value?: string;
};

export type ImportCandidate = Omit<ProfileInput, "profileUrl"> & { profileUrl: string; row: number };

export type ParsedImport = {
  candidates: ImportCandidate[];
  invalidRows: InvalidImportRow[];
  duplicateInputRows: Array<{ row: number; duplicateOfRow: number; profileUrl: string }>;
};

function displayNameFromUrl(profileUrl: string) {
  const lastSegment = new URL(profileUrl).pathname.split("/").filter(Boolean).at(-1);
  if (!lastSegment) return "LinkedIn profile";
  return lastSegment
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
    .slice(0, 160);
}

function parseCandidate(row: number, input: Record<string, unknown>): ImportCandidate | InvalidImportRow {
  const profileUrl = String(input.profileUrl ?? input.url ?? input.linkedinUrl ?? input.linkedin_url ?? "").trim();
  const fullName = String(input.fullName ?? input.full_name ?? input.name ?? "").trim();

  if (!profileUrl) return { row, reason: "A LinkedIn profile URL is required" };

  const result = profileInputSchema.safeParse({
    fullName: fullName || displayNameFromUrl(normalizeProfileUrl(profileUrl)),
    profileUrl,
    firstName: input.firstName ?? input.first_name,
    lastName: input.lastName ?? input.last_name,
    headline: input.headline,
    company: input.company,
    email: input.email,
    notes: input.notes,
  });

  if (!result.success) {
    return { row, reason: result.error.issues[0]?.message ?? "Invalid profile row", value: profileUrl };
  }
  if (!result.data.profileUrl) return { row, reason: "A LinkedIn profile URL is required", value: profileUrl };
  return { ...result.data, profileUrl: result.data.profileUrl, row };
}

function addCandidate(
  parsed: ParsedImport,
  candidate: ImportCandidate | InvalidImportRow,
  seen: Map<string, number>,
) {
  if ("profileUrl" in candidate) {
    const firstRow = seen.get(candidate.profileUrl);
    if (firstRow !== undefined) {
      parsed.duplicateInputRows.push({ row: candidate.row, duplicateOfRow: firstRow, profileUrl: candidate.profileUrl });
      return;
    }
    seen.set(candidate.profileUrl, candidate.row);
    parsed.candidates.push(candidate);
  } else {
    parsed.invalidRows.push(candidate);
  }
}

export function parseImportContent(mode: ImportMode, content: string): ParsedImport {
  const parsed: ParsedImport = { candidates: [], invalidRows: [], duplicateInputRows: [] };
  const seen = new Map<string, number>();

  if (mode === "urls") {
    for (const [index, value] of content.split(/\r?\n/).entries()) {
      const row = index + 1;
      const url = value.trim();
      if (!url) continue;
      try {
        addCandidate(parsed, parseCandidate(row, { profileUrl: url }), seen);
      } catch {
        parsed.invalidRows.push({ row, reason: "Invalid profile URL", value: url });
      }
    }
  } else {
    const result = Papa.parse<Record<string, unknown>>(content, {
      header: true,
      skipEmptyLines: true,
    });
    for (const error of result.errors) {
      parsed.invalidRows.push({ row: (error.row ?? 0) + 2, reason: error.message });
    }
    for (const [index, row] of result.data.entries()) {
      try {
        const normalizedRow = Object.fromEntries(Object.entries(row).map(([key, value]) => [key.trim(), value]));
        addCandidate(parsed, parseCandidate(index + 2, normalizedRow), seen);
      } catch {
        parsed.invalidRows.push({ row: index + 2, reason: "Invalid profile row" });
      }
    }
  }

  if (parsed.candidates.length + parsed.invalidRows.length + parsed.duplicateInputRows.length > MAX_IMPORT_ROWS) {
    parsed.invalidRows.push({ row: 0, reason: `Imports are limited to ${MAX_IMPORT_ROWS} rows` });
    parsed.candidates = [];
    parsed.duplicateInputRows = [];
  }

  return parsed;
}

export function isPrismaUniqueConstraintError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2002",
  );
}

export function importSourceForMode(mode: ImportMode) {
  return mode === "csv" ? ("CSV" as const) : ("PASTED_URLS" as const);
}
