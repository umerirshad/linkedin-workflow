import Papa from "papaparse";
import { profileInputSchema } from "@/lib/validation";
import type { ImportResult, ProfileSourceAdapter } from "./types";

export class CsvProfileAdapter implements ProfileSourceAdapter {
  readonly source = "csv";

  async importProfiles(input: unknown): Promise<ImportResult> {
    const parsed = Papa.parse<Record<string, unknown>>(String(input), {
      header: true,
      skipEmptyLines: true,
    });
    const accepted = [];
    const rejected = parsed.errors.map((error) => ({
      row: error.row ?? 0,
      reason: error.message,
    }));

    for (const [index, row] of parsed.data.entries()) {
      const result = profileInputSchema.safeParse(row);
      if (result.success) accepted.push(result.data);
      else rejected.push({ row: index + 2, reason: result.error.issues[0]?.message ?? "Invalid row" });
    }

    return { accepted, rejected };
  }
}
