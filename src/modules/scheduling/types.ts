export type ScheduleWindow = {
  timezone: string;
  startsAt: string;
  endsAt?: string;
};

export type ScheduledManualTask = {
  taskId: string;
  window: ScheduleWindow;
};
