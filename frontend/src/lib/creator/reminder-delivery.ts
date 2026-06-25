import type { SendNudgeResponse } from "@/lib/api/domain-types";

export type ReminderSendResult = SendNudgeResponse;

export function formatReminderStatus(result: ReminderSendResult): string {
  return result.summary;
}

export function reminderChannels(result: ReminderSendResult): { label: string; ok: boolean }[] {
  return [
    { label: "E-mail", ok: result.emailSent },
    { label: "Push", ok: result.pushSent },
  ];
}
