"use client";

import Image from "next/image";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";

type ThemeMode = "dark" | "light";

const THEME_STORAGE_KEY = "coco_mystats_theme";

const TEAM_ICONS = [
  { key: "adelaide", label: "Adelaide" },
  { key: "brisbane", label: "Brisbane" },
  { key: "carlton", label: "Carlton" },
  { key: "collingwood", label: "Collingwood" },
  { key: "essendon", label: "Essendon" },
  { key: "fremantle", label: "Fremantle" },
  { key: "geelong", label: "Geelong" },
  { key: "gold_coast", label: "Gold Coast" },
  { key: "gws", label: "GWS" },
  { key: "hawthorn", label: "Hawthorn" },
  { key: "melbourne", label: "Melbourne" },
  { key: "north_melbourne", label: "North Melbourne" },
  { key: "port_adelaide", label: "Port Adelaide" },
  { key: "richmond", label: "Richmond" },
  { key: "st_kilda", label: "St Kilda" },
  { key: "sydney", label: "Sydney" },
  { key: "west_coast", label: "West Coast" },
  { key: "western_bulldogs", label: "Western Bulldogs" },
] as const;

function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
  return saved === "light" ? "light" : "dark";
}

function getStoredStat(key: string, fallback = "0") {
  if (typeof window === "undefined") return fallback;
  const value = window.localStorage.getItem(key);
  if (value === null || value === undefined || value === "") return fallback;
  return value;
}

function TeamIcon({
  teamKey,
  alt,
  className = "",
}: {
  teamKey: string;
  alt: string;
  className?: string;
}) {
  return (
    <Image
      src={`/team-icons/${teamKey}.png`}
      alt={alt}
      width={96}
      height={96}
      className={className}
      unoptimized
    />
  );
}

function StatCard({
  label,
  value,
  subtext,
  theme,
}: {
  label: string;
  value: string;
  subtext?: string;
  theme: ThemeMode;
}) {
  const isDark = theme === "dark";

  return (
    <div
      className={`rounded-[24px] border p-5 transition ${
        isDark
          ? "border-white/10 bg-white/[0.04]"
          : "border-black/10 bg-white"
      }`}
    >
      <div
        className={`text-[11px] font-black uppercase tracking-[0.22em] ${
          isDark ? "text-white/45" : "text-black/45"
        }`}
      >
        {label}
      </div>

      <div
        className={`mt-3 text-xl font-black tracking-tight ${
          isDark ? "text-white" : "text-zinc-950"
        }`}
      >
        {value}
      </div>

      {subtext ? (
        <div
          className={`mt-2 text-sm ${
            isDark ? "text-white/60" : "text-black/55"
          }`}
        >
          {subtext}
        </div>
      ) : null}
    </div>
  );
}

function StatSection({
  title,
  theme,
  stats,
}: {
  title: string;
  theme: ThemeMode;
  stats: { label: string; value: string; subtext?: string }[];
}) {
  const isDark = theme === "dark";

  return (
    <section
      className={`rounded-[28px] border p-5 sm:p-6 ${
        isDark ? "border-white/10 bg-white/[0.03]" : "border-black/10 bg-white"
      }`}
    >
      <h2
        className={`text-lg font-black tracking-tight ${
          isDark ? "text-white" : "text-zinc-950"
        }`}
      >
        {title}
      </h2>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            subtext={stat.subtext}
            theme={theme}
          />
        ))}
      </div>
    </section>
  );
}

export default function MyStatsPage() {
  const { user, isLoaded, isSignedIn } = useUser();

  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [selectedPfp, setSelectedPfp] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [savingPfp, setSavingPfp] = useState(false);
  const [statValues, setStatValues] = useState<Record<string, string>>({});

  useEffect(() => {
    setTheme(getInitialTheme());
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }, [theme]);

  useEffect(() => {
    if (!isLoaded || !user) return;

    const savedPfp =
      typeof user.unsafeMetadata?.teamIcon === "string"
        ? user.unsafeMetadata.teamIcon
        : null;

    setSelectedPfp(savedPfp);
  }, [isLoaded, user]);

  useEffect(() => {
    const loadStats = () => {
      setStatValues({
        streak_highest: getStoredStat("coco_streak_highest", "0"),

        daily_games_played: getStoredStat("coco_daily_games_played", "0"),
        daily_highest_score: getStoredStat("coco_daily_highest_score", "0"),

        unlimited_2025_fantasy: getStoredStat("coco_unlimited_2025_fantasy", "0"),
        unlimited_2025_goals: getStoredStat("coco_unlimited_2025_goals", "0"),
        unlimited_2025_disposals: getStoredStat("coco_unlimited_2025_disposals", "0"),
        unlimited_2025_bounces: getStoredStat("coco_unlimited_2025_bounces", "0"),

        unlimited_2026_fantasy: getStoredStat("coco_unlimited_2026_fantasy", "0"),
        unlimited_2026_sc: getStoredStat("coco_unlimited_2026_sc", "0"),
        unlimited_2026_goals: getStoredStat("coco_unlimited_2026_goals", "0"),
        unlimited_2026_disposals: getStoredStat("coco_unlimited_2026_disposals", "0"),
        unlimited_2026_bounces: getStoredStat("coco_unlimited_2026_bounces", "0"),

        hol_daily_high_score: getStoredStat("coco_hol_daily_high_score", "0"),
        hol_unlimited_high_score: getStoredStat("coco_hol_unlimited_high_score", "0"),
      });
    };

    loadStats();
    window.addEventListener("storage", loadStats);
    return () => window.removeEventListener("storage", loadStats);
  }, []);

  const isDark = theme === "dark";

  const shell = useMemo(
    () =>
      isDark
        ? "bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_32%),linear-gradient(180deg,#0a0a0f_0%,#10131a_45%,#090b10_100%)] text-white"
        : "bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.95),rgba(255,255,255,0.72)_28%,rgba(241,245,249,1)_100%)] text-zinc-950",
    [isDark]
  );

  const panel = isDark
    ? "border-white/10 bg-white/[0.05] shadow-[0_20px_80px_rgba(0,0,0,0.42)] backdrop-blur-xl"
    : "border-black/10 bg-white/80 shadow-[0_20px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl";

  const softPanel = isDark
    ? "border-white/10 bg-black/20"
    : "border-black/10 bg-black/[0.03]";

  const mutedText = isDark ? "text-white/65" : "text-black/60";
  const faintText = isDark ? "text-white/45" : "text-black/45";
  const strongText = isDark ? "text-white" : "text-zinc-950";

  const username = user?.username || user?.firstName || "No username";
  const email = user?.primaryEmailAddress?.emailAddress || "No email";
  const joined = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString()
    : "Unknown";

  const currentTeam = TEAM_ICONS.find((team) => team.key === selectedPfp);

  async function saveTeamIcon(teamKey: string | null) {
    if (!user) return;

    try {
      setSavingPfp(true);
      setSelectedPfp(teamKey);

      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          teamIcon: teamKey,
        },
      });

      setShowPicker(false);
    } catch (err) {
      console.error("Failed to save team icon:", err);
    } finally {
      setSavingPfp(false);
    }
  }

  const streakStats = [
    {
      label: "Highest Streak",
      value: statValues.streak_highest ?? "0",
    },
  ];

  const dailyStats = [
    {
      label: "Games Played",
      value: statValues.daily_games_played ?? "0",
    },
    {
      label: "Highest Score",
      value: statValues.daily_highest_score ?? "0",
    },
  ];

  const unlimitedStats = [
    {
      label: "2025 Fantasy Points",
      value: statValues.unlimited_2025_fantasy ?? "0",
    },
    {
      label: "2025 Goals",
      value: statValues.unlimited_2025_goals ?? "0",
    },
    {
      label: "2025 Disposals",
      value: statValues.unlimited_2025_disposals ?? "0",
    },
    {
      label: "2025 Bounces",
      value: statValues.unlimited_2025_bounces ?? "0",
    },
    {
      label: "2026 Fantasy Points",
      value: statValues.unlimited_2026_fantasy ?? "0",
    },
    {
      label: "2026 SC Points",
      value: statValues.unlimited_2026_sc ?? "0",
    },
    {
      label: "2026 Goals",
      value: statValues.unlimited_2026_goals ?? "0",
    },
    {
      label: "2026 Disposals",
      value: statValues.unlimited_2026_disposals ?? "0",
    },
    {
      label: "2026 Bounces",
      value: statValues.unlimited_2026_bounces ?? "0",
    },
  ];

  const higherLowerStats = [
    {
      label: "Daily Game High Score",
      value: statValues.hol_daily_high_score ?? "0",
    },
    {
      label: "Unlimited High Score",
      value: statValues.hol_unlimited_high_score ?? "0",
    },
  ];

  return (
    <main
      className={`min-h-[calc(100vh-64px)] px-4 py-8 transition-colors duration-300 ${shell}`}
    >
      <div className="mx-auto max-w-6xl">
        <div className={`overflow-hidden rounded-[36px] border ${panel}`}>
          <div className="relative overflow-hidden border-b border-inherit px-6 py-6 sm:px-8">
            <div
              className={`absolute inset-0 ${
                isDark
                  ? "bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_30%)]"
                  : "bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.95),transparent_38%)]"
              }`}
            />

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div
                  className={`text-[11px] font-black uppercase tracking-[0.34em] ${faintText}`}
                >
                  Coco Footy Profile
                </div>
                <h1
                  className={`mt-2 text-3xl font-black tracking-tight sm:text-5xl ${strongText}`}
                >
                  My Stats
                </h1>
                <p className={`mt-3 max-w-2xl text-sm sm:text-base ${mutedText}`}>
                  Your saved Coco Footy stats, records, and profile settings.
                </p>
              </div>

              <div
                className={`inline-flex w-fit items-center gap-2 rounded-2xl border p-1 ${
                  isDark ? "border-white/10 bg-white/[0.05]" : "border-black/10 bg-black/[0.04]"
                }`}
              >
                <button
                  onClick={() => setTheme("dark")}
                  className={`rounded-xl px-4 py-2 text-sm font-black transition ${
                    isDark
                      ? "bg-white text-black shadow-sm"
                      : "text-black/55 hover:bg-black/[0.05]"
                  }`}
                >
                  Dark
                </button>
                <button
                  onClick={() => setTheme("light")}
                  className={`rounded-xl px-4 py-2 text-sm font-black transition ${
                    !isDark
                      ? "bg-zinc-950 text-white shadow-sm"
                      : "text-white/65 hover:bg-white/[0.06]"
                  }`}
                >
                  Light
                </button>
              </div>
            </div>
          </div>

          {!isLoaded ? (
            <div className="px-6 py-10 sm:px-8">
              <div className={`rounded-[28px] border p-8 ${softPanel}`}>
                <div className={`text-2xl font-black ${strongText}`}>Loading profile...</div>
                <p className={`mt-3 ${mutedText}`}>Getting your Coco Footy account details.</p>
              </div>
            </div>
          ) : !isSignedIn || !user ? (
            <div className="px-6 py-10 sm:px-8">
              <div className={`rounded-[30px] border p-8 text-center ${softPanel}`}>
                <div
                  className={`text-[11px] font-black uppercase tracking-[0.34em] ${faintText}`}
                >
                  Account Required
                </div>
                <h2 className={`mt-3 text-3xl font-black tracking-tight ${strongText}`}>
                  Sign in to view your stats
                </h2>
                <p className={`mx-auto mt-4 max-w-xl text-sm sm:text-base ${mutedText}`}>
                  Your profile and saved game records will show up here once you are signed in.
                </p>

                <Link
                  href="/login"
                  className={`mt-6 inline-flex items-center rounded-2xl border px-5 py-3 text-sm font-black transition ${
                    isDark
                      ? "border-white/15 bg-white/10 text-white hover:bg-white/15"
                      : "border-black/10 bg-zinc-950 text-white hover:opacity-90"
                  }`}
                >
                  Sign In
                </Link>
              </div>
            </div>
          ) : (
            <div className="px-6 py-6 sm:px-8 sm:py-8">
              <section className={`rounded-[32px] border p-6 sm:p-7 ${softPanel}`}>
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={() => setShowPicker(true)}
                    className={`group relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[28px] border transition ${
                      isDark
                        ? "border-white/10 bg-white/[0.05] hover:border-white/20"
                        : "border-black/10 bg-white hover:border-black/20"
                    }`}
                    aria-label="Choose team icon"
                  >
                    {selectedPfp ? (
                      <TeamIcon
                        teamKey={selectedPfp}
                        alt={currentTeam?.label ?? "Selected team"}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    ) : (
                      <span
                        className={`text-4xl font-black ${
                          isDark ? "text-white" : "text-zinc-950"
                        }`}
                      >
                        {username.charAt(0).toUpperCase()}
                      </span>
                    )}

                    <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white opacity-0 transition group-hover:opacity-100">
                      Change
                    </div>
                  </button>

                  <div className="min-w-0">
                    <div className={`truncate text-3xl font-black tracking-tight ${strongText}`}>
                      {username}
                    </div>
                    <div className={`mt-2 truncate text-sm ${mutedText}`}>{email}</div>
                    <button
                      type="button"
                      onClick={() => setShowPicker(true)}
                      className={`mt-3 inline-flex items-center rounded-xl border px-3 py-2 text-xs font-black uppercase tracking-[0.18em] transition ${
                        isDark
                          ? "border-white/10 bg-white/[0.05] text-white/85 hover:bg-white/[0.08]"
                          : "border-black/10 bg-white text-black/70 hover:bg-black/[0.04]"
                      }`}
                    >
                      {selectedPfp ? "Change Team Icon" : "Choose Team Icon"}
                    </button>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <StatCard label="Username" value={username} theme={theme} />
                  <StatCard label="Email" value={email} theme={theme} />
                  <StatCard label="Joined" value={joined} theme={theme} />
                </div>
              </section>

              <div className="mt-6 space-y-6">
                <StatSection title="Streak Mode" theme={theme} stats={streakStats} />
                <StatSection title="Daily Challenge" theme={theme} stats={dailyStats} />
                <StatSection title="Unlimited" theme={theme} stats={unlimitedStats} />
                <StatSection title="Higher or Lower" theme={theme} stats={higherLowerStats} />
              </div>
            </div>
          )}
        </div>
      </div>

      {showPicker && isSignedIn && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div
            className={`w-full max-w-4xl rounded-[32px] border p-5 sm:p-6 ${
              isDark
                ? "border-white/10 bg-[#090b10] text-white shadow-[0_20px_80px_rgba(0,0,0,0.45)]"
                : "border-black/10 bg-white text-zinc-950 shadow-[0_20px_80px_rgba(15,23,42,0.16)]"
            }`}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <div
                  className={`text-[11px] font-black uppercase tracking-[0.28em] ${faintText}`}
                >
                  Profile Icon
                </div>
                <h2 className="mt-2 text-2xl font-black tracking-tight">
                  Choose your team icon
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowPicker(false)}
                className={`rounded-xl border px-3 py-2 text-sm font-black transition ${
                  isDark
                    ? "border-white/10 bg-white/[0.05] text-white/85 hover:bg-white/[0.08]"
                    : "border-black/10 bg-black/[0.04] text-black/70 hover:bg-black/[0.07]"
                }`}
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {TEAM_ICONS.map((team) => {
                const selected = selectedPfp === team.key;

                return (
                  <button
                    key={team.key}
                    type="button"
                    disabled={savingPfp}
                    onClick={() => saveTeamIcon(team.key)}
                    className={`group rounded-[24px] border p-3 text-center transition ${
                      selected
                        ? isDark
                          ? "border-white/30 bg-white/[0.09]"
                          : "border-black/20 bg-black/[0.05]"
                        : isDark
                        ? "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
                        : "border-black/10 bg-white hover:border-black/20 hover:bg-black/[0.03]"
                    } ${savingPfp ? "opacity-60" : ""}`}
                  >
                    <div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl">
                      <TeamIcon
                        teamKey={team.key}
                        alt={team.label}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    </div>
                    <div
                      className={`mt-3 text-xs font-black uppercase tracking-[0.12em] ${mutedText}`}
                    >
                      {team.label}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={savingPfp}
                onClick={() => saveTeamIcon(null)}
                className={`rounded-2xl border px-4 py-3 text-sm font-black transition ${
                  isDark
                    ? "border-white/10 bg-white/[0.04] text-white/85 hover:bg-white/[0.08]"
                    : "border-black/10 bg-black/[0.04] text-black/70 hover:bg-black/[0.07]"
                } ${savingPfp ? "opacity-60" : ""}`}
              >
                Remove Icon
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}