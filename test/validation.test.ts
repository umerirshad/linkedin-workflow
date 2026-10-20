import assert from "node:assert/strict";
import test from "node:test";
import { normalizeProfileUrl, profileInputSchema } from "../src/lib/validation.ts";
import { validateServerEnv } from "../src/lib/env.ts";
import { isPrismaUniqueConstraintError, parseImportContent } from "../src/modules/profile-imports/import-service.ts";
import { normalizeImportRequest } from "../src/lib/import-api.ts";
import { canPreviewImport } from "../src/modules/profile-imports/import-ui.ts";

test("normalizes profile URLs to a stable unique key", () => {
  assert.equal(
    normalizeProfileUrl(" HTTPS://WWW.Example.com//people/alice/?trk=public_profile#about "),
    "https://www.example.com/people/alice",
  );
  assert.equal(normalizeProfileUrl("https://example.com"), "https://example.com/");
});

test("profile validation stores the normalized URL", () => {
  const result = profileInputSchema.safeParse({
    fullName: "Alice Example",
    profileUrl: "HTTPS://Example.com/alice/",
  });

  assert.equal(result.success, true);
  if (result.success) assert.equal(result.data.profileUrl, "https://example.com/alice");
});

test("profile validation rejects non-HTTP URLs", () => {
  assert.equal(profileInputSchema.safeParse({ fullName: "Alice", profileUrl: "ftp://example.com" }).success, false);
});

test("environment validation reports variable names without secret values", () => {
  const result = validateServerEnv({ DATABASE_URL: "not-a-url", LINKEDIN_CLIENT_SECRET: "do-not-print" });

  assert.equal(result.success, false);
  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.path.join(".")).join(", ");
    assert.match(message, /DATABASE_URL/);
    assert.doesNotMatch(message, /do-not-print/);
  }
});

test("import parsing normalizes URL variations and detects repeated input rows", () => {
  const parsed = parseImportContent("urls", "HTTPS://www.linkedin.com/in/alice/?trk=abc#about\nhttps://WWW.LINKEDIN.com/in/alice\nhttps://www.linkedin.com/in/bob/");

  assert.equal(parsed.candidates.length, 2);
  assert.equal(parsed.candidates[0]?.profileUrl, "https://www.linkedin.com/in/alice");
  assert.equal(parsed.duplicateInputRows.length, 1);
  assert.equal(parsed.duplicateInputRows[0]?.duplicateOfRow, 1);
});

test("CSV parsing reports malformed rows and accepts URL-only records", () => {
  const parsed = parseImportContent("csv", "profileUrl,fullName\nhttps://www.linkedin.com/in/alice,Alice Example\n\"broken");

  assert.equal(parsed.candidates.length, 1);
  assert.ok(parsed.invalidRows.length >= 1);
});

test("repeated imports remain idempotent at the parsed-record boundary", () => {
  const first = parseImportContent("urls", "https://www.linkedin.com/in/alice");
  const second = parseImportContent("urls", "https://www.linkedin.com/in/alice/");

  assert.equal(first.candidates[0]?.profileUrl, second.candidates[0]?.profileUrl);
  assert.equal(isPrismaUniqueConstraintError({ code: "P2002" }), true);
  assert.equal(isPrismaUniqueConstraintError({ code: "P2025" }), false);
});

test("source search URLs are validated as metadata and never fetched", () => {
  const valid = normalizeImportRequest({ listId: "list-1", mode: "urls", content: "https://www.linkedin.com/in/alice", sourceSearchUrl: "https://www.linkedin.com/search/results/people/?keywords=design" });
  const invalid = normalizeImportRequest({ listId: "list-1", mode: "urls", content: "https://www.linkedin.com/in/alice", sourceSearchUrl: "https://example.com/search/results/people" });

  assert.equal(valid.success, true);
  assert.equal(invalid.success, false);
});

test("preview enables for non-whitespace pasted input without requiring a list", () => {
  assert.equal(canPreviewImport("  \nhttps://www.linkedin.com/in/example-person-one/\n", false), true);
  assert.equal(canPreviewImport(" \n\t", false), false);
  assert.equal(canPreviewImport("https://www.linkedin.com/in/example-person-one/", true), false);

  const parsed = parseImportContent("urls", "https://www.linkedin.com/in/example-person-one/\nhttps://www.linkedin.com/in/example-person-two/\nhttps://www.linkedin.com/in/example-person-one");
  assert.equal(parsed.candidates.length, 2);
  assert.equal(parsed.duplicateInputRows.length, 1);
  assert.equal(parsed.invalidRows.length, 0);
});
