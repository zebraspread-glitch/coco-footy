"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import players2025 from "../data/public/afl_players.json";
import goals2025 from "../data/public/afl_goals.json";
import disposals2025 from "../data/public/afl_disposals.json";
import bounces2025 from "../data/public/afl_bounces.json";
import players2026 from "../data/public/afl_players26.json";
import { createClient } from "@/lib/supabase/client";

type PlayerPos = "FWD" | "MID" | "DEF" | "RUCK";
type Position = "FWD" | "MID" | "DEF" | "RUCK" | "FLEX";
type GameMode = "fantasy" | "sc" | "goals" | "disposals" | "bounces";

type Slot = {
  id: string;
  label: Position;
  allowed: PlayerPos[];
};

type Player = {
  id: string;
  name: string;
  club: string;
  pos: PlayerPos[];
  points: number;
};

type RawPlayer2026 = {
  id?: string | number;
  name?: string;
  fullName?: string;
  player?: string;
  playerName?: string;
  club?: string;
  team?: string;
  pos?: PlayerPos[] | string;
  position?: PlayerPos[] | string;
  positions?: PlayerPos[] | string;
  points?: number | string;
  fantasy?: number | string;
  fantasyPoints?: number | string;
  aflFantasy?: number | string;
  avg?: number | string;
  average?: number | string;
  sc?: number | string;
  scPoints?: number | string;
  supercoach?: number | string;
  superCoach?: number | string;
  supercoachPoints?: number | string;
  goals?: number | string;
  avgGoals?: number | string;
  goalAverage?: number | string;
  disposals?: number | string;
  avgDisposals?: number | string;
  disposalAverage?: number | string;
  bounces?: number | string;
  avgBounces?: number | string;
  bounceAverage?: number | string;
  [key: string]: unknown;
};

type ClubMeta = {
  name: string;
  primary: string;
  text: string;
};

type HighScoreEntry = {
  key: string;
  season: "2025" | "2026";
  mode: GameMode;
  label: string;
  unit: string;
  value: number;
};

const SLOTS: Slot[] = [
  { id: "fwd1", label: "FWD", allowed: ["FWD"] },
  { id: "fwd2", label: "FWD", allowed: ["FWD"] },
  { id: "mid1", label: "MID", allowed: ["MID"] },
  { id: "mid2", label: "MID", allowed: ["MID"] },
  { id: "def1", label: "DEF", allowed: ["DEF"] },
  { id: "def2", label: "DEF", allowed: ["DEF"] },
  { id: "ruck", label: "RUCK", allowed: ["RUCK"] },
  { id: "flex1", label: "FLEX", allowed: ["FWD", "MID", "DEF"] },
];

const AFL_CLUBS: ClubMeta[] = [
  { name: "Collingwood", primary: "#000000", text: "#FFFFFF" },
  { name: "Carlton", primary: "#001B4D", text: "#FFFFFF" },
  { name: "Richmond", primary: "#F7B500", text: "#111111" },
  { name: "Essendon", primary: "#C8102E", text: "#FFFFFF" },
  { name: "Geelong", primary: "#0F2A4A", text: "#FFFFFF" },
  { name: "Hawthorn", primary: "#4B2E1E", text: "#FFFFFF" },
  { name: "Melbourne", primary: "#0A2A5E", text: "#FFFFFF" },
  { name: "Sydney", primary: "#E41E2B", text: "#FFFFFF" },
  { name: "Brisbane", primary: "#7C003E", text: "#FFD200" },
  { name: "West Coast", primary: "#002B5C", text: "#FFD200" },
  { name: "Fremantle", primary: "#2B0A3D", text: "#FFFFFF" },
  { name: "Adelaide", primary: "#002B5C", text: "#E41E2B" },
  { name: "Port Adelaide", primary: "#00A1DE", text: "#111111" },
  { name: "St Kilda", primary: "#C8102E", text: "#000000" },
  { name: "Western Bulldogs", primary: "#0047AB", text: "#FFFFFF" },
  { name: "North Melbourne", primary: "#003A70", text: "#FFFFFF" },
  { name: "Gold Coast", primary: "#B30000", text: "#FFD200" },
  { name: "GWS", primary: "#F15A22", text: "#111111" },
];

function parseNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "").trim();
    const parsed = Number(cleaned);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function normalizePositions(value: unknown): PlayerPos[] {
  if (Array.isArray(value)) {
    const arr = value.filter(
      (v): v is PlayerPos =>
        v === "FWD" || v === "MID" || v === "DEF" || v === "RUCK"
    );
    return arr.length ? arr : ["MID"];
  }

  if (typeof value === "string") {
    const mapped = value
      .split(/[\/,| ]+/)
      .map((v) => v.trim().toUpperCase())
      .filter(
        (v): v is PlayerPos =>
          v === "FWD" || v === "MID" || v === "DEF" || v === "RUCK"
      );
    return mapped.length ? mapped : ["MID"];
  }

  return ["MID"];
}

function modeLabel(mode: GameMode) {
  switch (mode) {
    case "sc":
      return "SC";
    case "goals":
      return "GOALS";
    case "disposals":
      return "DISPOSALS";
    case "bounces":
      return "BOUNCES";
    default:
      return "PTS";
  }
}

function modeTitle(mode: GameMode) {
  switch (mode) {
    case "sc":
      return "SC Points";
    case "goals":
      return "Goals";
    case "disposals":
      return "Disposals";
    case "bounces":
      return "Bounces";
    default:
      return "Fantasy Points";
  }
}

function formatStatValue(value: number, unit: string) {
  if (unit === "GOALS" || unit === "BOUNCES") return String(Math.round(value));
  return value.toFixed(1);
}

function getAvailableModes(season: "2025" | "2026"): GameMode[] {
  return season === "2026"
    ? ["fantasy", "sc", "goals", "disposals", "bounces"]
    : ["fantasy", "goals", "disposals", "bounces"];
}

function isModeAllowedForSeason(
  season: "2025" | "2026",
  mode: string | null
): mode is GameMode {
  if (!mode) return false;
  return getAvailableModes(season).includes(mode as GameMode);
}

function get2026StatValue(player: RawPlayer2026, mode: GameMode): number {
  const candidates: Record<GameMode, string[]> = {
    fantasy: ["points", "fantasyPoints", "fantasy", "aflFantasy", "avg", "average"],
    sc: ["sc", "scPoints", "supercoach", "superCoach", "supercoachPoints"],
    goals: ["goals", "avgGoals", "goalAverage"],
    disposals: ["disposals", "avgDisposals", "disposalAverage"],
    bounces: ["bounces", "avgBounces", "bounceAverage"],
  };

  for (const key of candidates[mode]) {
    if (key in player) {
      const value = parseNumber(player[key]);
      if (Number.isFinite(value)) return value;
    }
  }

  return 0;
}

function normalize2026Players(data: RawPlayer2026[], mode: GameMode): Player[] {
  return data
    .map((p, index) => {
      const name =
        (typeof p.name === "string" && p.name) ||
        (typeof p.fullName === "string" && p.fullName) ||
        (typeof p.player === "string" && p.player) ||
        (typeof p.playerName === "string" && p.playerName) ||
        `Player ${index + 1}`;

      const club =
        (typeof p.club === "string" && p.club) ||
        (typeof p.team === "string" && p.team) ||
        "";

      const id =
        p.id != null && String(p.id).trim()
          ? String(p.id)
          : `${name}-${club}-${index}`;

      return {
        id,
        name,
        club,
        pos: normalizePositions(p.pos ?? p.position ?? p.positions),
        points: get2026StatValue(p, mode),
      };
    })
    .filter((p) => p.name && p.club)
    .filter((p) => p.points > 0);
}

function getHighScoreKey(season: "2025" | "2026", mode: GameMode) {
  if (season === "2025") {
    if (mode === "goals") return "unlimited_highscore_2025_goals";
    if (mode === "disposals") return "unlimited_highscore_2025_disposals";
    if (mode === "bounces") return "unlimited_highscore_2025_bounces";
    return "unlimited_highscore_2025_fantasy";
  }

  if (mode === "sc") return "unlimited_highscore_2026_sc";
  if (mode === "goals") return "unlimited_highscore_2026_goals";
  if (mode === "disposals") return "unlimited_highscore_2026_disposals";
  if (mode === "bounces") return "unlimited_highscore_2026_bounces";
  return "unlimited_highscore_2026_fantasy";
}

function getMyStatsUnlimitedKey(season: "2025" | "2026", mode: GameMode) {
  if (season === "2025") {
    if (mode === "goals") return "coco_unlimited_2025_goals";
    if (mode === "disposals") return "coco_unlimited_2025_disposals";
    if (mode === "bounces") return "coco_unlimited_2025_bounces";
    return "coco_unlimited_2025_fantasy";
  }

  if (mode === "sc") return "coco_unlimited_2026_sc";
  if (mode === "goals") return "coco_unlimited_2026_goals";
  if (mode === "disposals") return "coco_unlimited_2026_disposals";
  if (mode === "bounces") return "coco_unlimited_2026_bounces";
  return "coco_unlimited_2026_fantasy";
}

function getAllHighScoreEntries(): HighScoreEntry[] {
  const entries: Array<Omit<HighScoreEntry, "value">> = [
    {
      key: getHighScoreKey("2025", "fantasy"),
      season: "2025",
      mode: "fantasy",
      label: "2025 Fantasy Points",
      unit: modeLabel("fantasy"),
    },
    {
      key: getHighScoreKey("2025", "goals"),
      season: "2025",
      mode: "goals",
      label: "2025 Goals",
      unit: modeLabel("goals"),
    },
    {
      key: getHighScoreKey("2025", "disposals"),
      season: "2025",
      mode: "disposals",
      label: "2025 Disposals",
      unit: modeLabel("disposals"),
    },
    {
      key: getHighScoreKey("2025", "bounces"),
      season: "2025",
      mode: "bounces",
      label: "2025 Bounces",
      unit: modeLabel("bounces"),
    },
    {
      key: getHighScoreKey("2026", "fantasy"),
      season: "2026",
      mode: "fantasy",
      label: "2026 Fantasy Points",
      unit: modeLabel("fantasy"),
    },
    {
      key: getHighScoreKey("2026", "sc"),
      season: "2026",
      mode: "sc",
      label: "2026 SC Points",
      unit: modeLabel("sc"),
    },
    {
      key: getHighScoreKey("2026", "goals"),
      season: "2026",
      mode: "goals",
      label: "2026 Goals",
      unit: modeLabel("goals"),
    },
    {
      key: getHighScoreKey("2026", "disposals"),
      season: "2026",
      mode: "disposals",
      label: "2026 Disposals",
      unit: modeLabel("disposals"),
    },
    {
      key: getHighScoreKey("2026", "bounces"),
      season: "2026",
      mode: "bounces",
      label: "2026 Bounces",
      unit: modeLabel("bounces"),
    },
  ];

  return entries.map((entry) => {
    let value = 0;
    try {
      value = Number(localStorage.getItem(entry.key) ?? 0);
      if (!Number.isFinite(value)) value = 0;
    } catch {
      value = 0;
    }

    return { ...entry, value };
  });
}

function sumPoints(team: Record<string, string | null>, players: Player[]) {
  const byId = new Map(players.map((p) => [p.id, p]));
  let total = 0;

  for (const id of Object.values(team)) {
    if (!id) continue;
    const player = byId.get(id);
    if (player) total += player.points;
  }

  return total;
}

function clampClubsToPlayers(clubs: ClubMeta[], players: Player[]) {
  const available = new Set(players.map((p) => p.club));
  return clubs.filter((club) => available.has(club.name));
}

function clubSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function patternUrlForClub(clubName: string) {
  return `/patterns/${clubSlug(clubName)}.svg`;
}

function clubForPlayer(clubs: ClubMeta[], player: Player | null) {
  if (!player) return null;
  return clubs.find((c) => c.name === player.club) ?? null;
}

function makeEmptyTeam(slots: Slot[]) {
  return Object.fromEntries(slots.map((slot) => [slot.id, null])) as Record<
    string,
    string | null
  >;
}

function StatBadge({
  value,
  unit,
}: {
  value: number;
  unit: string;
}) {
  return (
    <span className="ml-2 shrink-0 whitespace-nowrap rounded-lg border border-white/15 bg-black/45 px-2.5 py-1 text-[11px] font-extrabold text-white backdrop-blur-md sm:text-sm">
      {formatStatValue(value, unit)} {unit}
    </span>
  );
}

function TeamSlots({
  slots,
  team,
  allPlayers,
  clubs,
  statUnit,
  enabled,
  onOpen,
}: {
  slots: Slot[];
  team: Record<string, string | null>;
  allPlayers: Player[];
  clubs: ClubMeta[];
  statUnit: string;
  enabled: boolean;
  onOpen: (slot: Slot) => void;
}) {
  const byId = useMemo(() => new Map(allPlayers.map((p) => [p.id, p])), [allPlayers]);

  return (
    <div className="space-y-3">
      {slots.map((slot) => {
        const player = team[slot.id] ? byId.get(team[slot.id]!) ?? null : null;
        const clubMeta = clubForPlayer(clubs, player);
        const filled = Boolean(player);
        const clickable = enabled && !filled;

        let badgeClass =
          "bg-white/10 text-white border border-white/15 backdrop-blur-md";

        if (filled && clubMeta) {
          badgeClass = "text-white border border-white/20";
        }

        return (
          <div key={slot.id} className="flex items-stretch gap-2 sm:gap-3">
            <div
              className={`w-14 shrink-0 rounded-lg px-1 py-2.5 text-center text-xs font-extrabold shadow-[0_8px_22px_rgba(0,0,0,0.2)] sm:w-20 sm:text-sm ${badgeClass}`}
              style={
                filled && clubMeta
                  ? { backgroundColor: clubMeta.primary, color: clubMeta.text }
                  : undefined
              }
            >
              {slot.label}
            </div>

            <button
              onClick={() => onOpen(slot)}
              disabled={!clickable}
              className={`flex min-h-[56px] flex-1 items-center justify-between gap-2 rounded-xl border border-white/20 px-3 text-left transition sm:px-4 ${
                clickable ? "hover:brightness-110" : "cursor-not-allowed"
              }`}
              style={
                filled && clubMeta
                  ? {
                      backgroundImage: `url(${patternUrlForClub(clubMeta.name)})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                      color: clubMeta.text,
                    }
                  : { backgroundColor: "rgba(0,0,0,0.30)" }
              }
              title={filled ? "Locked" : undefined}
            >
              <span
                className={`block min-w-0 truncate text-sm sm:text-base ${
                  filled ? "font-extrabold" : "font-extrabold text-white/80"
                }`}
              >
                {player ? player.name : `+ Select ${slot.label}`}
              </span>

              {player && <StatBadge value={player.points} unit={statUnit} />}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function UnlimitedDraftPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();

  const [season, setSeason] = useState<"2025" | "2026">("2025");
  const [seasonReady, setSeasonReady] = useState(false);
  const [mode, setMode] = useState<GameMode>("fantasy");
  const [showHighScores, setShowHighScores] = useState(false);
  const [allHighScores, setAllHighScores] = useState<HighScoreEntry[]>([]);

  const slots = useMemo(() => {
    if (mode === "bounces") {
      return SLOTS.filter((slot) => slot.id !== "ruck");
    }
    return SLOTS;
  }, [mode]);

  const [team, setTeam] = useState<Record<string, string | null>>(makeEmptyTeam(SLOTS));
  const [club, setClub] = useState<ClubMeta>(AFL_CLUBS[0]);
  const [displayClub, setDisplayClub] = useState<ClubMeta>(AFL_CLUBS[0]);
  const [spinning, setSpinning] = useState(false);
  const [search, setSearch] = useState("");
  const [highScore, setHighScore] = useState(0);

  const [active, setActive] = useState<{
    slotId: string;
    allowed: PlayerPos[];
    slotLabel: Position;
  } | null>(null);

  const supabase = useMemo(() => {
    try {
      return createClient();
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const urlSeason = searchParams.get("season");
    const resolvedSeason: "2025" | "2026" = urlSeason === "2026" ? "2026" : "2025";

    setSeason(resolvedSeason);

    try {
      localStorage.setItem("selectedSeason", resolvedSeason);
    } catch {}

    const urlMode = searchParams.get("mode");
    let resolvedMode: GameMode = "fantasy";

    if (isModeAllowedForSeason(resolvedSeason, urlMode)) {
      resolvedMode = urlMode;
    } else {
      try {
        const saved = localStorage.getItem(
          resolvedSeason === "2026"
            ? "selectedUnlimitedMode_2026"
            : "selectedUnlimitedMode_2025"
        );
        if (isModeAllowedForSeason(resolvedSeason, saved)) {
          resolvedMode = saved;
        }
      } catch {}
    }

    setMode(resolvedMode);

    try {
      localStorage.setItem(
        resolvedSeason === "2026"
          ? "selectedUnlimitedMode_2026"
          : "selectedUnlimitedMode_2025",
        resolvedMode
      );
    } catch {}

    setSeasonReady(true);
  }, [searchParams]);

  const allPlayers: Player[] = useMemo(() => {
    if (season === "2026") {
      return normalize2026Players(players2026 as RawPlayer2026[], mode);
    }

    if (mode === "goals") return (goals2025 as Player[]).filter((p) => p.points > 0);
    if (mode === "disposals") return (disposals2025 as Player[]).filter((p) => p.points > 0);
    if (mode === "bounces") return (bounces2025 as Player[]).filter((p) => p.points > 0);
    return (players2025 as Player[]).filter((p) => p.points > 0);
  }, [season, mode]);

  const spinClubs = useMemo(
    () => clampClubsToPlayers(AFL_CLUBS, allPlayers),
    [allPlayers]
  );

  useEffect(() => {
    if (!seasonReady) return;
    setTeam(makeEmptyTeam(slots));
    setActive(null);
    setSearch("");
    setSpinning(false);

    const firstClub = spinClubs[0] ?? AFL_CLUBS[0];
    setClub(firstClub);
    setDisplayClub(firstClub);
  }, [season, mode, seasonReady, spinClubs, slots]);

  const pickedIds = useMemo(() => {
    const ids = Object.values(team).filter(Boolean) as string[];
    return new Set(ids);
  }, [team]);

  const currentScore = useMemo(() => sumPoints(team, allPlayers), [team, allPlayers]);
  const unit = modeLabel(mode);
  const availableModes = getAvailableModes(season);

  const clubPlayers = useMemo(() => {
    return allPlayers
      .filter((p) => p.club === club.name)
      .filter((p) => p.points > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allPlayers, club.name]);

  const eligiblePlayers = useMemo(() => {
    if (!active) return [];
    const q = search.trim().toLowerCase();

    return clubPlayers
      .filter((p) => !pickedIds.has(p.id))
      .filter((p) => p.pos.some((pos) => active.allowed.includes(pos)))
      .filter((p) => (q ? p.name.toLowerCase().includes(q) : true))
      .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
  }, [active, clubPlayers, pickedIds, search]);

  const emptySlots = useMemo(() => {
    return slots.filter((slot) => !team[slot.id]);
  }, [slots, team]);

  const allFilled = useMemo(() => slots.every((slot) => Boolean(team[slot.id])), [slots, team]);
  const gameOver = allFilled;

  const pushRoute = (nextSeason: "2025" | "2026", nextMode: GameMode) => {
    const params = new URLSearchParams();
    params.set("season", nextSeason);
    params.set("mode", nextMode);
    router.replace(`/unlimited?${params.toString()}`);
  };

  const changeSeason = (nextSeason: "2025" | "2026") => {
    const nextMode = isModeAllowedForSeason(nextSeason, mode) ? mode : "fantasy";
    setSeason(nextSeason);
    setMode(nextMode);

    try {
      localStorage.setItem("selectedSeason", nextSeason);
      localStorage.setItem(
        nextSeason === "2026"
          ? "selectedUnlimitedMode_2026"
          : "selectedUnlimitedMode_2025",
        nextMode
      );
    } catch {}

    pushRoute(nextSeason, nextMode);
  };

  const changeMode = (nextMode: GameMode) => {
    if (!isModeAllowedForSeason(season, nextMode)) return;

    setMode(nextMode);

    try {
      localStorage.setItem(
        season === "2026"
          ? "selectedUnlimitedMode_2026"
          : "selectedUnlimitedMode_2025",
        nextMode
      );
    } catch {}

    pushRoute(season, nextMode);
  };

  const goHome = () => {
    router.push(`/?season=${season}&mode=${mode}`);
  };

  function hasEligiblePlayersForSlot(slot: Slot, clubName: string) {
    return allPlayers.some(
      (p) =>
        p.club === clubName &&
        p.points > 0 &&
        !pickedIds.has(p.id) &&
        p.pos.some((pos) => slot.allowed.includes(pos))
    );
  }

  const clubHasAnyValidPick = useMemo(() => {
    return emptySlots.some((slot) => hasEligiblePlayersForSlot(slot, club.name));
  }, [emptySlots, club.name, pickedIds, allPlayers]);

  async function saveGlobalScore(score: number) {
    if (!user || !supabase) return;

    const username =
      user.username ||
      user.firstName ||
      user.primaryEmailAddress?.emailAddress ||
      "Anonymous";

    const { error } = await supabase.from("global_scores").upsert(
      {
        user_id: user.id,
        username,
        mode: `unlimited_${mode}`,
        season: Number(season),
        score,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,mode,season" }
    );

    if (error) {
      console.error("Supabase save error:", error);
    }
  }

  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(getHighScoreKey(season, mode)) ?? 0);
      setHighScore(Number.isFinite(saved) ? saved : 0);
    } catch {
      setHighScore(0);
    }
  }, [season, mode]);

  useEffect(() => {
    if (currentScore <= highScore) return;

    setHighScore(currentScore);

    try {
      localStorage.setItem(getHighScoreKey(season, mode), String(currentScore));
      localStorage.setItem(getMyStatsUnlimitedKey(season, mode), String(currentScore));
    } catch {}

    void saveGlobalScore(currentScore);
  }, [currentScore, highScore, season, mode, user, supabase]);

  const refreshAllHighScores = () => {
    setAllHighScores(getAllHighScoreEntries());
  };

  const spinTimer = useRef<number | null>(null);
  const spinTimeout = useRef<number | null>(null);
  const delayedSpinTimeout = useRef<number | null>(null);
  const hasInitialSpun = useRef(false);

  function cleanupSpinTimers() {
    if (spinTimer.current) window.clearInterval(spinTimer.current);
    if (spinTimeout.current) window.clearTimeout(spinTimeout.current);
    if (delayedSpinTimeout.current) window.clearTimeout(delayedSpinTimeout.current);
    spinTimer.current = null;
    spinTimeout.current = null;
    delayedSpinTimeout.current = null;
  }

  function spinToRandomClub() {
    if (gameOver) return;
    if (spinning) return;
    if (spinClubs.length === 0) return;

    setSpinning(true);
    setActive(null);
    setSearch("");

    let i = 0;
    cleanupSpinTimers();

    spinTimer.current = window.setInterval(() => {
      i = (i + 1) % spinClubs.length;
      setDisplayClub(spinClubs[i]);
    }, 60);

    spinTimeout.current = window.setTimeout(() => {
      cleanupSpinTimers();

      let finalClub = club;
      if (spinClubs.length > 1) {
        do {
          finalClub = spinClubs[Math.floor(Math.random() * spinClubs.length)];
        } while (finalClub.name === club.name);
      } else {
        finalClub = spinClubs[0];
      }

      setClub(finalClub);
      setDisplayClub(finalClub);
      setSpinning(false);
    }, 1200);
  }

  useEffect(() => {
    if (!seasonReady) return;
    if (spinClubs.length === 0) return;
    if (hasInitialSpun.current) return;

    hasInitialSpun.current = true;
    spinToRandomClub();

    return () => cleanupSpinTimers();
  }, [spinClubs, seasonReady]);

  useEffect(() => {
    if (!seasonReady) return;

    hasInitialSpun.current = false;
    cleanupSpinTimers();

    const timeout = window.setTimeout(() => {
      hasInitialSpun.current = true;
      spinToRandomClub();
    }, 50);

    return () => window.clearTimeout(timeout);
  }, [season, mode, seasonReady]);

  useEffect(() => {
    if (!gameOver) return;
    cleanupSpinTimers();
    setSpinning(false);
    setActive(null);
    setSearch("");
  }, [gameOver]);

  useEffect(() => {
    if (!active) return;
    if (spinning) return;
    if (gameOver) return;

    const noEligibleForOpenedSlot = eligiblePlayers.length === 0;
    const noOtherValidSlotsForClub = !clubHasAnyValidPick;

    if (noEligibleForOpenedSlot && noOtherValidSlotsForClub) {
      setActive(null);
      setSearch("");
      delayedSpinTimeout.current = window.setTimeout(() => {
        spinToRandomClub();
      }, 250);
    }
  }, [active, spinning, gameOver, eligiblePlayers, clubHasAnyValidPick]);

  function slotIsFilled(slotId: string) {
    return Boolean(team[slotId]);
  }

  function onOpen(slot: Slot) {
    if (gameOver) return;
    if (spinning) return;
    if (slotIsFilled(slot.id)) return;

    setSearch("");

    const slotHasPlayers = hasEligiblePlayersForSlot(slot, club.name);
    const clubCanFillAnySlot = emptySlots.some((s) => hasEligiblePlayersForSlot(s, club.name));

    if (!slotHasPlayers && !clubCanFillAnySlot) {
      spinToRandomClub();
      return;
    }

    setActive({ slotId: slot.id, allowed: slot.allowed, slotLabel: slot.label });
  }

  function onPick(playerId: string) {
    if (gameOver) return;
    if (!active) return;
    if (spinning) return;
    if (slotIsFilled(active.slotId)) return;

    setTeam((prev) => ({ ...prev, [active.slotId]: playerId }));
    setActive(null);
    setSearch("");

    delayedSpinTimeout.current = window.setTimeout(() => {
      if (!gameOver) spinToRandomClub();
    }, 650);
  }

  function resetGame() {
    cleanupSpinTimers();
    setSpinning(false);
    setActive(null);
    setSearch("");
    setTeam(makeEmptyTeam(slots));

    const firstClub = spinClubs[0] ?? AFL_CLUBS[0];
    setClub(firstClub);
    setDisplayClub(firstClub);

    window.setTimeout(() => spinToRandomClub(), 50);
  }

  useEffect(() => {
    return () => cleanupSpinTimers();
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/vbg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "scroll",
        }}
      />
      <div className="absolute inset-0 bg-black/50" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_35%),linear-gradient(to_bottom,rgba(4,10,24,0.25),rgba(0,0,0,0.35))]" />

      <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-[0.06em] text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.45)] sm:text-4xl sm:tracking-[0.08em]">
              UNLIMITED MODE
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-3">
              <button
                onClick={() => changeSeason("2025")}
                className={`min-h-[44px] rounded-2xl border px-4 py-2 font-bold transition ${
                  season === "2025"
                    ? "border-blue-400 bg-blue-600 text-white shadow-[0_10px_30px_rgba(37,99,235,0.35)]"
                    : "border-white/20 bg-black/20 text-white/80 hover:border-white/40 hover:text-white"
                }`}
              >
                2025
              </button>

              <button
                onClick={() => changeSeason("2026")}
                className={`min-h-[44px] rounded-2xl border px-4 py-2 font-bold transition ${
                  season === "2026"
                    ? "border-red-400 bg-red-500 text-white shadow-[0_10px_30px_rgba(239,68,68,0.35)]"
                    : "border-white/20 bg-black/20 text-white/80 hover:border-white/40 hover:text-white"
                }`}
              >
                2026
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
              {availableModes.includes("fantasy") && (
                <button
                  onClick={() => changeMode("fantasy")}
                  className={`min-h-[44px] w-full rounded-2xl border px-4 py-2 font-bold transition sm:w-auto ${
                    mode === "fantasy"
                      ? "border-white bg-white text-black shadow-[0_10px_28px_rgba(255,255,255,0.18)]"
                      : "border-white/20 bg-black/20 text-white/80 hover:border-white/40 hover:text-white"
                  }`}
                >
                  Fantasy Points
                </button>
              )}

              {availableModes.includes("sc") && (
                <button
                  onClick={() => changeMode("sc")}
                  className={`min-h-[44px] w-full rounded-2xl border px-4 py-2 font-bold transition sm:w-auto ${
                    mode === "sc"
                      ? "border-white bg-white text-black shadow-[0_10px_28px_rgba(255,255,255,0.18)]"
                      : "border-white/20 bg-black/20 text-white/80 hover:border-white/40 hover:text-white"
                  }`}
                >
                  SC Points
                </button>
              )}

              {availableModes.includes("goals") && (
                <button
                  onClick={() => changeMode("goals")}
                  className={`min-h-[44px] w-full rounded-2xl border px-4 py-2 font-bold transition sm:w-auto ${
                    mode === "goals"
                      ? "border-white bg-white text-black shadow-[0_10px_28px_rgba(255,255,255,0.18)]"
                      : "border-white/20 bg-black/20 text-white/80 hover:border-white/40 hover:text-white"
                  }`}
                >
                  Goals
                </button>
              )}

              {availableModes.includes("disposals") && (
                <button
                  onClick={() => changeMode("disposals")}
                  className={`min-h-[44px] w-full rounded-2xl border px-4 py-2 font-bold transition sm:w-auto ${
                    mode === "disposals"
                      ? "border-white bg-white text-black shadow-[0_10px_28px_rgba(255,255,255,0.18)]"
                      : "border-white/20 bg-black/20 text-white/80 hover:border-white/40 hover:text-white"
                  }`}
                >
                  Disposals
                </button>
              )}

              {availableModes.includes("bounces") && (
                <button
                  onClick={() => changeMode("bounces")}
                  className={`min-h-[44px] w-full rounded-2xl border px-4 py-2 font-bold transition sm:w-auto ${
                    mode === "bounces"
                      ? "border-white bg-white text-black shadow-[0_10px_28px_rgba(255,255,255,0.18)]"
                      : "border-white/20 bg-black/20 text-white/80 hover:border-white/40 hover:text-white"
                  }`}
                >
                  Bounces
                </button>
              )}
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto">
            <button
              onClick={goHome}
              className="rounded-2xl border border-white/15 bg-black/25 px-4 py-3 text-white/80 backdrop-blur-md hover:border-white/35 hover:text-white sm:py-2"
            >
              ← Home
            </button>

            <button
              onClick={() => {
                refreshAllHighScores();
                setShowHighScores((prev) => !prev);
              }}
              className="rounded-2xl border border-white/15 bg-black/25 px-4 py-3 text-white/80 backdrop-blur-md hover:border-white/35 hover:text-white sm:py-2"
            >
              {showHighScores ? "Hide High Scores" : "Show High Scores"}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/15 bg-black/25 p-4 backdrop-blur-md">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">
              Mode
            </div>
            <div className="mt-2 text-2xl font-extrabold">{modeTitle(mode)}</div>
          </div>

          <div className="rounded-3xl border border-white/15 bg-black/25 p-4 backdrop-blur-md">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">
              Current Score
            </div>
            <div className="mt-2 text-2xl font-extrabold">
              {formatStatValue(currentScore, unit)} {unit}
            </div>
          </div>

          <div className="rounded-3xl border border-white/15 bg-black/25 p-4 backdrop-blur-md">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">
              High Score
            </div>
            <div className="mt-2 text-2xl font-extrabold">
              {formatStatValue(highScore, unit)} {unit}
            </div>
          </div>
        </div>

        {showHighScores && (
          <div className="mt-6 rounded-3xl border border-white/15 bg-black/25 p-4 backdrop-blur-md">
            <div className="mb-4 text-lg font-extrabold">All Unlimited High Scores</div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {allHighScores.map((entry) => (
                <div
                  key={entry.key}
                  className="rounded-2xl border border-white/10 bg-white/5 p-3"
                >
                  <div className="text-sm font-bold text-white/75">{entry.label}</div>
                  <div className="mt-1 text-xl font-extrabold">
                    {formatStatValue(entry.value, entry.unit)} {entry.unit}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl border border-white/15 bg-black/25 p-4 backdrop-blur-md sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">
                  Draft Team
                </div>
                <div className="mt-1 text-xl font-extrabold">
                  Fill all {slots.length} slots
                </div>
              </div>

              <button
                onClick={resetGame}
                className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2 font-bold text-white hover:bg-white/15"
              >
                Restart
              </button>
            </div>

            <div className="mt-5">
              <TeamSlots
                slots={slots}
                team={team}
                allPlayers={allPlayers}
                clubs={AFL_CLUBS}
                statUnit={unit}
                enabled={!spinning && !gameOver}
                onOpen={onOpen}
              />
            </div>

            {gameOver && (
              <div className="mt-5 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4 text-center">
                <div className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-200/80">
                  Finished
                </div>
                <div className="mt-2 text-3xl font-extrabold text-white">
                  {formatStatValue(currentScore, unit)} {unit}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-white/15 bg-black/25 p-4 backdrop-blur-md sm:p-5">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">
                Club Spinner
              </div>

              <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-5 text-center">
                <div
                  className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border-4 shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
                  style={{
                    backgroundColor: displayClub.primary,
                    color: displayClub.text,
                    borderColor: "rgba(255,255,255,0.2)",
                  }}
                >
                  <span className="px-3 text-center text-sm font-extrabold">
                    {displayClub.name}
                  </span>
                </div>

                <div className="mt-4 text-lg font-extrabold">{displayClub.name}</div>

                <button
                  onClick={spinToRandomClub}
                  disabled={spinning || gameOver}
                  className={`mt-4 w-full rounded-2xl px-4 py-3 font-extrabold transition ${
                    spinning || gameOver
                      ? "cursor-not-allowed bg-white/10 text-white/40"
                      : "bg-white text-black hover:brightness-95"
                  }`}
                >
                  {spinning ? "Spinning..." : "Spin Club"}
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-white/15 bg-black/25 p-4 backdrop-blur-md sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">
                    Player Picker
                  </div>
                  <div className="mt-1 text-lg font-extrabold">
                    {active ? `Select ${active.slotLabel}` : "Open a slot to pick"}
                  </div>
                </div>
              </div>

              {active ? (
                <>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search player..."
                    className="mt-4 w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/45"
                  />

                  <div className="mt-4 max-h-[420px] space-y-2 overflow-y-auto pr-1">
                    {eligiblePlayers.length > 0 ? (
                      eligiblePlayers.map((player) => (
                        <button
                          key={player.id}
                          onClick={() => onPick(player.id)}
                          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:bg-white/10"
                        >
                          <div className="min-w-0">
                            <div className="truncate font-extrabold">{player.name}</div>
                            <div className="mt-1 text-sm text-white/65">
                              {player.club} · {player.pos.join("/")}
                            </div>
                          </div>
                          <StatBadge value={player.points} unit={unit} />
                        </button>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-center text-white/70">
                        No eligible players for this club/slot.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-8 text-center text-white/70">
                  Tap a team slot on the left to choose a player.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function UnlimitedDraftPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black p-4 text-white sm:p-6">
          Loading...
        </div>
      }
    >
      <UnlimitedDraftPageInner />
    </Suspense>
  );
}