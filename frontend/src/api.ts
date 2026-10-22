export const API_URL = (process.env.EXPO_PUBLIC_API_URL as string).replace(/\/$/, "");
export const WS_URL = API_URL.replace(/^http/, "ws");

let token: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const setToken = (t: string | null) => {
  token = t;
};
export const getToken = () => token;
export const setUnauthorizedHandler = (fn: (() => void) | null) => {
  onUnauthorized = fn;
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
  }
}

function extractDetail(body: any, status: number): string {
  const fallback = `Request failed (${status})`;
  if (!body) return fallback;
  const d = body.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((x) => x?.msg ?? JSON.stringify(x)).join(", ");
  if (d && typeof d === "object") return d.message ?? JSON.stringify(d);
  return body.message ?? fallback;
}

export function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return "Something went wrong";
}

type Opts = { method?: string; body?: unknown; auth?: boolean };

export async function api<T = any>(path: string, { method = "GET", body, auth = true }: Opts = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Cannot reach the Suvera FLOW server. Check your connection.");
  }
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    const err = new ApiError(res.status, extractDetail(data, res.status));
    if (res.status === 401 && auth && token) onUnauthorized?.();
    throw err;
  }
  return data as T;
}

// Accepts either a bare array or a wrapper object from list endpoints.
export function asList(data: any, keys: string[] = ["items", "results", "data"]): any[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    for (const k of keys) if (Array.isArray(data[k])) return data[k];
  }
  return [];
}
