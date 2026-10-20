export type LinkedInAction =
  | "read_authorized_profile"
  | "create_manual_task"
  | "unsupported_action";

export type ManualActionTask = {
  action: string;
  title: string;
  instructions: string;
};

/** Implement only against an approved, authorized provider API. */
export interface AuthorizedProviderAdapter {
  readonly provider: string;
  readAuthorizedProfiles(): Promise<unknown[]>;
  toManualTask(action: string): ManualActionTask;
}

export function unsupportedLinkedInAction(action: string): ManualActionTask {
  return {
    action,
    title: `Manual LinkedIn task: ${action}`,
    instructions: "Complete this action manually in LinkedIn. No automated browser, cookie, or evasion flow is provided.",
  };
}
