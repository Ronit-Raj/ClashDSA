"use client";

import { createContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { apiFetch } from "@/app/lib/api";

// ── Types ────────────────────────────────────────────────────────────────────

export interface User {
  userId: string;
  username: string;
  email: string;
}

export type LoginResult =
  | { ok: true }
  | {
      ok: false;
      status: number;
      message?: string;
      errors?: { email?: string[]; password?: string[] };
    };

export interface AuthContextValue {
  /** Null while loading or when signed out */
  user: User | null;
  /** True only during the initial /me check on mount */
  isLoading: boolean;
  /** Signs in, then populates `user` from /me on success */
  login: (email: string, password: string) => Promise<LoginResult>;
  /** Clears the auth cookie and resets user to null */
  logout: () => void;
  /** Re-fetches /me and refreshes user state */
  refreshUser: () => Promise<void>;
}

// ── Context ──────────────────────────────────────────────────────────────────

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  login: async () => ({ ok: false, status: 0 }),
  logout: () => {},
  refreshUser: async () => {},
});

// ── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── /me helper ─────────────────────────────────────────────────────────────

  const refreshUser = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch("/v1/api/users/me");
      if (res.ok) {
        const data: User = await res.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  /** Bootstrap: check whether the browser already has a valid session */
  useEffect(() => {
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────

  const login = async (
    email: string,
    password: string,
  ): Promise<LoginResult> => {
    try {
      const res = await apiFetch("/v1/api/users/sign-in", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        // Cookie is now set — populate the user from /me
        await refreshUser();
        return { ok: true };
      }

      const data = await res.json().catch(() => ({}));

      return {
        ok: false,
        status: res.status,
        message: data.message as string | undefined,
        errors: data.errors as
          | { email?: string[]; password?: string[] }
          | undefined,
      };
    } catch {
      return {
        ok: false,
        status: 0,
        message: "Something went wrong. Please try again.",
      };
    }
  };

  const logout = () => {
    // No dedicated sign-out endpoint yet — clear the cookie client-side
    document.cookie = "token=; Max-Age=0; path=/";
    setUser(null);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
