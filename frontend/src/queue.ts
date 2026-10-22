import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

import { api, asList, errorMessage } from "./api";
import { useAuth } from "./auth";
import { useToast } from "./toast";

export const QUEUE_KEY = ["queue-state"];

export type Visitor = { id: string; status: string; [k: string]: any };
export type Host = { id: string; status?: string; [k: string]: any };

export function useQueueState() {
  const { status } = useAuth();
  return useQuery({
    queryKey: QUEUE_KEY,
    queryFn: () => api("/api/queue/state"),
    enabled: status === "signedIn",
    refetchInterval: 20000,
  });
}

// ---- Defensive readers (server order is always preserved, never sorted) ----
export function getVisitors(state: any): Visitor[] {
  if (!state) return [];
  for (const k of ["queue", "visitors", "visits", "items"]) {
    if (Array.isArray(state[k])) return state[k];
  }
  return [];
}

export function getHosts(state: any): Host[] {
  return asList(state?.hosts, ["items", "hosts"]);
}

export const FINAL = ["completed", "rejected", "cancelled", "canceled", "no_show"];
export const WAITING = ["approved", "waiting", "queued", "called"];
export const HELD = ["on_hold", "held", "hold"];

export function currentMeeting(state: any): Visitor | null {
  const direct = state?.current_meeting ?? state?.in_meeting ?? state?.current;
  if (direct && typeof direct === "object" && direct.id) return direct;
  return getVisitors(state).find((v) => v.status === "in_meeting") ?? null;
}

export function nextVisitor(state: any): Visitor | null {
  const direct = state?.next_visitor ?? state?.next;
  if (direct && typeof direct === "object" && direct.id) return direct;
  return getVisitors(state).find((v) => WAITING.includes(v.status)) ?? null;
}

export function countOf(state: any, key: string, statuses: string[]): number {
  const c = state?.counts?.[key] ?? state?.[`${key}_count`];
  if (typeof c === "number") return c;
  return getVisitors(state).filter((v) => statuses.includes(v.status)).length;
}

export const pendingCount = (s: any) => countOf(s, "pending_approval", ["pending_approval", "pending"]);
export const waitingCount = (s: any) => countOf(s, "waiting", WAITING);
export const heldCount = (s: any) => countOf(s, "on_hold", HELD);
export const completedCount = (s: any) => countOf(s, "completed", ["completed"]);

export function hostWaiting(state: any, host: Host): number {
  for (const k of ["waiting_count", "waiting", "queue_count"]) if (typeof host[k] === "number") return host[k];
  return getVisitors(state).filter((v) => String(hostIdOf(v)) === String(host.id) && WAITING.includes(v.status)).length;
}

export const hostIdOf = (v: Visitor) => v.host_id ?? v.host?.id;
export const visitorName = (v: Visitor) => v.visitor_name ?? v.name ?? v.visitor?.name ?? "Visitor";
export const visitorNumber = (v: Visitor) => v.token_number ?? v.queue_number ?? v.token ?? v.queue_position;
export function hostNameOf(v: Visitor, hosts: Host[]) {
  if (v.host_name) return v.host_name;
  if (v.host?.name) return v.host.name;
  const h = hosts.find((x) => String(x.id) === String(hostIdOf(v)));
  return h ? (h.name ?? h.full_name) : undefined;
}

// ---- Actions (no optimistic UI: wait for the server, then refetch) ----
export type ActionKey = "approve" | "reject" | "hold" | "resume" | "call" | "start" | "complete" | "cancel";

export const ACTION_DONE: Record<ActionKey, string> = {
  approve: "Visitor approved",
  reject: "Visitor rejected",
  hold: "Visitor put on hold",
  resume: "Visitor resumed",
  call: "Visitor called",
  start: "Meeting started",
  complete: "Meeting finished",
  cancel: "Visit cancelled",
};

export function useQueueActions() {
  const qc = useQueryClient();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  const run = useCallback(
    async (key: string, path: string, body: unknown, done: string) => {
      setBusy(key);
      try {
        await api(path, { method: "POST", body });
        toast.show(done, "success");
        return true;
      } catch (e) {
        toast.show(errorMessage(e), "error");
        return false;
      } finally {
        await qc.invalidateQueries({ queryKey: QUEUE_KEY });
        setBusy(null);
      }
    },
    [qc, toast],
  );

  const act = useCallback(
    (id: string, action: ActionKey, reason = "") => run(`${id}:${action}`, `/api/queue/${id}/${action}`, { reason }, ACTION_DONE[action]),
    [run],
  );
  const advance = useCallback(() => run("advance", "/api/queue/advance", {}, "Next person is in"), [run]);

  return { busy, act, advance };
}

export function actionsFor(v: Visitor, mode: "console" | "reception" | "admin"): ActionKey[] {
  const s = v.status;
  if (s === "pending_approval" || s === "pending") return mode === "reception" ? [] : ["approve", "reject"];
  if (s === "in_meeting") return ["complete"];
  if (HELD.includes(s)) return mode === "reception" ? ["resume"] : ["resume", "cancel"];
  if (s === "called") return ["start", "hold"];
  if (WAITING.includes(s)) return mode === "reception" ? ["call", "start", "hold"] : ["call", "start", "hold", "cancel"];
  return [];
}
