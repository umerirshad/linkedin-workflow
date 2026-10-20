import assert from "node:assert/strict";
import test from "node:test";

import { excludeCampaignProfiles } from "../src/modules/campaigns/exclusion-service.ts";
import { buildProfileWhere } from "../src/lib/profile-query.ts";
import { profileQuerySchema, profileUpdateSchema } from "../src/lib/validation.ts";

test("uses safe pagination defaults and validates picture status", () => {
    assert.deepEqual(profileQuerySchema.parse({}), { page: 1, pageSize: 25, search: "", notes: "any" });
    assert.equal(profileQuerySchema.safeParse({ pictureStatus: "GUESS" }).success, false);
    assert.equal(profileUpdateSchema.safeParse({ pictureStatus: "UNKNOWN" }).success, true);
  });

  test("combines search, list, notes, and picture filters", () => {
    const where = buildProfileWhere(profileQuerySchema.parse({ search: "Ada", listId: "list-1", notes: "present", pictureStatus: "UNKNOWN" }));
    assert.equal(where.pictureStatus, "UNKNOWN");
    assert.deepEqual(where.memberships, { some: { listId: "list-1" } });
    assert.equal(Array.isArray(where.AND) ? where.AND.length : 0, 2);
  });

  test("excludes contacted before processed profiles without inferring history", () => {
    assert.deepEqual(excludeCampaignProfiles([{ id: "a" }, { id: "b" }, { id: "c" }], { contactedProfileIds: new Set(["a"]), processedProfileIds: new Set(["a", "b"]) }), { eligible: [{ id: "c" }], excluded: [{ profile: { id: "a" }, reason: "contacted" }, { profile: { id: "b" }, reason: "processed" }] });
  });
