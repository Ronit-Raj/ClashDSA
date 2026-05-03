"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { apiFetch } from "@/app/lib/api";

/* ── Shape of field-level errors returned by the API on HTTP 400 ── */
interface FieldErrors {
  username?: string[];
  email?: string[];
  password?: string[];
}

export default function SignupPage() {
  const router = useRouter();

  /* form values */
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  /* error state */
  const [topError, setTopError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  function clearErrors() {
    setTopError(null);
    setFieldErrors({});
    setSuccessMsg(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    clearErrors();

    startTransition(async () => {
      try {
        const res = await apiFetch("/v1/api/users/sign-up", {
          method: "POST",
          body: JSON.stringify({ username, email, password }),
        });

        if (res.status === 201) {
          setSuccessMsg("Account created! Redirecting to login…");
          setTimeout(() => router.replace("/login"), 1500);
          return;
        }

        const data = await res.json().catch(() => ({}));

        if (res.status === 400) {
          if (data.message) setTopError(data.message);
          if (data.errors) setFieldErrors(data.errors as FieldErrors);
          return;
        }

        if (res.status === 409) {
          setTopError(
            "An account with this email or username already exists."
          );
          return;
        }

        setTopError("Something went wrong. Please try again.");
      } catch {
        setTopError("Something went wrong. Please try again.");
      }
    });
  }

  return (
    <main className="relative flex flex-1 flex-col items-center justify-center min-h-screen bg-zinc-950 px-6 py-12">
      {/* ── Soft green glow ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
      >
        <div className="h-[500px] w-[700px] rounded-full bg-green-900/20 blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-md gap-6">
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
        <div className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl shadow-black/40 px-8 py-10 flex flex-col gap-6">
          {/* Heading */}
          <div className="flex flex-col gap-1">
            <h1 className="text-zinc-100 font-bold text-2xl tracking-tight">
              Create your account
            </h1>
            <p className="text-zinc-400 text-sm">
              Join and compete in custom DSA contests
            </p>
          </div>

          {/* ── Top-level success / error banners ── */}
          {successMsg && (
            <div className="rounded-lg bg-green-900/30 border border-green-800 text-green-300 text-sm px-4 py-3">
              {successMsg}
            </div>
          )}

          {topError && (
            <div className="rounded-lg bg-red-950/50 border border-red-800/60 text-red-400 text-sm px-4 py-3">
              {topError}
            </div>
          )}

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="username"
                className="text-zinc-300 text-sm font-medium"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="alice"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isPending}
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-900 disabled:opacity-50 transition-shadow"
              />
              {fieldErrors.username ? (
                fieldErrors.username.map((msg, i) => (
                  <p key={i} className="text-red-400 text-sm">
                    {msg}
                  </p>
                ))
              ) : (
                <p className="text-zinc-500 text-xs">3–32 characters</p>
              )}
            </div>

            {/* Email */}
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
                placeholder="alice@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isPending}
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-900 disabled:opacity-50 transition-shadow"
              />
              {fieldErrors.email &&
                fieldErrors.email.map((msg, i) => (
                  <p key={i} className="text-red-400 text-sm">
                    {msg}
                  </p>
                ))}
            </div>

            {/* Password */}
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
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
                className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder-zinc-500 text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-900 disabled:opacity-50 transition-shadow"
              />
              {fieldErrors.password ? (
                fieldErrors.password.map((msg, i) => (
                  <p key={i} className="text-red-400 text-sm">
                    {msg}
                  </p>
                ))
              ) : (
                <p className="text-zinc-500 text-xs">Minimum 8 characters</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-lg bg-green-900 hover:bg-green-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm px-4 py-2.5 transition-colors duration-200 cursor-pointer mt-1"
            >
              {isPending ? "Creating account…" : "Create Account"}
            </button>
          </form>

          {/* ── Sign-in link ── */}
          <p className="text-center text-zinc-400 text-sm">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-green-400 hover:text-green-300 font-medium transition-colors duration-150"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
