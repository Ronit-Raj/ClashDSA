"use client";

interface ContestCardProps {
  contestId: string;
  title: string;
  /** Duration in minutes */
  duration: number;
  noOfProblems: number;
  creator?: string;
  status: "live" | "upcoming" | "past";
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export default function ContestCard({
  title,
  duration,
  noOfProblems,
  creator,
  status,
}: ContestCardProps) {
  return (
    <div
      className="
        group flex flex-col gap-4
        bg-zinc-900 border border-zinc-800 rounded-xl p-5
        hover:border-green-900 hover:bg-green-900/10
        transition-all duration-200 cursor-pointer
      "
    >
      {/* ── Top row: status badge + duration ── */}
      <div className="flex items-center justify-between">
        {status === "live" && (
          <span className="flex items-center gap-1.5 text-green-400 text-xs font-semibold uppercase tracking-widest">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            Live
          </span>
        )}
        {status === "upcoming" && (
          <span className="text-yellow-400 text-xs font-semibold uppercase tracking-widest">
            Upcoming
          </span>
        )}
        {status === "past" && (
          <span className="text-zinc-600 text-xs font-semibold uppercase tracking-widest">
            Ended
          </span>
        )}

        <span className="text-zinc-500 text-sm tabular-nums">
          {formatDuration(duration)}
        </span>
      </div>

      {/* ── Title ── */}
      <h2 className="text-zinc-100 font-bold text-xl leading-snug group-hover:text-white transition-colors line-clamp-2">
        {title}
      </h2>

      {/* ── Meta row ── */}
      <div className="mt-auto flex items-center gap-2 text-zinc-500 text-sm">
        <span>
          {noOfProblems} {noOfProblems === 1 ? "problem" : "problems"}
        </span>
        <span className="text-zinc-700">·</span>
        <span className="truncate">{creator ?? "—"}</span>
      </div>
    </div>
  );
}
