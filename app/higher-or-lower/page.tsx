"use client";

import Link from "next/link";

export default function HigherOrLowerPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute bottom-[-120px] left-[-80px] h-[280px] w-[280px] rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute right-[-80px] top-[-120px] h-[280px] w-[280px] rounded-full bg-red-600/10 blur-3xl" />
      </div>

      {/* Grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)
          `,
          backgroundSize: "42px 42px",
        }}
      />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-3xl">
          <div className="rounded-[32px] border border-white/10 bg-white/5 px-8 py-12 shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:px-12 sm:py-14">
            <div className="mx-auto max-w-2xl text-center">
              <div className="mb-4 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
                Game Mode Select
              </div>

              <h1 className="text-4xl font-black italic tracking-tight text-white drop-shadow-[0_4px_20px_rgba(255,255,255,0.12)] sm:text-6xl">
                HIGHER OR LOWER
              </h1>

              <p className="mx-auto mt-4 max-w-md text-sm text-white/65 sm:text-base">
                Pick your mode and start climbing the leaderboard with a cleaner,
                faster and more polished game experience.
              </p>

              <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Link
                  href="/higher-or-lower/daily"
                  className="group relative overflow-hidden rounded-3xl border border-blue-400/20 bg-gradient-to-br from-blue-500 to-blue-700 p-[1px] transition duration-300 hover:scale-[1.02] hover:shadow-[0_12px_40px_rgba(37,99,235,0.35)]"
                >
                  <div className="relative rounded-3xl bg-black/70 px-6 py-6 backdrop-blur-xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-60" />
                    <div className="relative z-10 text-left">
                      <div className="mb-3 inline-flex rounded-full bg-blue-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-blue-200">
                        Daily Challenge
                      </div>
                      <h2 className="text-2xl font-black italic text-white">
                        DAILY
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-white/65">
                        One run per day. Lock in your score and come back
                        tomorrow for a fresh challenge.
                      </p>

                      <div className="mt-6 inline-flex items-center text-sm font-bold text-blue-300 transition group-hover:translate-x-1">
                        Play now →
                      </div>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/higher-or-lower/unlimited"
                  className="group relative overflow-hidden rounded-3xl border border-red-400/20 bg-gradient-to-br from-red-500 to-red-700 p-[1px] transition duration-300 hover:scale-[1.02] hover:shadow-[0_12px_40px_rgba(220,38,38,0.35)]"
                >
                  <div className="relative rounded-3xl bg-black/70 px-6 py-6 backdrop-blur-xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-60" />
                    <div className="relative z-10 text-left">
                      <div className="mb-3 inline-flex rounded-full bg-red-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-red-200">
                        Endless Mode
                      </div>
                      <h2 className="text-2xl font-black italic text-white">
                        UNLIMITED
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-white/65">
                        Keep going as long as you can and chase your all-time
                        high score.
                      </p>

                      <div className="mt-6 inline-flex items-center text-sm font-bold text-red-300 transition group-hover:translate-x-1">
                        Play now →
                      </div>
                    </div>
                  </div>
                </Link>
              </div>

              <div className="mt-8 text-xs uppercase tracking-[0.22em] text-white/35">
                
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}