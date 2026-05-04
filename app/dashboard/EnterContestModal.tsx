"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/app/lib/api";

interface EnterContestModalProps {
  onClose: () => void;
  contestToEnter: {
    contestId: string;
    title: string;
    contestDuration: number;
    startTime: string;
    problems: number[];
    creatorId: string;
    creatorUsername?: string;
  };
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatStartTime(startTime: string) {
  const date = new Date(startTime);
  if (Number.isNaN(date.getTime())) return "Unavailable";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function EnterContestModal({
  onClose,
  contestToEnter,
}: EnterContestModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [isNavigating, startTransition] = useTransition();
  const [isEntering, setIsEntering] = useState(false);
  const [topError, setTopError] = useState<string | null>(null);
  const isPending = isEntering || isNavigating;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isPending, onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === overlayRef.current && !isPending) onClose();
  }

  function handleEnterContest() {
    if (isPending) return;

    setTopError(null);
    setIsEntering(true);

    apiFetch("/v1/api/contest/enter", {
      method: "POST",
      body: JSON.stringify({ contestId: contestToEnter.contestId }),
    })
      .then(async (res) => {
        if (res.status === 201 || res.status === 200) {
          startTransition(() => {
            router.push(
              `/contest/${encodeURIComponent(contestToEnter.contestId)}`,
            );
          });
          return;
        }

        const data = (await res.json().catch(() => ({}))) as {
          message?: string;
        };

        if (res.status === 401) {
          setTopError("You must be signed in to enter this contest.");
          setIsEntering(false);
          return;
        }

        if (res.status === 404) {
          setTopError("This contest could not be found.");
          setIsEntering(false);
          return;
        }

        setTopError(
          data.message ?? "Something went wrong. Please try again.",
        );
        setIsEntering(false);
      })
      .catch(() => {
        setTopError("Something went wrong. Please try again.");
        setIsEntering(false);
      });
  }

  const details = [
    {
      label: "Creator",
      value: contestToEnter.creatorUsername ?? contestToEnter.creatorId,
    },
    {
      label: "Problems",
      value: String(contestToEnter.problems.length),
    },
    {
      label: "Duration",
      value: formatDuration(contestToEnter.contestDuration),
    },
    {
      label: "Start Time",
      value: formatStartTime(contestToEnter.startTime),
    },
  ];

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-zinc-950/80 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/60 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-800 shrink-0">
          <div>
            <h2 className="text-zinc-100 font-bold text-xl tracking-tight">
              {contestToEnter.title}
            </h2>
            <p className="text-zinc-500 text-sm mt-0.5">
              Review contest details before entering.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            aria-label="Close modal"
            className="text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 p-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
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

        <div className="flex flex-col gap-5 px-6 py-6 overflow-y-auto">
          {topError && (
            <div className="rounded-lg bg-red-950/60 border border-red-800/50 px-4 py-3">
              <p className="text-red-400 text-sm">{topError}</p>
            </div>
          )}

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {details.map((detail) => (
              <div
                key={detail.label}
                className="rounded-lg border border-zinc-800 bg-zinc-950/50 px-4 py-3"
              >
                <dt className="text-zinc-500 text-xs font-semibold uppercase tracking-widest">
                  {detail.label}
                </dt>
                <dd className="mt-1 text-zinc-100 text-sm font-medium tabular-nums">
                  {detail.value}
                </dd>
              </div>
            ))}
          </dl>

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
              type="button"
              onClick={handleEnterContest}
              disabled={isPending}
              className="
                flex-1 rounded-lg bg-green-900 hover:bg-green-800
                disabled:opacity-60 disabled:cursor-not-allowed
                text-white font-semibold text-sm px-4 py-2.5
                transition-colors duration-200 cursor-pointer
                inline-flex items-center justify-center gap-2
              "
            >
              {isPending && (
                <span
                  aria-hidden="true"
                  className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
                />
              )}
              {isPending ? "Entering..." : "Enter Contest"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
