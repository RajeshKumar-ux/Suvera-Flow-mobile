import type { Tone } from "./components/ui";

export const VISIT_STATUS: Record<string, { label: string; tone: Tone }> = {
  pending_approval: { label: "Pending approval", tone: "warning" },
  pending: { label: "Pending", tone: "warning" },
  approved: { label: "Approved", tone: "success" },
  waiting: { label: "Waiting", tone: "brand" },
  queued: { label: "Waiting", tone: "brand" },
  called: { label: "Called", tone: "info" },
  in_meeting: { label: "In meeting", tone: "info" },
  on_hold: { label: "On hold", tone: "warning" },
  held: { label: "On hold", tone: "warning" },
  completed: { label: "Completed", tone: "neutral" },
  rejected: { label: "Rejected", tone: "error" },
  cancelled: { label: "Cancelled", tone: "neutral" },
  canceled: { label: "Cancelled", tone: "neutral" },
  no_show: { label: "No show", tone: "neutral" },
};

export function visitStatus(s?: string) {
  return VISIT_STATUS[s ?? ""] ?? { label: (s ?? "Unknown").replace(/_/g, " "), tone: "neutral" as Tone };
}

export const HOST_STATUSES = ["available", "in_meeting", "external_meeting", "out_of_station", "unavailable"] as const;
export type HostStatus = (typeof HOST_STATUSES)[number];

export const HOST_STATUS: Record<string, { label: string; tone: Tone; icon: string }> = {
  available: { label: "Available", tone: "success", icon: "checkmark-circle" },
  in_meeting: { label: "In meeting", tone: "info", icon: "people" },
  external_meeting: { label: "External meeting", tone: "info", icon: "business" },
  out_of_station: { label: "Out of station", tone: "warning", icon: "airplane" },
  unavailable: { label: "Unavailable", tone: "error", icon: "remove-circle" },
};

export function hostStatus(s?: string) {
  return HOST_STATUS[s ?? ""] ?? { label: (s ?? "Unknown").replace(/_/g, " "), tone: "neutral" as Tone, icon: "help-circle" };
}

const pad = (n: number) => String(n).padStart(2, "0");

export function fmtTime(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fmtDateTime(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const date = sameDay ? "Today" : d.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
  return `${date} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function initials(name?: string) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}
