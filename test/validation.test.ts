import assert from "node:assert/strict";
import test from "node:test";
import { normalizeProfileUrl, profileInputSchema } from "../src/lib/validation.ts";
import { validateServerEnv } from "../src/lib/env.ts";

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
