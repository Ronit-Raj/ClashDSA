"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { apiFetch } from "@/app/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void;
  /** Called after a successful 201 so the dashboard can refresh its list */
  onCreated: () => void;
}

type FieldErrors = Partial<
  Record<"title" | "duration" | "startTime" | "noOfProblems", string[]>
>;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Format a Date to the value string expected by <input type="datetime-local"> */
function toDatetimeLocalValue(date: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}` +
    `T${p(date.getHours())}:${p(date.getMinutes())}`
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CreateContestModal({ onClose, onCreated }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();

  // Seed start time 10 minutes from now
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(60);
  const [startTime, setStartTime] = useState(() =>
    toDatetimeLocalValue(new Date(Date.now() + 10 * 60 * 1000)),
  );
  const [noOfProblems, setNoOfProblems] = useState(3);
  const [isPublic, setIsPublic] = useState(true);

  const [topError, setTopError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Prevent background scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === overlayRef.current) onClose();
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTopError(null);
    setFieldErrors({});

    startTransition(async () => {
      try {
        const res = await apiFetch("/v1/api/contest/create", {
          method: "POST",
          body: JSON.stringify({
            contestId: crypto.randomUUID(),
            title: title.trim(),
            duration,
            startTime: new Date(startTime).toISOString(),
            noOfProblems,
            public: isPublic,
          }),
        });

        // 201 = created, 200 = UUID collision (treated as success)
        if (res.status === 201 || res.status === 200) {
          onCreated();
          onClose();
          return;
        }

        const data = await res.json().catch(() => ({}));

        if (res.status === 400) {
          if (data.message) setTopError(data.message as string);
          if (data.errors) setFieldErrors(data.errors as FieldErrors);
          return;
        }

        if (res.status === 401) {
          setTopError("You must be signed in to create a contest.");
          return;
        }

        setTopError(
          (data.message as string | undefined) ??
            "Something went wrong. Please try again.",
        );
      } catch {
        setTopError("Something went wrong. Please try again.");
      }
    });
  }

  const inputCls =
    "w-full rounded-lg bg-zinc-800 border border-zinc-700 " +
    "text-zinc-100 placeholder-zinc-500 text-sm px-3.5 py-2.5 " +
    "focus:outline-none focus:ring-2 focus:ring-green-900 " +
    "disabled:opacity-50 transition-shadow [color-scheme:dark]";

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-zinc-950/80 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/60 flex flex-col max-h-[90vh]">
        {/* ── Modal header ── */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-800 shrink-0">
          <div>
            <h2 className="text-zinc-100 font-bold text-xl tracking-tight">
              Create a Contest
            </h2>
            <p className="text-zinc-500 text-sm mt-0.5">
              Fill in the details below to get started.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 p-1.5 rounded-lg transition-colors"
          >
            {/* X icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Scrollable form body ── */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-5 px-6 py-6 overflow-y-auto"
        >
          {/* Top-level error banner */}
          {topError && (
            <div className="rounded-lg bg-red-950/60 border border-red-800/50 px-4 py-3">
              <p className="text-red-400 text-sm">{topError}</p>
            </div>
          )}

          {/* ── Title ── */}
          <div className="flex flex-col gap-1.5">
            <label className="text-zinc-300 text-sm font-medium">
              Contest Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Friday Clash"
              minLength={3}
              maxLength={100}
              required
              disabled={isPending}
              className={inputCls}
            />
            {fieldErrors.title?.length ? (
              <p className="text-red-400 text-xs">{fieldErrors.title[0]}</p>
            ) : (
              <p className="text-zinc-600 text-xs">3–100 characters</p>
            )}
          </div>

          {/* ── Duration + No. of Problems (2-col) ── */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-zinc-300 text-sm font-medium">
                Duration{" "}
                <span className="text-zinc-600 font-normal">(minutes)</span>
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                min={1}
                required
                disabled={isPending}
                className={inputCls}
              />
              {fieldErrors.duration?.length ? (
                <p className="text-red-400 text-xs">
                  {fieldErrors.duration[0]}
                </p>
              ) : (
                <p className="text-zinc-600 text-xs">Min 1 minute</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-zinc-300 text-sm font-medium">
                No. of Problems
              </label>
              <input
                type="number"
                value={noOfProblems}
                onChange={(e) => setNoOfProblems(Number(e.target.value))}
                min={1}
                max={10}
                required
                disabled={isPending}
                className={inputCls}
              />
              {fieldErrors.noOfProblems?.length ? (
                <p className="text-red-400 text-xs">
                  {fieldErrors.noOfProblems[0]}
                </p>
              ) : (
                <p className="text-zinc-600 text-xs">1–10 problems</p>
              )}
            </div>
          </div>

          {/* ── Start Time ── */}
          <div className="flex flex-col gap-1.5">
            <label className="text-zinc-300 text-sm font-medium">
              Start Time
            </label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              disabled={isPending}
              className={inputCls}
            />
            {fieldErrors.startTime?.length ? (
              <p className="text-red-400 text-xs">{fieldErrors.startTime[0]}</p>
            ) : (
              <p className="text-zinc-600 text-xs">
                Shown in your local timezone — sent as UTC to the server.
              </p>
            )}
          </div>

          {/* ── Public toggle ── */}
          <div className="flex items-center justify-between py-1">
            <div className="flex flex-col gap-0.5">
              <span className="text-zinc-300 text-sm font-medium">
                Public Contest
              </span>
              <span className="text-zinc-600 text-xs">
                Visible to everyone on the dashboard
              </span>
            </div>

            {/* Toggle switch */}
            <button
              type="button"
              role="switch"
              aria-checked={isPublic}
              onClick={() => setIsPublic((v) => !v)}
              disabled={isPending}
              className={[
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full",
                "transition-colors duration-200",
                "focus:outline-none focus:ring-2 focus:ring-green-900 focus:ring-offset-2 focus:ring-offset-zinc-900",
                "disabled:cursor-not-allowed disabled:opacity-50",
                isPublic ? "bg-green-900" : "bg-zinc-700",
              ].join(" ")}
            >
              <span
                className={[
                  "inline-block h-5 w-5 rounded-full bg-white shadow-sm",
                  "mt-0.5 transition-transform duration-200",
                  isPublic ? "translate-x-5.5" : "translate-x-0.5",
                ].join(" ")}
              />
            </button>
          </div>

          {/* ── Footer ── */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="
                flex-1 rounded-lg border border-zinc-700
                hover:border-green-900 hover:bg-green-900/10
                text-zinc-300 font-semibold text-sm px-4 py-2.5
                transition-colors duration-200
                disabled:opacity-50 cursor-pointer
              "
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="
                flex-1 rounded-lg bg-green-900 hover:bg-green-800
                disabled:opacity-60 disabled:cursor-not-allowed
                text-white font-semibold text-sm px-4 py-2.5
                transition-colors duration-200 cursor-pointer
              "
            >
              {isPending ? "Creating…" : "Create Contest"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
