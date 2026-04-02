"use client";

import {
  Flame,
  Gem,
  Swords,
  Zap,
  Trophy,
  ListOrdered,
  TrendingUp,
  Users,
  Award,
} from "lucide-react";
import AccountDropdown from "../components/AccountDropdown";
import React, { useState } from "react";

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="text-sm text-white/80 hover:text-white transition"
    >
      {label}
    </a>
  );
}

function Pill({
  active,
  label,
  onClick,
  color,
  disabled,
}: {
  active?: boolean;
  label: string;
  onClick?: () => void;
  color: "blue" | "red";
  disabled?: boolean;
}) {
  const base =
    "px-6 py-2 rounded-full text-sm font-semibold border transition";

  const activeStyle =
    color === "blue"
      ? "bg-blue-500 text-black border-blue-500"
      : "bg-red-500 text-black border-red-500";

  const inactiveStyle =
    "bg-white/5 text-white/80 border-white/10 hover:bg-white/10";

  const disabledStyle =
    "bg-white/5 text-white/40 border-white/10 cursor-not-allowed opacity-60";

  return (
    <button
      onClick={!disabled ? onClick : undefined}
      disabled={disabled}
      className={`${base} ${
        disabled
          ? disabledStyle
          : active
          ? activeStyle
          : inactiveStyle
      }`}
    >
      {label}
    </button>
  );
}

function Card({
  icon,
  title,
  desc,
  cta,
  href,
  mode,
  is2026,
}: {
  
  icon: React.ReactNode;
  title: string;
  desc: string;
  cta: string;
  href: string;
  mode: "season" | "game";
    is2026: boolean;
}) {
  return (
    <a
      href={href}
      className="group rounded-2xl border border-white/10 bg-black/35 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] hover:bg-white/7 transition"
    >
      <div
        className={`h-12 w-12 rounded-2xl text-black flex items-center justify-center mb-5 ${
          is2026 ? "bg-red-500/95" : "bg-blue-500/95"
        }`}
      >
        {icon}
      </div>
      <h3 className="text-xl font-extrabold tracking-wide italic mb-2">
        {title}
      </h3>
      <p className="text-sm text-white/70 leading-relaxed mb-6">{desc}</p>
      <div
        className={`font-semibold text-sm ${
          is2026
  ? "text-red-400 hover:text-red-300"
  : "text-blue-400 hover:text-blue-300"
        }`}
      >
        {cta}{" "}
        <span className="inline-block group-hover:translate-x-1 transition">
          →
        </span>
      </div>
    </a>
  );
}

function ModeButton({
  href,
  label,
  icon,
  badge,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}) {
  return (
    <a
      href={href}
      className="group flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3 hover:bg-white/10 transition"
    >
      <div className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center">
        {icon}
      </div>

      <div className="flex-1 font-semibold text-white/90">{label}</div>

      {badge ? (
        <span className="text-[11px] bg-white/10 border border-white/10 px-2 py-1 rounded">
          {badge}
        </span>
      ) : null}

      <span className="text-white/40 group-hover:text-white/70 transition">
        →
      </span>
    </a>
  );
}

export default function Home() {
  const [mode, setMode] = useState<"season" | "game">("season");
  const [season, setSeason] = useState<"2025" | "2026">("2025");
  
  const is2026 = season === "2026";

  return (
    <div
      className="min-h-screen text-white bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/coco-footy-bg.png')",
      }}
    >
      {/* Background texture + vignette */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_50%_-10%,rgba(245,158,11,0.16),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_50%_110%,rgba(255,255,255,0.06),transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.10] [background-image:radial-gradient(rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
      </div>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-6 py-14">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-black tracking-tight">
            COCO{" "}
            <span className={is2026 ? "text-red-500" : "text-blue-500"}>
              FOOTY
            </span>
          </h1>
          <p className="mt-3 text-white/70">
            Tip the winners each round and climb the ladder.
          </p>

          <div className="mt-8 flex items-center justify-center gap-4">
            <Pill
              label="AFL"
              active
              color={is2026 ? "red" : "blue"}
            />

            <div className="w-10" />

            <Pill
  label="2025"
  active={season === "2025"}
  color={is2026 ? "red" : "blue"}
  onClick={() => setSeason("2025")}
/>

<Pill
  label="2026"
  active={season === "2026"}
  color={is2026 ? "red" : "blue"}
  onClick={() => setSeason("2026")}
/>
          </div>
        </div>

        {/* Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card
            icon={<Gem className="h-6 w-6" />}
            title="DAILY GAME"
            desc="Build the perfect lineup from today's randomly selected teams."
            cta="PLAY TODAY"
            href={`/daily?season=${season}`}
            mode={mode}
            is2026={is2026}
          />
          <Card
            icon={<Flame className="h-6 w-6" />}
            title="UNLIMITED"
            desc="Draft endlessly and try to beat your personal high score."
            cta="PLAY NOW"
            href={`/unlimited?season=${season}`}
            mode={mode}
            is2026={is2026}
          />
          <Card
            icon={<Swords className="h-6 w-6" />}
            title="TWO PLAYER"
            desc="Local 1v1. Go head-to-head with a friend on the same device."
            cta="PLAY VERSUS"
            href={`/versus?season=${season}`}
            mode={mode}
            is2026={is2026}
          />
        </div>

        {/* Wide leaderboard card */}
        <div className="mt-6">
          <a
            href={`/streak?season=${season}`}
            className="group flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-white/15 bg-black/35 p-6 hover:bg-white/7 transition"
          >
            <div className="flex items-center gap-4">
              <div
                className={`h-12 w-12 rounded-2xl flex items-center justify-center ${
                  is2026 ? "bg-red-500/95" : "bg-blue-500/95"
                }`}
              >
                <Zap className="h-6 w-6 text-black" />
              </div>

              <div>
                <div className="text-2xl font-black italic tracking-wide">
                  PLAYER NUMBER STREAK
                </div>
                <div className="text-sm text-white/70">
                  Guess jumper numbers and build a streak.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] bg-white/10 border border-white/10 px-2 py-1 rounded">
                NEW
              </span>

              <div
                className={`font-bold tracking-wide ${
                  is2026 ? "text-red-400" : "text-blue-400"
                }`}
              >
                PLAY STREAK{" "}
                <span className="inline-block group-hover:translate-x-1 transition">
                  →
                </span>
              </div>
            </div>
          </a>
        </div>

        {/* More modes */}
        <div className="mt-6">
          <div className="text-left mb-3">
            <div className="text-sm font-extrabold tracking-widest text-white/80">
              MORE MODES
            </div>
          </div>

          <div className="space-y-3">
            <ModeButton
              href={`/playoff?season=${season}`}
              label="Finals Predictor"
              icon={<Trophy className="h-5 w-5 text-white/85" />}
            />

            <ModeButton
              href={`/player-rankings?season=${season}`}
              label="Player Ranking"
              icon={<ListOrdered className="h-5 w-5 text-white/85" />}
            />

            <ModeButton
              href={`/power-rankings?season=${season}`}
              label="Power Rankings"
              icon={<TrendingUp className="h-5 w-5 text-white/85" />}
            />

            <ModeButton
              href={`/roster-builder?season=${season}`}
              label="Roster Builder"
              icon={<Users className="h-5 w-5 text-white/85" />}
            />

            <ModeButton
              href={`/awards?season=${season}`}
              label="Awards"
              icon={<Award className="h-5 w-5 text-white/85" />}
            />
          </div>
        </div>

        <footer className="mt-12 text-center text-xs text-white/40">
          {"AFL Pick’em • Built by you"}
        </footer>
      </main>
    </div>
  );
}

function AccountSlot() {
  const [hasUser, setHasUser] = React.useState(false);

  React.useEffect(() => {
    const check = () => {
      setHasUser(Boolean(localStorage.getItem("coco_user")));
    };

    check();

    window.addEventListener("storage", check);
    return () => window.removeEventListener("storage", check);
  }, []);

  if (hasUser) {
    return <AccountDropdown statsHref={`/streak`} />;
  }

  return (
    <a
      href="/login"
      className="bg-yellow-50 text-black px-4 py-2 rounded font-bold text-sm hover:opacity-90 transition"
    >
      Sign In
    </a>
  );
}