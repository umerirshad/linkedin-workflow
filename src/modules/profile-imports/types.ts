import type { ProfileInput } from "@/lib/validation";

export type ImportResult = {
  accepted: ProfileInput[];
  rejected: Array<{ row: number; reason: string }>;
};

/** An adapter may read from an authorized provider API or a user export. */
export interface ProfileSourceAdapter {
  readonly source: string;
  importProfiles(input: unknown): Promise<ImportResult>;
}
