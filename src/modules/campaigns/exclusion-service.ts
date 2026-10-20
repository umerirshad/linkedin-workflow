export type CampaignProfile = { id: string };

export type CampaignExclusionSets = {
  processedProfileIds?: ReadonlySet<string>;
  contactedProfileIds?: ReadonlySet<string>;
};

export type CampaignEligibility = {
  eligible: CampaignProfile[];
  excluded: Array<{ profile: CampaignProfile; reason: "processed" | "contacted" }>;
};

/** Preparation-only service: callers provide authoritative campaign history. */
export function excludeCampaignProfiles(profiles: CampaignProfile[], sets: CampaignExclusionSets): CampaignEligibility {
  const processed = sets.processedProfileIds ?? new Set<string>();
  const contacted = sets.contactedProfileIds ?? new Set<string>();
  const eligible: CampaignProfile[] = [];
  const excluded: CampaignEligibility["excluded"] = [];

  for (const profile of profiles) {
    if (contacted.has(profile.id)) excluded.push({ profile, reason: "contacted" });
    else if (processed.has(profile.id)) excluded.push({ profile, reason: "processed" });
    else eligible.push(profile);
  }
  return { eligible, excluded };
}
