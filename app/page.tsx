export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center min-h-screen bg-zinc-950 px-6">
      {/* Glow backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
      >
        <div className="h-[500px] w-[700px] rounded-full bg-green-900/20 blur-[120px]" />
      </div>

      <div className="relative flex flex-col items-center gap-8 text-center">
        {/* ── Brand name ── */}
        <div className="flex items-center">
          {/* "Clash" — tilted left, green-900 pill */}
          <span
            className="
              inline-block
              bg-green-900
              text-white
              font-extrabold
              text-7xl sm:text-8xl md:text-9xl
              tracking-tight
              leading-none
              px-5 py-3
              rounded-lg
              -rotate-6
              origin-bottom-right
              shadow-lg shadow-green-950/60
              select-none
              mr-3
            "
          >
            Clash
          </span>

          {/* "DSA" — upright, plain */}
          <span
            className="
              inline-block
              text-zinc-100
              font-extrabold
              text-7xl sm:text-8xl md:text-9xl
              tracking-tight
              leading-none
              select-none
            "
          >
            DSA
          </span>
        </div>

        {/* ── Subheading ── */}
        <p
          className="
            max-w-md
            text-zinc-400
            text-lg sm:text-xl
            leading-relaxed
            font-medium
          "
        >
          Create custom coding contests and compete with your friends
        </p>

        {/* ── CTAs ── */}
        <div className="flex flex-col sm:flex-row gap-4 mt-2">
          <button
            className="
              rounded-lg
              bg-green-900
              hover:bg-green-800
              text-white
              font-semibold
              text-base
              px-8 py-3
              transition-colors duration-200
              cursor-pointer
            "
          >
            Create a Contest
          </button>
          <button
            className="
              rounded-lg
              border border-zinc-700
              hover:border-green-900 hover:bg-green-900/10
              text-zinc-300
              font-semibold
              text-base
              px-8 py-3
              transition-colors duration-200
              cursor-pointer
            "
          >
            Join a Contest
          </button>
        </div>
      </div>
    </main>
  );
}
