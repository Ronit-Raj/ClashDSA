"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/hooks/useAuth";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string[];
    password?: string[];
  }>({});
  const [topError, setTopError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function clearErrors() {
    setFieldErrors({});
    setTopError(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    clearErrors();

    startTransition(async () => {
      const result = await login(email, password);

      if (result.ok) {
        router.replace("/");
        return;
      }

      if (result.status === 400) {
        if (result.errors) setFieldErrors(result.errors);
        if (result.message) setTopError(result.message);
        return;
      }

      if (result.status === 401) {
        setTopError("Invalid email or password.");
        return;
      }

      setTopError(result.message ?? "Something went wrong. Please try again.");
    });
  }

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center min-h-screen bg-zinc-950 px-6 overflow-hidden">
      {/* Soft green glow backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
      >
        <div className="h-[500px] w-[600px] rounded-full bg-green-900/20 blur-[120px]" />
      </div>

      <div className="relative flex flex-col items-center gap-6 w-full max-w-sm">
        {/* ── Mini brand logo ── */}
        <div className="flex items-center gap-2 select-none">
          <span className="inline-block bg-green-900 text-white font-extrabold text-2xl tracking-tight px-2 py-0.5 rounded -rotate-6 shadow-md shadow-green-950/60">
            Clash
          </span>
          <span className="inline-block text-zinc-100 font-extrabold text-2xl tracking-tight">
            DSA
          </span>
        </div>

        {/* ── Card ── */}
        <div className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl shadow-black/40 px-8 py-8 flex flex-col gap-6">
          {/* Card header */}
          <div className="flex flex-col gap-1">
            <h1 className="text-zinc-100 font-bold text-2xl tracking-tight">
              Welcome back
            </h1>
            <p className="text-zinc-400 text-sm">Sign in to your account</p>
          </div>

          {/* Top-level error banner */}
          {topError && (
            <div className="rounded-lg bg-red-950/60 border border-red-800/50 px-4 py-3">
              <p className="text-red-400 text-sm">{topError}</p>
            </div>
          )}

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex flex-col gap-5"
          >
            {/* Email field */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-zinc-300 text-sm font-medium"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={isPending}
                className="
                  w-full rounded-lg
                  bg-zinc-800 border border-zinc-700
                  text-zinc-100 placeholder-zinc-500
                  px-4 py-2.5 text-sm
                  focus:outline-none focus:ring-2 focus:ring-green-900
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-shadow duration-150
                "
              />
              {fieldErrors.email && fieldErrors.email.length > 0 && (
                <p className="text-red-400 text-sm">{fieldErrors.email[0]}</p>
              )}
            </div>

            {/* Password field */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-zinc-300 text-sm font-medium"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isPending}
                className="
                  w-full rounded-lg
                  bg-zinc-800 border border-zinc-700
                  text-zinc-100 placeholder-zinc-500
                  px-4 py-2.5 text-sm
                  focus:outline-none focus:ring-2 focus:ring-green-900
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-shadow duration-150
                "
              />
              {fieldErrors.password && fieldErrors.password.length > 0 && (
                <p className="text-red-400 text-sm">
                  {fieldErrors.password[0]}
                </p>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isPending}
              className="
                w-full rounded-lg
                bg-green-900 hover:bg-green-800
                text-white font-semibold text-sm
                px-4 py-2.5
                transition-colors duration-200
                disabled:opacity-60 disabled:cursor-not-allowed
                cursor-pointer
                mt-1
              "
            >
              {isPending ? "Signing in…" : "Sign In"}
            </button>
          </form>

          {/* Sign-up link */}
          <p className="text-zinc-400 text-sm text-center">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-green-400 hover:text-green-300 font-medium transition-colors duration-150"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
