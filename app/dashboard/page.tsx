"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import { useRouter } from "next/navigation";
import ContestCard from "./ContestCard";
import CreateContestModal from "./CreateContestModal";
import EnterContestModal from "./EnterContestModal";
import { apiFetch } from "@/app/lib/api";
import { Contest } from "@/app/types";  


// ── Helpers ───────────────────────────────────────────────────────────────────

function getStatus(
  startTime: string,
  duration: number,
): "live" | "upcoming" | "past" {
  const now = Date.now();
  const startDate = new Date(startTime);
  const endDate = new Date(startDate.getTime() + duration * 60 * 1000);
  if (now < startDate.getTime()) return "upcoming";
  if (now < endDate.getTime()) return "live";
  return "past";
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function ContestsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4 animate-pulse"
        >
          <div className="flex justify-between">
            <div className="h-3 w-8 bg-zinc-800 rounded" />
            <div className="h-3 w-12 bg-zinc-800 rounded" />
          </div>
          <div className="h-5 w-3/4 bg-zinc-800 rounded" />
          <div className="h-3 w-1/2 bg-zinc-800 rounded" />
        </div>
      ))}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [contests, setContests] = useState<Contest[]>([]);
  const [contestsLoading, setContestsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [contestToEnter, setContestToEnter] = useState<Contest | null>(null);

  // Auth guard — redirect unauthenticated users after session check settles
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, user, router]);

  // Fetches public contests — all setState calls are async (inside Promise
  // callbacks) so this is safe to call from both effects and event handlers.
  // setContestsLoading(true) is NOT called here: the initial state is already
  // true, and when re-fetching after a creation the caller sets it explicitly.
  function fetchContests() {
    apiFetch("/v1/api/contest/getPublicContests")
      .then((res) => res.json())
      .then((data: Contest[]) => setContests(data))
      .catch((err) => console.error("Failed to fetch contests:", err))
      .finally(() => setContestsLoading(false));
  }

  // Public contests — no auth required (empty dep array is intentional)
  useEffect(() => {
    fetchContests();
  }, []);

  // Still checking session or about to redirect — render nothing
  if (authLoading || !user) return null;

  // Partition by status
  const liveContests = contests.filter(
    (c) => getStatus(c.startTime, c.contestDuration) === "live",
  );
  const upcomingContests = contests.filter(
    (c) => getStatus(c.startTime, c.contestDuration) === "upcoming",
  );
  const pastContests = contests.filter(
    (c) => getStatus(c.startTime, c.contestDuration) === "past",
  );

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10">
      <div className="max-w-6xl mx-auto flex flex-col gap-12">
        {/* ── Page header ── */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-zinc-100 font-bold text-3xl tracking-tight">
              Welcome back,{" "}
              <span className="text-green-400">{user.username}</span>
            </h1>
            <p className="text-zinc-500 text-sm">
              Browse and join public contests below.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="
              shrink-0 flex items-center gap-2
              rounded-lg bg-green-900 hover:bg-green-800
              text-white font-semibold text-sm
              px-4 py-2.5
              transition-colors duration-200
              cursor-pointer
            "
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Contest
          </button>
        </div>

        {/* ── Currently Running ── */}
        <section className="flex flex-col gap-5">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            <h2 className="text-zinc-100 font-semibold text-lg">
              Currently Running
            </h2>
            {!contestsLoading && (
              <span className="text-zinc-600 text-sm">
                ({liveContests.length})
              </span>
            )}
          </div>

          {contestsLoading ? (
            <ContestsSkeleton />
          ) : liveContests.length === 0 ? (
            <p className="text-zinc-600 text-sm py-8 text-center border border-zinc-800/60 rounded-xl">
              No contests are running right now.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveContests.map((c) => (
                <ContestCard
                  key={c.contestId}
                  contestId={c.contestId}
                  title={c.title}
                  duration={c.contestDuration}
                  noOfProblems={c.problems.length}
                  status="live"
                  creator={c.creatorUsername}
                  onClick={() => setContestToEnter(c)}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Upcoming Contests ── */}
        <section className="flex flex-col gap-5">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-yellow-400" />
            <h2 className="text-zinc-100 font-semibold text-lg">Upcoming</h2>
            {!contestsLoading && (
              <span className="text-zinc-600 text-sm">
                ({upcomingContests.length})
              </span>
            )}
          </div>

          {contestsLoading ? (
            <ContestsSkeleton />
          ) : upcomingContests.length === 0 ? (
            <p className="text-zinc-600 text-sm py-8 text-center border border-zinc-800/60 rounded-xl">
              No upcoming contests scheduled.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingContests.map((c) => (
                <ContestCard
                  key={c.contestId}
                  contestId={c.contestId}
                  title={c.title}
                  duration={c.contestDuration}
                  noOfProblems={c.problems.length}
                  status="upcoming"
                  startTime={c.startTime}
                  creator={c.creatorUsername}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Past Contests ── */}
        <section className="flex flex-col gap-5">
          <div className="flex items-center gap-2.5">
            <h2 className="text-zinc-100 font-semibold text-lg">
              Past Contests
            </h2>
            {!contestsLoading && (
              <span className="text-zinc-600 text-sm">
                ({pastContests.length})
              </span>
            )}
          </div>

          {contestsLoading ? (
            <ContestsSkeleton />
          ) : pastContests.length === 0 ? (
            <p className="text-zinc-600 text-sm py-8 text-center border border-zinc-800/60 rounded-xl">
              No past contests yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastContests.map((c) => (
                <ContestCard
                  key={c.contestId}
                  contestId={c.contestId}
                  title={c.title}
                  duration={c.contestDuration}
                  noOfProblems={c.problems.length}
                  status="past"
                  creator={c.creatorUsername}
                  onClick={() => setContestToEnter(c)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Create Contest Modal ── */}
      {showModal && (
        <CreateContestModal
          onClose={() => setShowModal(false)}
          onCreated={() => {
            // Called from a click handler — safe to call setState synchronously
            setContestsLoading(true);
            fetchContests();
          }}
        />
      )}

      {/* ── Enter Contest Modal ── */}
      {contestToEnter && (
        <EnterContestModal
          onClose={() => setContestToEnter(null)}
          contestToEnter={contestToEnter}
        />
      )}
    </main>
  );
}
