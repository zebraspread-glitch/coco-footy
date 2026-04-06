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
import React, { useEffect, useState } from "react";

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
    "px-6 py-2 rounded-full text-sm font-semibold border transition-all duration-300";

  const activeStyle =
    color === "blue"
      ? "bg-blue-500 text-black border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.35)]"
      : "bg-red-500 text-black border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.35)]";

  const inactiveStyle =
    "bg-[#111827]/90 text-white/80 border-white/10 hover:bg-white/10 hover:border-white/20";

  const disabledStyle =
    "bg-[#111827] text-white/40 border-white/10 cursor-not-allowed opacity-60";

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
  is2026,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  cta: string;
  href: string;
  is2026: boolean;
}) {
  return (
    <a
      href={href}
      className="group relative overflow-hidden rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(18,18,22,0.96)_0%,rgba(7,7,9,0.98)_100%)] p-7 shadow-[0_12px_40px_rgba(0,0,0,0.50)] transition-all duration-300 hover:-translate-y-1.5 hover:border-white/20 hover:shadow-[0_20px_60px_rgba(0,0,0,0.65)]"
    >
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-px ${
          is2026
            ? "bg-gradient-to-r from-transparent via-red-400/80 to-transparent"
            : "bg-gradient-to-r from-transparent via-blue-400/80 to-transparent"
        }`}
      />

      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full blur-3xl opacity-20 ${
          is2026 ? "bg-red-500" : "bg-blue-500"
        }`}
      />

      <div
        className={`relative mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border backdrop-blur-sm shadow-lg ${
          is2026
            ? "border-red-400/30 bg-red-500/15 text-red-300 shadow-red-500/10"
            : "border-blue-400/30 bg-blue-500/15 text-blue-300 shadow-blue-500/10"
        }`}
      >
        {icon}
      </div>

      <h3 className="relative mb-3 text-[2rem] leading-none font-black italic tracking-wide text-white">
        {title}
      </h3>

      <p className="relative mb-7 text-[15px] leading-7 text-white/70">
        {desc}
      </p>

      <div
        className={`relative inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold tracking-wide transition-all duration-300 ${
          is2026
            ? "border-red-400/25 bg-red-500/10 text-red-300 group-hover:border-red-300/40 group-hover:bg-red-500/15"
            : "border-blue-400/25 bg-blue-500/10 text-blue-300 group-hover:border-blue-300/40 group-hover:bg-blue-500/15"
        }`}
      >
        <span>{cta}</span>
        <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
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
      className="group flex items-center gap-4 rounded-xl border border-white/10 bg-[#0f172a] px-4 py-3 shadow-md hover:bg-[#111827] hover:scale-[1.01] transition"
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

function FeatureBanner({
  href,
  title,
  desc,
  cta,
  icon,
  is2026,
  badge = "",
  backgroundClassName,
}: {
  href: string;
  title: string;
  desc: string;
  cta: string;
  icon: React.ReactNode;
  is2026: boolean;
  badge?: string;
  backgroundClassName?: string;
}) {
  return (
    <div className="mt-6">
      <a
        href={href}
        className={`group relative flex flex-col justify-between gap-4 overflow-hidden rounded-[28px] border border-white/12 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.50)] transition-all duration-300 hover:-translate-y-1.5 hover:border-white/20 hover:shadow-[0_20px_60px_rgba(0,0,0,0.65)] md:flex-row md:items-center ${
          backgroundClassName ??
          "bg-[linear-gradient(180deg,rgba(12,24,56,0.95)_0%,rgba(8,14,32,0.98)_100%)]"
        }`}
      >
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 h-px ${
            is2026
              ? "bg-gradient-to-r from-transparent via-red-400/80 to-transparent"
              : "bg-gradient-to-r from-transparent via-blue-400/80 to-transparent"
          }`}
        />

        <div
          className={`pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full blur-3xl opacity-20 ${
            is2026 ? "bg-red-500" : "bg-blue-500"
          }`}
        />

        <div className="relative flex items-center gap-4">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl border backdrop-blur-sm shadow-lg ${
              is2026
                ? "border-red-400/30 bg-red-500/15 text-red-300 shadow-red-500/10"
                : "border-blue-400/30 bg-blue-500/15 text-blue-300 shadow-blue-500/10"
            }`}
          >
            {icon}
          </div>

          <div>
            <div className="text-2xl md:text-3xl font-black italic tracking-wide text-white">
              {title}
            </div>
            <div className="mt-1 text-sm text-white/70">{desc}</div>
          </div>
        </div>

        <div className="relative flex items-center gap-3">
          <span className="rounded-full border border-white/12 bg-white/10 px-3 py-1 text-[11px] font-bold tracking-wide text-white/85">
            {badge}
          </span>

          <div
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold tracking-wide transition-all duration-300 ${
              is2026
                ? "border-red-400/25 bg-red-500/10 text-red-300 group-hover:border-red-300/40 group-hover:bg-red-500/15"
                : "border-blue-400/25 bg-blue-500/10 text-blue-300 group-hover:border-blue-300/40 group-hover:bg-blue-500/15"
            }`}
          >
            <span>{cta}</span>
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </div>
        </div>
      </a>
    </div>
  );
}

export default function Home() {
  const [season, setSeason] = useState<"2025" | "2026">("2025");
  const [showVersion, setShowVersion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const urlSeason = params.get("season");
    const savedSeason = localStorage.getItem("selectedSeason");

    if (urlSeason === "2025" || urlSeason === "2026") {
      setSeason(urlSeason);
      localStorage.setItem("selectedSeason", urlSeason);
    } else if (savedSeason === "2025" || savedSeason === "2026") {
      setSeason(savedSeason);
    }

    const timer = setTimeout(() => {
      setShowVersion(true);
    }, 250);

    return () => clearTimeout(timer);
  }, []);

  const changeSeason = (nextSeason: "2025" | "2026") => {
    setSeason(nextSeason);

    if (typeof window !== "undefined") {
      localStorage.setItem("selectedSeason", nextSeason);

      const params = new URLSearchParams(window.location.search);
      params.set("season", nextSeason);
      const nextUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, "", nextUrl);
    }
  };

  const is2026 = season === "2026";
  const seasonHref = (path: string) => `${path}?season=${season}`;

  return (
    <div
      className="min-h-screen text-white bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/coco-footy-bg.png')",
      }}
    >
      <style jsx>{`
        @keyframes slamIn {
          0% {
            opacity: 0;
            transform: translateY(-90px) scale(2.2) rotate(-10deg);
            filter: blur(8px);
          }
          55% {
            opacity: 1;
            transform: translateY(12px) scale(0.88) rotate(3deg);
            filter: blur(0px);
          }
          72% {
            transform: translateY(-4px) scale(1.08) rotate(-1deg);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1) rotate(0deg);
            filter: blur(0px);
          }
        }

        @keyframes slamShockwave {
          0% {
            opacity: 0;
            transform: scale(0.4);
          }
          40% {
            opacity: 0.55;
          }
          100% {
            opacity: 0;
            transform: scale(1.8);
          }
        }
      `}</style>

      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_50%_-10%,rgba(245,158,11,0.16),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_50%_110%,rgba(255,255,255,0.06),transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.10] [background-image:radial-gradient(rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
      </div>

      <main className="max-w-6xl mx-auto px-6 py-14">
        <div className="text-center">
          <div className="relative inline-flex items-center justify-center">
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
              <span className="[text-shadow:_-1px_-1px_0_#000,_1px_-1px_0_#000,_-1px_1px_0_#000,_1px_1px_0_#000]">
                COCO FOOTY
              </span>

              <span className="relative inline-block ml-3 md:ml-4 align-top">
                {showVersion && (
                  <>
                    <span
                      className="absolute left-1/2 top-1/2 h-12 w-12 md:h-16 md:w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/60"
                      style={{
                        animation: "slamShockwave 0.6s ease-out forwards",
                      }}
                    />
                    <span
                      className="inline-block text-[1.6rem] md:text-[2.5rem] font-extrabold italic text-cyan-300 [text-shadow:_0_0_10px_rgba(103,232,249,0.6),_-1px_-1px_0_#000,_1px_-1px_0_#000,_-1px_1px_0_#000,_1px_1px_0_#000]"
                      style={{
                        animation: "slamIn 0.72s cubic-bezier(.2,.9,.22,1.15) forwards",
                        transformOrigin: "center center",
                      }}
                    >
                      2.0
                    </span>
                  </>
                )}
              </span>
            </h1>
          </div>

          <p className="mt-4 text-white/60 text-sm tracking-wide">
            In memory of Cody Welch
          </p>

          <div className="mt-8 flex items-center justify-center gap-4">
            <Pill label="AFL" active color={is2026 ? "red" : "blue"} />

            <div className="w-10" />

            <Pill
              label="2025"
              active={season === "2025"}
              color={is2026 ? "red" : "blue"}
              onClick={() => changeSeason("2025")}
            />

            <Pill
              label="2026"
              active={season === "2026"}
              color={is2026 ? "red" : "blue"}
              onClick={() => changeSeason("2026")}
            />
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card
            icon={<Gem className="h-6 w-6" />}
            title="DAILY GAME"
            desc="Build the perfect lineup from today's randomly selected teams."
            cta="PLAY TODAY"
            href={seasonHref("/daily")}
            is2026={is2026}
          />

          <Card
            icon={<Flame className="h-6 w-6" />}
            title="UNLIMITED"
            desc="Draft endlessly and try to beat your personal high score."
            cta="PLAY NOW"
            href={seasonHref("/unlimited")}
            is2026={is2026}
          />

          <Card
            icon={<Swords className="h-6 w-6" />}
            title="TWO PLAYER"
            desc="Local 1v1. Go head-to-head with a friend on the same device."
            cta="PLAY VERSUS"
            href={seasonHref("/versus")}
            is2026={is2026}
          />
        </div>

        <FeatureBanner
          href={seasonHref("/streak")}
          title="PLAYER NUMBER STREAK"
          desc="Guess jumper numbers and build a streak."
          cta="PLAY STREAK"
          icon={<Zap className="h-6 w-6" />}
          is2026={is2026}
          backgroundClassName="bg-[linear-gradient(180deg,rgba(12,24,56,0.95)_0%,rgba(8,14,32,0.98)_100%)]"
        />

        <FeatureBanner
          href={seasonHref("/higher-or-lower")}
          title="HIGHER OR LOWER"
          desc="Guess if the next player has higher or lower stats."
          cta="PLAY NOW"
          icon={<Flame className="h-6 w-6" />}
          is2026={is2026}
          badge="NEW"
          backgroundClassName="bg-[linear-gradient(180deg,rgba(12,24,56,0.95)_0%,rgba(8,14,32,0.98)_100%)]"
        />

        <div className="mt-6">
          <div className="text-left mb-3">
            <div className="text-sm font-extrabold tracking-widest text-white/80">
              MORE MODES
            </div>
          </div>

          <div className="space-y-3">
            <ModeButton
              href={seasonHref("/playoff")}
              label="Finals Predictor"
              icon={<Trophy className="h-5 w-5 text-white/85" />}
            />

            <ModeButton
              href={seasonHref("/player-rankings")}
              label="Player Ranking"
              icon={<ListOrdered className="h-5 w-5 text-white/85" />}
            />

            <ModeButton
              href={seasonHref("/power-rankings")}
              label="Power Rankings"
              icon={<TrendingUp className="h-5 w-5 text-white/85" />}
            />

            <ModeButton
              href={seasonHref("/roster-builder")}
              label="Roster Builder"
              icon={<Users className="h-5 w-5 text-white/85" />}
            />

            <ModeButton
              href={seasonHref("/awards")}
              label="Awards"
              icon={<Award className="h-5 w-5 text-white/85" />}
            />
          </div>
        </div>

        <footer className="mt-12 text-center text-xs text-white/40">
          {"Footy Pick’em"}
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