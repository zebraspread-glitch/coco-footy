"use client";

import Link from "next/link";
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
        badge: "border-sky-400/25 bg-sky-500/10 text-sky-300",
        softPanel: "border-sky-400/30 bg-sky-500/10 text-sky-300",
        missingTop:
          "bg-gradient-to-r from-transparent via-sky-400/70 to-transparent",
        missingGlow: "bg-sky-500/10",
        missingIcon:
          "border-sky-400/30 bg-sky-500/15 text-sky-300 shadow-sky-500/10",
        missingButton:
          "border-sky-400/25 bg-sky-500/10 text-sky-300 group-hover:border-sky-300/40 group-hover:bg-sky-500/15",
      };
    case "green":
      return {
        topLine:
          "bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent",
        glowBlob: "bg-emerald-500",
        iconWrap:
          "border-emerald-400/30 bg-emerald-500/15 text-emerald-300 shadow-emerald-500/10",
        cta:
          "border-emerald-400/25 bg-emerald-500/10 text-emerald-300 group-hover:border-emerald-300/40 group-hover:bg-emerald-500/15",
        badge: "border-emerald-400/25 bg-emerald-500/10 text-emerald-300",
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
        topLine:
          "bg-gradient-to-r from-transparent via-yellow-300/80 to-transparent",
        glowBlob: "bg-yellow-400",
        iconWrap:
          "border-yellow-300/30 bg-yellow-400/15 text-yellow-200 shadow-yellow-400/10",
        cta:
          "border-yellow-300/25 bg-yellow-400/10 text-yellow-200 group-hover:border-yellow-200/40 group-hover:bg-yellow-400/15",
        badge: "border-yellow-300/25 bg-yellow-400/10 text-yellow-200",
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
        topLine:
          "bg-gradient-to-r from-transparent via-violet-400/80 to-transparent",
        glowBlob: "bg-violet-500",
        iconWrap:
          "border-violet-400/30 bg-violet-500/15 text-violet-300 shadow-violet-500/10",
        cta:
          "border-violet-400/25 bg-violet-500/10 text-violet-300 group-hover:border-violet-300/40 group-hover:bg-violet-500/15",
        badge: "border-violet-400/25 bg-violet-500/10 text-violet-300",
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
        topLine:
          "bg-gradient-to-r from-transparent via-orange-400/80 to-transparent",
        glowBlob: "bg-orange-500",
        iconWrap:
          "border-orange-400/30 bg-orange-500/15 text-orange-300 shadow-orange-500/10",
        cta:
          "border-orange-400/25 bg-orange-500/10 text-orange-300 group-hover:border-orange-300/40 group-hover:bg-orange-500/15",
        badge: "border-orange-400/25 bg-orange-500/10 text-orange-300",
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
        topLine:
          "bg-gradient-to-r from-transparent via-pink-400/80 to-transparent",
        glowBlob: "bg-pink-500",
        iconWrap:
          "border-pink-400/30 bg-pink-500/15 text-pink-300 shadow-pink-500/10",
        cta:
          "border-pink-400/25 bg-pink-500/10 text-pink-300 group-hover:border-pink-300/40 group-hover:bg-pink-500/15",
        badge: "border-pink-400/25 bg-pink-500/10 text-pink-300",
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
    default:
      return {
        topLine: "bg-gradient-to-r from-transparent via-red-400/80 to-transparent",
        glowBlob: "bg-red-500",
        iconWrap:
          "border-red-400/30 bg-red-500/15 text-red-300 shadow-red-500/10",
        cta:
          "border-red-400/25 bg-red-500/10 text-red-300 group-hover:border-red-300/40 group-hover:bg-red-500/15",
        badge: "border-red-400/25 bg-red-500/10 text-red-300",
        softPanel: "border-red-400/30 bg-red-500/10 text-red-300",
        missingTop:
          "bg-gradient-to-r from-transparent via-red-400/70 to-transparent",
        missingGlow: "bg-red-500/10",
        missingIcon:
          "border-red-400/30 bg-red-500/15 text-red-300 shadow-red-500/10",
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
    <Link
      href={href}
      className="group relative overflow-hidden rounded-[22px] border border-white/12 bg-[linear-gradient(180deg,rgba(18,18,22,0.96)_0%,rgba(7,7,9,0.98)_100%)] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.50)] transition-all duration-300 hover:-translate-y-1.5 hover:border-white/20 hover:shadow-[0_20px_60px_rgba(0,0,0,0.65)] sm:rounded-[24px] sm:p-6 lg:rounded-[28px] lg:p-7"
    >
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-px ${accent.topLine}`} />
      <div className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-3xl opacity-20 sm:h-32 sm:w-32 lg:h-36 lg:w-36 ${accent.glowBlob}`} />

      <div
        className={`relative mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border backdrop-blur-sm shadow-lg sm:mb-5 lg:mb-6 lg:h-14 lg:w-14 ${accent.iconWrap}`}
      >
        {icon}
      </div>

      <h3 className="relative mb-2 text-[1.45rem] leading-none font-black italic tracking-wide text-white sm:text-[1.7rem] lg:mb-3 lg:text-[2rem]">
        {title}
      </h3>

      <p className="relative mb-5 text-[14px] leading-6 text-white/70 sm:text-[15px] sm:leading-7 lg:mb-7">
        {desc}
      </p>

      <div
        className={`relative inline-flex min-h-[42px] items-center gap-2 rounded-full border px-4 py-2 text-[12px] font-bold tracking-wide transition-all duration-300 sm:text-sm ${accent.cta}`}
      >
        <span>{cta}</span>
        <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
          →
        </span>
      </div>
    </Link>
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
    <Link
      href={href}
      className="group flex min-h-[60px] items-center gap-3 rounded-xl border border-white/10 bg-[#0f172a] px-4 py-3 shadow-md transition hover:scale-[1.01] hover:bg-[#111827] sm:gap-4"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
        {icon}
      </div>
      <div className="min-w-0 flex-1 text-sm font-semibold text-white/90 sm:text-base">
        {label}
      </div>
      {badge ? (
        <span className="shrink-0 rounded border border-white/10 bg-white/10 px-2 py-1 text-[10px] sm:text-[11px]">
          {badge}
        </span>
      ) : null}
      <span className="shrink-0 text-white/40 transition group-hover:text-white/70">
        →
      </span>
    </Link>
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
    <div className="mt-5 sm:mt-6">
      <Link
        href={href}
        className={`group relative flex flex-col justify-between gap-4 overflow-hidden rounded-[22px] border border-white/12 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.50)] transition-all duration-300 hover:-translate-y-1.5 hover:border-white/20 hover:shadow-[0_20px_60px_rgba(0,0,0,0.65)] sm:rounded-[24px] sm:p-6 md:flex-row md:items-center lg:rounded-[28px] ${
          backgroundClassName ??
          "bg-[linear-gradient(180deg,rgba(12,24,56,0.95)_0%,rgba(8,14,32,0.98)_100%)]"
        }`}
      >
        <div className={`pointer-events-none absolute inset-x-0 top-0 h-px ${accent.topLine}`} />
        <div className={`pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-full blur-3xl opacity-20 sm:h-32 sm:w-32 lg:h-40 lg:w-40 ${accent.glowBlob}`} />

        <div className="relative flex min-w-0 items-center gap-3 sm:gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border backdrop-blur-sm shadow-lg sm:h-14 sm:w-14 ${accent.iconWrap}`}
          >
            {icon}
          </div>

          <div className="min-w-0">
            <div className="text-xl font-black italic tracking-wide text-white sm:text-2xl md:text-3xl">
              {title}
            </div>
            <div className="mt-1 text-sm leading-6 text-white/70">{desc}</div>
          </div>
        </div>

        <div className="relative flex flex-wrap items-center gap-3 md:justify-end">
          {badge ? (
            <span className="rounded-full border border-white/12 bg-white/10 px-3 py-1 text-[10px] font-bold tracking-wide text-white/85 sm:text-[11px]">
              {badge}
            </span>
          ) : null}

          <div
            className={`inline-flex min-h-[42px] items-center gap-2 rounded-full border px-4 py-2 text-[12px] font-bold tracking-wide transition-all duration-300 sm:text-sm ${accent.cta}`}
          >
            <span>{cta}</span>
            <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function Home() {
  const [season, setSeason] = useState<"2025" | "2026">("2025");
  const [showVersion, setShowVersion] = useState(false);
  const [primaryColor, setPrimaryColor] = useState<PrimaryColor>("red");

  useEffect(() => {
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

    const timer = window.setTimeout(() => {
      setShowVersion(true);
    }, 250);

    return () => window.clearTimeout(timer);
  }, []);

  const seasonHref = (path: string) => `${path}?season=${season}`;
  const accent = useMemo(() => getAccentClasses(primaryColor), [primaryColor]);

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat text-white"
      style={{ backgroundImage: "url('/coco-footy-bg.png')" }}
    >
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_50%_-10%,rgba(245,158,11,0.16),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(900px_500px_at_50%_110%,rgba(255,255,255,0.06),transparent_60%)]" />
        <div className="absolute inset-0 opacity-[0.10] [background-image:radial-gradient(rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
      </div>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-6 lg:py-14">
        <div className="text-center">
          <div className="relative inline-flex max-w-full items-center justify-center">
            <h1 className="text-[2.4rem] font-black tracking-tight text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] sm:text-5xl md:text-6xl lg:text-7xl">
              <span className="[text-shadow:_-1px_-1px_0_#000,_1px_-1px_0_#000,_-1px_1px_0_#000,_1px_1px_0_#000]">
                COCO FOOTY
              </span>

              <span className="relative ml-2 inline-block align-top sm:ml-3 md:ml-4">
                {showVersion && (
                  <>
                    <span className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/60 animate-ping sm:h-12 sm:w-12 md:h-14 md:w-14 lg:h-16 lg:w-16" />
                    <span className="inline-block text-[1.15rem] font-extrabold italic text-cyan-300 [text-shadow:_0_0_10px_rgba(103,232,249,0.6),_-1px_-1px_0_#000,_1px_-1px_0_#000,_-1px_1px_0_#000,_1px_1px_0_#000] animate-bounce sm:text-[1.6rem] md:text-[2rem] lg:text-[2.5rem]">
                      2.0
                    </span>
                  </>
                )}
              </span>
            </h1>
          </div>

          <p className="mx-auto mt-3 max-w-md text-xs tracking-wide text-white/60 sm:mt-4 sm:text-sm">
            Draft AFL players. Build the perfect team. Beat your high score
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 sm:gap-5 md:mt-12 md:grid-cols-3 md:gap-6">
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
          href={seasonHref("/predictor")}
          title="LADDER + FINALS PREDICTOR"
          desc="Predict the final AFL ladder, Top 8, and premiership winner."
          cta="OPEN PREDICTOR"
          icon={<Trophy className="h-6 w-6" />}
          primaryColor={primaryColor}
          badge="NEW"
        />

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

        <FeatureBanner
  href={seasonHref("/leaderboard")}
  title="GLOBAL LEADERBOARD"
  desc="See the best Coco Footy players in the world and climb the rankings."
  cta="VIEW LEADERBOARD"
  icon={<Trophy className="h-6 w-6" />}
  primaryColor={primaryColor}
  badge="NEW"
/>

        <div className="mt-6">
          <div className="mb-3 text-left">
            <div className="text-xs font-extrabold tracking-[0.25em] text-white sm:text-sm">
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

        <div className="mt-7 sm:mt-8">
          <div className="group relative overflow-hidden rounded-[22px] border border-white/12 bg-[linear-gradient(180deg,rgba(12,24,56,0.95)_0%,rgba(8,14,32,0.98)_100%)] p-5 text-center shadow-[0_12px_40px_rgba(0,0,0,0.50)] transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_20px_60px_rgba(0,0,0,0.65)] sm:rounded-[24px] sm:p-6 lg:rounded-[28px] lg:p-8">
            <div className={`pointer-events-none absolute inset-x-0 top-0 h-px ${accent.missingTop}`} />
            <div className={`pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full blur-3xl sm:h-36 sm:w-36 lg:h-40 lg:w-40 ${accent.missingGlow}`} />

            <div
              className={`relative mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border shadow-lg sm:mb-5 sm:h-14 sm:w-14 ${accent.missingIcon}`}
            >
              <span className="text-2xl font-black sm:text-3xl">?</span>
            </div>

            <h3 className="relative text-2xl font-black italic tracking-wide text-white sm:text-3xl md:text-4xl">
              Missing a player?
            </h3>

            <p className="relative mt-2 text-sm leading-6 text-white/65">
              Submit a request and help improve Coco Footy.
            </p>

            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSf9O0doWNm33AbWukEhkOtRdtgppTpqVOtuqV6cTFuVCMZjVQ/viewform?usp=publish-editor"
              target="_blank"
              rel="noopener noreferrer"
              className={`relative mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-full border px-5 py-2.5 text-[12px] font-bold tracking-wide transition-all duration-300 sm:mt-6 sm:text-sm ${accent.missingButton}`}
            >
              <span>SUBMIT A REQUEST</span>
              <span className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </a>
          </div>
        </div>

        <footer className="mt-12 space-y-3 border-t border-white/10 pt-6 text-center text-xs text-white/40 sm:mt-16">
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-white/60 sm:gap-6">
            <Link href="/privacy" className="transition hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/contact" className="transition hover:text-white">
              Contact
            </Link>
            <Link href="/terms" className="transition hover:text-white">
              Terms & Conditions
            </Link>
          </div>

          <div className="text-white/30">© {new Date().getFullYear()} Coco Footy</div>

          <div className="mx-auto max-w-md px-4 text-[11px] leading-relaxed text-white/20">
            Built for AFL fans. Not affiliated with the AFL.
          </div>
        </footer>
      </main>
    </div>
  );
}