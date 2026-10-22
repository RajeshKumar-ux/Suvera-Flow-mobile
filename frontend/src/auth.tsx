import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { api, setToken, setUnauthorizedHandler } from "./api";
import { unregisterPush } from "./push";
import { queryClient } from "./query-client";
import { storage } from "./utils/storage";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export type Role = "md" | "host" | "reception" | "admin";
export type User = {
  id: string;
  name?: string;
  full_name?: string;
  email?: string;
  role: Role;
  role_label?: string;
  [k: string]: any;
};

type AuthState = {
  status: "loading" | "signedOut" | "signedIn";
  user: User | null;
  token: string | null;
  notice: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: (notice?: string) => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function homeFor(role?: string): "/console" | "/reception" | "/admin" | "/login" {
  if (role === "md" || role === "host") return "/console";
  if (role === "reception") return "/reception";
  if (role === "admin") return "/admin";
  return "/login";
}

export function roleTitle(user?: User | null): string {
  if (!user) return "";
  if (user.role === "admin") return "IT Admin";
  if (user.role === "reception") return "Reception";
  if (user.role === "md") return user.role_label || "Managing Director";
  return user.role_label || "Host";
}

export function displayName(user?: { name?: string; full_name?: string; email?: string } | null) {
  return user?.name || user?.full_name || user?.email || "";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthState["status"]>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [token, setTok] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const clearSession = useCallback(async (msg?: string) => {
    setToken(null);
    setTok(null);
    setUser(null);
    await storage.secureRemove(TOKEN_KEY);
    await storage.secureRemove(USER_KEY);
    queryClient.clear();
    setNotice(msg ?? null);
    setStatus("signedOut");
  }, []);

  const logout = useCallback(
    async (msg?: string) => {
      await unregisterPush();
      await clearSession(msg);
    },
    [clearSession],
  );

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession("Your session expired. Please sign in again.");
    });
    (async () => {
      const t = await storage.secureGet(TOKEN_KEY, null);
      const u = await storage.secureGet(USER_KEY, null);
      if (typeof t === "string" && typeof u === "string") {
        try {
          const parsed = JSON.parse(u) as User;
          setToken(t);
          setTok(t);
          setUser(parsed);
          setStatus("signedIn");
          return;
        } catch {
          // fall through to signed out
        }
      }
      setStatus("signedOut");
    })();
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<{ user: User; access_token: string }>("/api/auth/login", {
      method: "POST",
      body: { email: email.trim().toLowerCase(), password },
      auth: false,
    });
    setToken(res.access_token);
    await storage.secureSet(TOKEN_KEY, res.access_token);
    await storage.secureSet(USER_KEY, JSON.stringify(res.user));
    setTok(res.access_token);
    setUser(res.user);
    setNotice(null);
    setStatus("signedIn");
  }, []);

  const value = useMemo(() => ({ status, user, token, notice, login, logout }), [status, user, token, notice, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside AuthProvider");
  return ctx;
}
