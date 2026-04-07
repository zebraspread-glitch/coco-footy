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
import React, { useEffect, useMemo, useState } from "react";

type PrimaryColor =
  | "blue"
  | "red"
  | "green"
  | "yellow"
  | "purple"
  | "orange"
  | "pink";

const SETTINGS_STORAGE_KEY = "cocofooty_settings";

function getAccentClasses(primaryColor: PrimaryColor) {
  switch (primaryColor) {
    case "blue":
      return {
        topLine: "bg-gradient-to-r from-transparent via-sky-400/80 to-transparent",
        glowBlob: "bg-sky-500",
        iconWrap:
          "border-sky-400/30 bg-sky-500/15 text-sky-300 shadow-sky-500/10",
        cta:
          "border-sky-400/25 bg-sky-500/10 text-sky-300 group-hover:border-sky-300/40 group-hover:bg-sky-500/15",
        badge:
          "border-sky-400/25 bg-sky-500/10 text-sky-300",
        softPanel: "border-sky-400/30 bg-sky-500/10 text-sky-300",
        missingTop: "bg-gradient-to-r from-transparent via-sky-400/70 to-transparent",
        missingGlow: "bg-sky-500/10",
        missingIcon: "border-sky-400/30 bg-sky-500/15 text-sky-300 shadow-sky-500/10",
        missingButton:
          "border-sky-400/25 bg-sky-500/10 text-sky-300 group-hover:border-sky-300/40 group-hover:bg-sky-500/15",
      };
    case "green":
      return {
        topLine: "bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent",
        glowBlob: "bg-emerald-500",
        iconWrap:
          "border-emerald-400/30 bg-emerald-500/15 text-emerald-300 shadow-emerald-500/10",
        cta:
          "border-emerald-400/25 bg-emerald-500/10 text-emerald-300 group-hover:border-emerald-300/40 group-hover:bg-emerald-500/15",
        badge:
          "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
        softPanel: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
        missingTop:
          "bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent",
        missingGlow: "bg-emerald-500/10",
        missingIcon:
          "border-emerald-400/30 bg-emerald-500/15 text-emerald-300 shadow-emerald-500/10",
        missingButton:
          "border-emerald-400/25 bg-emerald-500/10 text-emerald-300 group-hover:border-emerald-300/40 group-hover:bg-emerald-500/15",
      };
    case "yellow":
      return {
        topLine: "bg-gradient-to-r from-transparent via-yellow-300/80 to-transparent",
        glowBlob: "bg-yellow-400",
        iconWrap:
          "border-yellow-300/30 bg-yellow-400/15 text-yellow-200 shadow-yellow-400/10",
        cta:
          "border-yellow-300/25 bg-yellow-400/10 text-yellow-200 group-hover:border-yellow-200/40 group-hover:bg-yellow-400/15",
        badge:
          "border-yellow-300/25 bg-yellow-400/10 text-yellow-200",
        softPanel: "border-yellow-300/30 bg-yellow-400/10 text-yellow-200",
        missingTop:
          "bg-gradient-to-r from-transparent via-yellow-300/70 to-transparent",
        missingGlow: "bg-yellow-400/10",
        missingIcon:
          "border-yellow-300/30 bg-yellow-400/15 text-yellow-200 shadow-yellow-400/10",
        missingButton:
          "border-yellow-300/25 bg-yellow-400/10 text-yellow-200 group-hover:border-yellow-200/40 group-hover:bg-yellow-400/15",
      };
    case "purple":
      return {
        topLine: "bg-gradient-to-r from-transparent via-violet-400/80 to-transparent",
        glowBlob: "bg-violet-500",
        iconWrap:
          "border-violet-400/30 bg-violet-500/15 text-violet-300 shadow-violet-500/10",
        cta:
          "border-violet-400/25 bg-violet-500/10 text-violet-300 group-hover:border-violet-300/40 group-hover:bg-violet-500/15",
        badge:
          "border-violet-400/25 bg-violet-500/10 text-violet-300",
        softPanel: "border-violet-400/30 bg-violet-500/10 text-violet-300",
        missingTop:
          "bg-gradient-to-r from-transparent via-violet-400/70 to-transparent",
        missingGlow: "bg-violet-500/10",
        missingIcon:
          "border-violet-400/30 bg-violet-500/15 text-violet-300 shadow-violet-500/10",
        missingButton:
          "border-violet-400/25 bg-violet-500/10 text-violet-300 group-hover:border-violet-300/40 group-hover:bg-violet-500/15",
      };
    case "orange":
      return {
        topLine: "bg-gradient-to-r from-transparent via-orange-400/80 to-transparent",
        glowBlob: "bg-orange-500",
        iconWrap:
          "border-orange-400/30 bg-orange-500/15 text-orange-300 shadow-orange-500/10",
        cta:
          "border-orange-400/25 bg-orange-500/10 text-orange-300 group-hover:border-orange-300/40 group-hover:bg-orange-500/15",
        badge:
          "border-orange-400/25 bg-orange-500/10 text-orange-300",
        softPanel: "border-orange-400/30 bg-orange-500/10 text-orange-300",
        missingTop:
          "bg-gradient-to-r from-transparent via-orange-400/70 to-transparent",
        missingGlow: "bg-orange-500/10",
        missingIcon:
          "border-orange-400/30 bg-orange-500/15 text-orange-300 shadow-orange-500/10",
        missingButton:
          "border-orange-400/25 bg-orange-500/10 text-orange-300 group-hover:border-orange-300/40 group-hover:bg-orange-500/15",
      };
    case "pink":
      return {
        topLine: "bg-gradient-to-r from-transparent via-pink-400/80 to-transparent",
        glowBlob: "bg-pink-500",
        iconWrap:
          "border-pink-400/30 bg-pink-500/15 text-pink-300 shadow-pink-500/10",
        cta:
          "border-pink-400/25 bg-pink-500/10 text-pink-300 group-hover:border-pink-300/40 group-hover:bg-pink-500/15",
        badge:
          "border-pink-400/25 bg-pink-500/10 text-pink-300",
        softPanel: "border-pink-400/30 bg-pink-500/10 text-pink-300",
        missingTop:
          "bg-gradient-to-r from-transparent via-pink-400/70 to-transparent",
        missingGlow: "bg-pink-500/10",
        missingIcon:
          "border-pink-400/30 bg-pink-500/15 text-pink-300 shadow-pink-500/10",
        missingButton:
          "border-pink-400/25 bg-pink-500/10 text-pink-300 group-hover:border-pink-300/40 group-hover:bg-pink-500/15",
      };
    case "red":
      return {
        topLine: "bg-gradient-to-r from-transparent via-red-400/80 to-transparent",
        glowBlob: "bg-red-500",
        iconWrap:
          "border-red-400/30 bg-red-500/15 text-red-300 shadow-red-500/10",
        cta:
          "border-red-400/25 bg-red-500/10 text-red-300 group-hover:border-red-300/40 group-hover:bg-red-500/15",
        badge:
          "border-red-400/25 bg-red-500/10 text-red-300",
        softPanel: "border-red-400/30 bg-red-500/10 text-red-300",
        missingTop: "bg-gradient-to-r from-transparent via-red-400/70 to-transparent",
        missingGlow: "bg-red-500/10",
        missingIcon: "border-red-400/30 bg-red-500/15 text-red-300 shadow-red-500/10",
        missingButton:
          "border-red-400/25 bg-red-500/10 text-red-300 group-hover:border-red-300/40 group-hover:bg-red-500/15",
      };
    default:
      return {
        topLine: "bg-gradient-to-r from-transparent via-red-400/80 to-transparent",
        glowBlob: "bg-red-500",
        iconWrap:
          "border-red-400/30 bg-red-500/15 text-red-300 shadow-red-500/10",
        cta:
          "border-red-400/25 bg-red-500/10 text-red-300 group-hover:border-red-300/40 group-hover:bg-red-500/15",
        badge:
          "border-red-400/25 bg-red-500/10 text-red-300",
        softPanel: "border-red-400/30 bg-red-500/10 text-red-300",
        missingTop: "bg-gradient-to-r from-transparent via-red-400/70 to-transparent",
        missingGlow: "bg-red-500/10",
        missingIcon: "border-red-400/30 bg-red-500/15 text-red-300 shadow-red-500/10",
        missingButton:
          "border-red-400/25 bg-red-500/10 text-red-300 group-hover:border-red-300/40 group-hover:bg-red-500/15",
      };
  }
}

function Card({
  icon,
  title,
  desc,
  cta,
  href,
  primaryColor,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  cta: string;
  href: string;
  primaryColor: PrimaryColor;
}) {
  const accent = getAccentClasses(primaryColor);

  return (
    <a
      href={href}
      className="group relative overflow-hidden rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(18,18,22,0.96)_0%,rgba(7,7,9,0.98)_100%)] p-7 shadow-[0_12px_40px_rgba(0,0,0,0.50)] transition-all duration-300 hover:-translate-y-1.5 hover:border-white/20 hover:shadow-[0_20px_60px_rgba(0,0,0,0.65)]"
    >
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-px ${accent.topLine}`} />

      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full blur-3xl opacity-20 ${accent.glowBlob}`}
      />

      <div
        className={`relative mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border backdrop-blur-sm shadow-lg ${accent.iconWrap}`}
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
        className={`relative inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold tracking-wide transition-all duration-300 ${accent.cta}`}
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
      className="group flex items-center gap-4 rounded-xl border border-white/10 bg-[#0f172a] px-4 py-3 shadow-md transition hover:scale-[1.01] hover:bg-[#111827]"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
        {icon}
      </div>

      <div className="flex-1 font-semibold text-white/90">{label}</div>

      {badge ? (
        <span className="rounded border border-white/10 bg-white/10 px-2 py-1 text-[11px]">
          {badge}
        </span>
      ) : null}

      <span className="text-white/40 transition group-hover:text-white/70">→</span>
    </a>
  );
}

function FeatureBanner({
  href,
  title,
  desc,
  cta,
  icon,
  badge = "",
  backgroundClassName,
  primaryColor,
}: {
  href: string;
  title: string;
  desc: string;
  cta: string;
  icon: React.ReactNode;
  badge?: string;
  backgroundClassName?: string;
  primaryColor: PrimaryColor;
}) {
  const accent = getAccentClasses(primaryColor);

  return (
    <div className="mt-6">
      <a
        href={href}
        className={`group relative flex flex-col justify-between gap-4 overflow-hidden rounded-[28px] border border-white/12 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.50)] transition-all duration-300 hover:-translate-y-1.5 hover:border-white/20 hover:shadow-[0_20px_60px_rgba(0,0,0,0.65)] md:flex-row md:items-center ${
          backgroundClassName ??
          "bg-[linear-gradient(180deg,rgba(12,24,56,0.95)_0%,rgba(8,14,32,0.98)_100%)]"
        }`}
      >
        <div className={`pointer-events-none absolute inset-x-0 top-0 h-px ${accent.topLine}`} />

        <div
          className={`pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full blur-3xl opacity-20 ${accent.glowBlob}`}
        />

        <div className="relative flex items-center gap-4">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl border backdrop-blur-sm shadow-lg ${accent.iconWrap}`}
          >
            {icon}
          </div>

          <div>
            <div className="text-2xl font-black italic tracking-wide text-white md:text-3xl">
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
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold tracking-wide transition-all duration-300 ${accent.cta}`}
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
  const [primaryColor, setPrimaryColor] = useState<PrimaryColor>("red");

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

    try {
      const rawSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (rawSettings) {
        const parsed = JSON.parse(rawSettings);
        const savedPrimaryColor = parsed?.primaryColor;
        if (
          savedPrimaryColor === "blue" ||
          savedPrimaryColor === "red" ||
          savedPrimaryColor === "green" ||
          savedPrimaryColor === "yellow" ||
          savedPrimaryColor === "purple" ||
          savedPrimaryColor === "orange" ||
          savedPrimaryColor === "pink"
        ) {
          setPrimaryColor(savedPrimaryColor);
        }
      }
    } catch {
      setPrimaryColor("red");
    }

    const timer = setTimeout(() => {
      setShowVersion(true);
    }, 250);

    return () => clearTimeout(timer);
  }, []);

  const seasonHref = (path: string) => `${path}?season=${season}`;
  const accent = useMemo(() => getAccentClasses(primaryColor), [primaryColor]);

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat text-white"
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

      <main className="mx-auto max-w-6xl px-6 py-14">
        <div className="text-center">
          <div className="relative inline-flex items-center justify-center">
            <h1 className="text-5xl font-black tracking-tight text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] md:text-7xl">
              <span className="[text-shadow:_-1px_-1px_0_#000,_1px_-1px_0_#000,_-1px_1px_0_#000,_1px_1px_0_#000]">
                COCO FOOTY
              </span>

              <span className="relative ml-3 inline-block align-top md:ml-4">
                {showVersion && (
                  <>
                    <span
                      className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/60 md:h-16 md:w-16"
                      style={{
                        animation: "slamShockwave 0.6s ease-out forwards",
                      }}
                    />
                    <span
                      className="inline-block text-[1.6rem] font-extrabold italic text-cyan-300 [text-shadow:_0_0_10px_rgba(103,232,249,0.6),_-1px_-1px_0_#000,_1px_-1px_0_#000,_-1px_1px_0_#000,_1px_1px_0_#000] md:text-[2.5rem]"
                      style={{
                        animation:
                          "slamIn 0.72s cubic-bezier(.2,.9,.22,1.15) forwards",
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

          <p className="mt-4 text-sm tracking-wide text-white/60">
            Draft AFL players. Build the perfect team. Beat your high score
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card
            icon={<Gem className="h-6 w-6" />}
            title="DAILY GAME"
            desc="Build the perfect lineup from today's randomly selected teams."
            cta="PLAY TODAY"
            href={seasonHref("/daily")}
            primaryColor={primaryColor}
          />

          <Card
            icon={<Flame className="h-6 w-6" />}
            title="UNLIMITED"
            desc="Draft endlessly and try to beat your personal high score."
            cta="PLAY NOW"
            href={seasonHref("/unlimited")}
            primaryColor={primaryColor}
          />

          <Card
            icon={<Swords className="h-6 w-6" />}
            title="TWO PLAYER"
            desc="Local 1v1. Go head-to-head with a friend on the same device."
            cta="PLAY VERSUS"
            href={seasonHref("/versus")}
            primaryColor={primaryColor}
          />
        </div>

        <FeatureBanner
          href={seasonHref("/streak")}
          title="PLAYER NUMBER STREAK"
          desc="Guess jumper numbers and build a streak."
          cta="PLAY STREAK"
          icon={<Zap className="h-6 w-6" />}
          primaryColor={primaryColor}
          backgroundClassName="bg-[linear-gradient(180deg,rgba(12,24,56,0.95)_0%,rgba(8,14,32,0.98)_100%)]"
        />

        <FeatureBanner
          href={seasonHref("/higher-or-lower")}
          title="HIGHER OR LOWER"
          desc="Guess if the next player has higher or lower stats."
          cta="PLAY NOW"
          icon={<Flame className="h-6 w-6" />}
          primaryColor={primaryColor}
          badge="NEW"
          backgroundClassName="bg-[linear-gradient(180deg,rgba(12,24,56,0.95)_0%,rgba(8,14,32,0.98)_100%)]"
        />

        <div className="mt-6">
          <div className="mb-3 text-left">
            <div className="text-sm font-extrabold tracking-widest text-white/100">
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

        <div className="mt-8">
          <div className="group relative overflow-hidden rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(12,24,56,0.95)_0%,rgba(8,14,32,0.98)_100%)] p-8 text-center shadow-[0_12px_40px_rgba(0,0,0,0.50)] transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_20px_60px_rgba(0,0,0,0.65)]">
            <div className={`pointer-events-none absolute inset-x-0 top-0 h-px ${accent.missingTop}`} />
            <div className={`pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full blur-3xl ${accent.missingGlow}`} />

            <div className={`relative mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border shadow-lg ${accent.missingIcon}`}>
              <span className="text-3xl font-black">?</span>
            </div>

            <h3 className="relative text-3xl font-black italic tracking-wide text-white md:text-4xl">
              Missing a player?
            </h3>

            <p className="relative mt-2 text-sm text-white/65">
              Submit a request and help improve Coco Footy.
            </p>

            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSf9O0doWNm33AbWukEhkOtRdtgppTpqVOtuqV6cTFuVCMZjVQ/viewform?usp=publish-editor"
              target="_blank"
              rel="noopener noreferrer"
              className={`relative mt-6 inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-bold tracking-wide transition-all duration-300 ${accent.missingButton}`}
            >
              <span>SUBMIT A REQUEST</span>
              <span className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </a>
          </div>
        </div>

        <footer className="mt-16 space-y-3 border-t border-white/10 pt-6 text-center text-xs text-white/40">
          <div className="flex items-center justify-center gap-6 text-white/60">
            <a href="/privacy" className="transition hover:text-white">
              Privacy Policy
            </a>
            <a href="/contact" className="transition hover:text-white">
              Contact
            </a>
            <a href="/terms" className="transition hover:text-white">
              Terms & Conditions
            </a>
          </div>

          <div className="text-white/30">
            © {new Date().getFullYear()} Coco Footy
          </div>

          <div className="mx-auto max-w-md text-[11px] leading-relaxed text-white/20">
            Built for AFL fans. Not affiliated with the AFL.
          </div>
        </footer>
      </main>
    </div>
  );
}