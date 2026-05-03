"use client";

import { useContext } from "react";
import { AuthContext } from "@/app/context/AuthContext";

/**
 * Access the current auth state and actions from anywhere in the client tree.
 *
 * @example
 * const { user, isLoading, login, logout } = useAuth();
 */
export function useAuth() {
  return useContext(AuthContext);
}

// Re-export types so consumers can import them from the hook file
export type {
  User,
  LoginResult,
  AuthContextValue,
} from "@/app/context/AuthContext";
