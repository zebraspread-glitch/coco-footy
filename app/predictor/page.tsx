"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";

const SEASON = 2026;
const API_URL = `https://api.squiggle.com.au/?q=games;year=${SEASON}`;
const BG_IMAGE = "/13031df3-8bf5-4818-b2a4-5777164a3db9.png";

type SquiggleGame = {
  id?: number;
  gameid?: number;
  round?: number;
  complete?: number;
  hteam?: string;
  ateam?: string;
  hscore?: number;
  ascore?: number;
  venue?: string;
  date?: string;
  localtime?: string;
};

type TeamStats = {
  team: string;
  played: number;
  wins: number;
  losses: number;
  draws: number;
  pointsFor: number;
  pointsAgainst: number;
  premiershipPoints: number;
  percentage: number;
};

type PredictedScore = {
  home: number;
  away: number;
  custom: boolean;
};

type PickMap = Record<number, string>;
type ScoreMap = Record<number, PredictedScore>;
type ViewMode = "round" | "team";

type FinalsGameId =
  | "WC1"
  | "WC2"
  | "QF1"
  | "QF2"
  | "EF1"
  | "EF2"
  | "SF1"
  | "SF2"
  | "PF1"
  | "PF2"
  | "GF";

type FinalsGameDef = {
  id: FinalsGameId;
  label: string;
  stage:
    | "Wildcard"
    | "Qualifying Final"
    | "Elimination Final"
    | "Semi Final"
    | "Preliminary Final"
    | "Grand Final";
  homeTeam: string;
  awayTeam: string;
  dependsOn?: FinalsGameId[];
};

type FinalsPickMap = Partial<Record<FinalsGameId, string>>;
type FinalsScoreMap = Partial<Record<FinalsGameId, PredictedScore>>;

const TEAM_ICON_MAP: Record<string, string> = {
  Adelaide: "/team-icons/adelaide.png",
  "Adelaide Crows": "/team-icons/adelaide.png",
  Brisbane: "/team-icons/brisbane.png",
  "Brisbane Lions": "/team-icons/brisbane.png",
  Carlton: "/team-icons/carlton.png",
  Collingwood: "/team-icons/collingwood.png",
  Essendon: "/team-icons/essendon.png",
  Fremantle: "/team-icons/fremantle.png",
  Geelong: "/team-icons/geelong.png",
  "Geelong Cats": "/team-icons/geelong.png",
  "Gold Coast": "/team-icons/gold_coast.png",
  "Gold Coast Suns": "/team-icons/gold_coast.png",
  "Gold Coast SUNS": "/team-icons/gold_coast.png",
  GWS: "/team-icons/gws.png",
  "GWS Giants": "/team-icons/gws.png",
  "Greater Western Sydney": "/team-icons/gws.png",
  Hawthorn: "/team-icons/hawthorn.png",
  Melbourne: "/team-icons/melbourne.png",
  "North Melbourne": "/team-icons/north_melbourne.png",
  "Port Adelaide": "/team-icons/port_adelaide.png",
  Richmond: "/team-icons/richmond.png",
  "St Kilda": "/team-icons/st_kilda.png",
  Sydney: "/team-icons/sydney.png",
  "Sydney Swans": "/team-icons/sydney.png",
  "West Coast": "/team-icons/west_coast.png",
  "West Coast Eagles": "/team-icons/west_coast.png",
  "Western Bulldogs": "/team-icons/western_bulldogs.png",
  Bulldogs: "/team-icons/western_bulldogs.png",
};

const TEAM_NAME_NORMALISE: Record<string, string> = {
  Adelaide: "Adelaide Crows",
  "Adelaide Crows": "Adelaide Crows",
  Brisbane: "Brisbane Lions",
  "Brisbane Lions": "Brisbane Lions",
  Carlton: "Carlton",
  Collingwood: "Collingwood",
  Essendon: "Essendon",
  Fremantle: "Fremantle",
  Geelong: "Geelong Cats",
  "Geelong Cats": "Geelong Cats",
  "Gold Coast": "Gold Coast SUNS",
  "Gold Coast Suns": "Gold Coast SUNS",
  "Gold Coast SUNS": "Gold Coast SUNS",
  GWS: "GWS Giants",
  "GWS Giants": "GWS Giants",
  "Greater Western Sydney": "GWS Giants",
  Hawthorn: "Hawthorn",
  Melbourne: "Melbourne",
  "North Melbourne": "North Melbourne",
  "Port Adelaide": "Port Adelaide",
  Richmond: "Richmond",
  "St Kilda": "St Kilda",
  Sydney: "Sydney Swans",
  "Sydney Swans": "Sydney Swans",
  "West Coast": "West Coast Eagles",
  "West Coast Eagles": "West Coast Eagles",
  "Western Bulldogs": "Western Bulldogs",
  Bulldogs: "Western Bulldogs",
};

function normaliseTeamName(team?: string) {
  if (!team) return "";
  return TEAM_NAME_NORMALISE[team] ?? team;
}

function getTeamIcon(team?: string) {
  const clean = normaliseTeamName(team);
  return TEAM_ICON_MAP[clean] ?? "/team-icons/adelaide.png";
}

function getGameId(game: SquiggleGame, fallbackIndex: number) {
  return Number(game.id ?? game.gameid ?? fallbackIndex);
}

function isPlayed(game: SquiggleGame) {
  if (game.complete === 100) return true;
  if (
    typeof game.hscore === "number" &&
    typeof game.ascore === "number" &&
    game.complete !== 0
  ) {
    return game.hscore > 0 || game.ascore > 0;
  }
  return false;
}

function getActualWinner(game: SquiggleGame): string | null {
  if (!isPlayed(game)) return null;
  const home = normaliseTeamName(game.hteam);
  const away = normaliseTeamName(game.ateam);
  const hs = Number(game.hscore ?? 0);
  const as = Number(game.ascore ?? 0);

  if (hs > as) return home;
  if (as > hs) return away;
  return "DRAW";
}

function formatTime(value?: string) {
  if (!value) return "TBD";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "TBD";
  return new Intl.DateTimeFormat("en-AU", {
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

function formatDayHeading(value?: string) {
  if (!value) return "Match Day";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Match Day";
  return new Intl.DateTimeFormat("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d);
}

function createEmptyStats(team: string): TeamStats {
  return {
    team,
    played: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    premiershipPoints: 0,
    percentage: 0,
  };
}

function addResult(
  table: Record<string, TeamStats>,
  homeTeam: string,
  awayTeam: string,
  homeScore: number,
  awayScore: number
) {
  if (!table[homeTeam]) table[homeTeam] = createEmptyStats(homeTeam);
  if (!table[awayTeam]) table[awayTeam] = createEmptyStats(awayTeam);

  const home = table[homeTeam];
  const away = table[awayTeam];

  home.played += 1;
  away.played += 1;

  home.pointsFor += homeScore;
  home.pointsAgainst += awayScore;

  away.pointsFor += awayScore;
  away.pointsAgainst += homeScore;

  if (homeScore > awayScore) {
    home.wins += 1;
    away.losses += 1;
    home.premiershipPoints += 4;
  } else if (awayScore > homeScore) {
    away.wins += 1;
    home.losses += 1;
    away.premiershipPoints += 4;
  } else {
    home.draws += 1;
    away.draws += 1;
    home.premiershipPoints += 2;
    away.premiershipPoints += 2;
  }
}

function buildPredictedLadder(
  games: SquiggleGame[],
  picks: PickMap,
  scores: ScoreMap
) {
  const table: Record<string, TeamStats> = {};

  for (let i = 0; i < games.length; i += 1) {
    const game = games[i];
    const id = getGameId(game, i);
    const home = normaliseTeamName(game.hteam);
    const away = normaliseTeamName(game.ateam);

    if (!home || !away) continue;

    if (!table[home]) table[home] = createEmptyStats(home);
    if (!table[away]) table[away] = createEmptyStats(away);

    if (isPlayed(game)) {
      addResult(
        table,
        home,
        away,
        Number(game.hscore ?? 0),
        Number(game.ascore ?? 0)
      );
      continue;
    }

    const score = scores[id];
    const pick = picks[id];

    if (!pick || !score) continue;

    addResult(table, home, away, score.home, score.away);
  }

  const ladder = Object.values(table).map((team) => ({
    ...team,
    percentage:
      team.pointsAgainst === 0
        ? team.pointsFor > 0
          ? 999.9
          : 0
        : Number(((team.pointsFor / team.pointsAgainst) * 100).toFixed(1)),
  }));

  ladder.sort((a, b) => {
    if (b.premiershipPoints !== a.premiershipPoints) {
      return b.premiershipPoints - a.premiershipPoints;
    }
    if (b.percentage !== a.percentage) {
      return b.percentage - a.percentage;
    }
    return a.team.localeCompare(b.team);
  });

  return ladder;
}

function getCurrentRound(games: SquiggleGame[]) {
  const rounds = Array.from(
    new Set(
      games
        .map((g) => g.round)
        .filter((r): r is number => typeof r === "number" && r >= 0 && r <= 24)
    )
  ).sort((a, b) => a - b);

  for (const round of rounds) {
    const roundGames = games.filter((g) => g.round === round);
    if (roundGames.some((g) => !isPlayed(g))) return round;
  }

  return rounds[rounds.length - 1] ?? 0;
}

function buildInitialPicks(games: SquiggleGame[]) {
  const next: PickMap = {};
  games.forEach((game, index) => {
    const id = getGameId(game, index);
    const winner = getActualWinner(game);
    if (winner) next[id] = winner;
  });
  return next;
}

function buildInitialScores(games: SquiggleGame[]) {
  const next: ScoreMap = {};
  games.forEach((game, index) => {
    const id = getGameId(game, index);
    if (isPlayed(game)) {
      next[id] = {
        home: Number(game.hscore ?? 0),
        away: Number(game.ascore ?? 0),
        custom: true,
      };
    }
  });
  return next;
}

function randomWinningScore(
  winner: "home" | "away" | "draw",
  existing?: PredictedScore
): PredictedScore {
  if (existing?.custom) return existing;

  if (winner === "draw") {
    const draw = 60 + Math.floor(Math.random() * 55);
    return { home: draw, away: draw, custom: false };
  }

  const high = 70 + Math.floor(Math.random() * 50);
  let low = 45 + Math.floor(Math.random() * 45);

  if (low >= high) low = Math.max(0, high - 6);

  return winner === "home"
    ? { home: high, away: low, custom: false }
    : { home: low, away: high, custom: false };
}

function toInputValue(value?: number) {
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "";
}

function getAllTeams(games: SquiggleGame[]) {
  return Array.from(
    new Set(
      games.flatMap((g) => [
        normaliseTeamName(g.hteam),
        normaliseTeamName(g.ateam),
      ])
    )
  )
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

function getFinalsSlots(ladder: TeamStats[]) {
  return {
    p1: ladder[0]?.team ?? "",
    p2: ladder[1]?.team ?? "",
    p3: ladder[2]?.team ?? "",
    p4: ladder[3]?.team ?? "",
    p5: ladder[4]?.team ?? "",
    p6: ladder[5]?.team ?? "",
    p7: ladder[6]?.team ?? "",
    p8: ladder[7]?.team ?? "",
    p9: ladder[8]?.team ?? "",
    p10: ladder[9]?.team ?? "",
  };
}

function getFinalsSeedMap(slots: ReturnType<typeof getFinalsSlots>) {
  return {
    [slots.p1]: 1,
    [slots.p2]: 2,
    [slots.p3]: 3,
    [slots.p4]: 4,
    [slots.p5]: 5,
    [slots.p6]: 6,
    [slots.p7]: 7,
    [slots.p8]: 8,
    [slots.p9]: 9,
    [slots.p10]: 10,
  } as Record<string, number>;
}

function sortWildcardWinnersBySeed(
  winners: string[],
  seedMap: Record<string, number>
) {
  return winners
    .filter(Boolean)
    .sort((a, b) => (seedMap[a] ?? 999) - (seedMap[b] ?? 999));
}

function buildFinalsDefs(
  ladder: TeamStats[],
  finalsPicks: FinalsPickMap
): FinalsGameDef[] {
  const slots = getFinalsSlots(ladder);
  const seedMap = getFinalsSeedMap(slots);

  const wc1Winner = finalsPicks.WC1 ?? "";
  const wc2Winner = finalsPicks.WC2 ?? "";

  const qf1Winner = finalsPicks.QF1 ?? "";
  const qf2Winner = finalsPicks.QF2 ?? "";

  const ef1Winner = finalsPicks.EF1 ?? "";
  const ef2Winner = finalsPicks.EF2 ?? "";

  const sf1Winner = finalsPicks.SF1 ?? "";
  const sf2Winner = finalsPicks.SF2 ?? "";

  const qf1Loser =
    qf1Winner === slots.p1 ? slots.p2 : qf1Winner === slots.p2 ? slots.p1 : "";
  const qf2Loser =
    qf2Winner === slots.p3 ? slots.p4 : qf2Winner === slots.p4 ? slots.p3 : "";

  const sortedWildcardWinners = sortWildcardWinnersBySeed(
    [wc1Winner, wc2Winner],
    seedMap
  );
  const highestRankedWildcardWinner = sortedWildcardWinners[0] ?? "";
  const lowestRankedWildcardWinner = sortedWildcardWinners[1] ?? "";

  return [
    {
      id: "WC1",
      label: "WC1",
      stage: "Wildcard",
      homeTeam: slots.p7,
      awayTeam: slots.p10,
    },
    {
      id: "WC2",
      label: "WC2",
      stage: "Wildcard",
      homeTeam: slots.p8,
      awayTeam: slots.p9,
    },
    {
      id: "QF1",
      label: "QF1",
      stage: "Qualifying Final",
      homeTeam: slots.p1,
      awayTeam: slots.p2,
    },
    {
      id: "QF2",
      label: "QF2",
      stage: "Qualifying Final",
      homeTeam: slots.p3,
      awayTeam: slots.p4,
    },
    {
      id: "EF1",
      label: "EF1",
      stage: "Elimination Final",
      homeTeam: slots.p5,
      awayTeam: lowestRankedWildcardWinner,
      dependsOn: ["WC1", "WC2"],
    },
    {
      id: "EF2",
      label: "EF2",
      stage: "Elimination Final",
      homeTeam: slots.p6,
      awayTeam: highestRankedWildcardWinner,
      dependsOn: ["WC1", "WC2"],
    },
    {
      id: "SF1",
      label: "SF1",
      stage: "Semi Final",
      homeTeam: qf1Loser,
      awayTeam: ef2Winner,
      dependsOn: ["QF1", "EF2"],
    },
    {
      id: "SF2",
      label: "SF2",
      stage: "Semi Final",
      homeTeam: qf2Loser,
      awayTeam: ef1Winner,
      dependsOn: ["QF2", "EF1"],
    },
    {
      id: "PF1",
      label: "PF1",
      stage: "Preliminary Final",
      homeTeam: qf1Winner,
      awayTeam: sf2Winner,
      dependsOn: ["QF1", "SF2"],
    },
    {
      id: "PF2",
      label: "PF2",
      stage: "Preliminary Final",
      homeTeam: qf2Winner,
      awayTeam: sf1Winner,
      dependsOn: ["QF2", "SF1"],
    },
    {
      id: "GF",
      label: "GF",
      stage: "Grand Final",
      homeTeam: finalsPicks.PF1 ?? "",
      awayTeam: finalsPicks.PF2 ?? "",
      dependsOn: ["PF1", "PF2"],
    },
  ];
}

function TrashIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function SectionCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[28px] border border-white/70 bg-white/90 shadow-[0_14px_36px_rgba(0,0,0,0.08)] backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  );
}

function LadderRow({
  stat,
  index,
  dividerAfter = false,
  dividerColor = "#0b4da2",
}: {
  stat: TeamStats;
  index: number;
  dividerAfter?: boolean;
  dividerColor?: string;
}) {
  const isTop6 = index < 6;
  const isWildcard = index >= 6 && index < 10;

  return (
    <>
      <tr className="border-b border-[#edf0f4] last:border-b-0">
        <td className="px-3 py-3 text-center text-sm font-black text-[#111] sm:px-4">
          {index + 1}
        </td>
      <td className="px-3 py-3 sm:px-4">
        <div className="flex items-center gap-3">
          <div
            className={`relative h-9 w-9 overflow-hidden rounded-xl ${
              isTop6
                ? "ring-2 ring-[#0b4da2]/20"
                : isWildcard
                ? "ring-2 ring-[#7b61ff]/20"
                : ""
            } bg-white`}
          >
            <Image
              src={getTeamIcon(stat.team)}
              alt={stat.team}
              fill
              className="object-contain p-1"
              unoptimized
            />
          </div>
          <span className="truncate text-sm font-black text-[#111] sm:text-[15px]">
            {stat.team}
          </span>
        </div>
      </td>
      <td className="px-3 py-3 text-center text-sm font-bold text-[#111] sm:px-4">
        {stat.played}
      </td>
      <td className="px-3 py-3 text-center text-sm font-bold text-[#111] sm:px-4">
        {stat.wins}-{stat.losses}-{stat.draws}
      </td>
      <td className="px-3 py-3 text-center text-sm font-black text-[#111] sm:px-4">
        {stat.premiershipPoints}
      </td>
        <td className="px-3 py-3 text-center text-sm font-black text-[#111] sm:px-4">
          {stat.percentage.toFixed(1)}
        </td>
      </tr>
      {dividerAfter ? (
        <tr aria-hidden="true">
          <td colSpan={6} className="p-0">
            <div className="h-[3px] w-full" style={{ backgroundColor: dividerColor }} />
          </td>
        </tr>
      ) : null}
    </>
  );
}

function GameCard({
  game,
  index,
  pick,
  score,
  expanded,
  onPick,
  onClear,
  onToggleExpanded,
  onScoreChange,
  onApplyScore,
}: {
  game: SquiggleGame;
  index: number;
  pick?: string;
  score?: PredictedScore;
  expanded?: boolean;
  onPick: (winner: string) => void;
  onClear: () => void;
  onToggleExpanded: () => void;
  onScoreChange: (side: "home" | "away", value: string) => void;
  onApplyScore: () => void;
}) {
  const home = normaliseTeamName(game.hteam);
  const away = normaliseTeamName(game.ateam);
  const played = isPlayed(game);
  const actualWinner = getActualWinner(game);

  const homeSelected = played ? actualWinner === home : pick === home;
  const awaySelected = played ? actualWinner === away : pick === away;

  const showScores = played || !!pick;

  return (
    <div className="rounded-[22px] border border-[#e7ecf3] bg-white p-3 shadow-[0_10px_30px_rgba(11,77,162,0.06)] sm:p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="text-[13px] font-black uppercase tracking-[0.1em] text-[#0b4da2]">
            {formatTime(game.date ?? game.localtime)}
          </div>
          <div className="mt-1 text-xs font-semibold text-[#6a6a6a]">
            {game.venue || "Venue TBA"}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {played ? (
            <div className="rounded-full bg-[#eaf8ef] px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-[#18794e]">
              Final
            </div>
          ) : pick ? (
            <button
              type="button"
              onClick={onClear}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#f0d2d2] bg-white text-[#b42318] transition hover:bg-[#fff5f5]"
              aria-label="Clear tip"
              title="Clear tip"
            >
              <TrashIcon />
            </button>
          ) : null}
        </div>
      </div>

      <div className="space-y-2.5">
        <button
          type="button"
          disabled={played}
          onClick={() => onPick(home)}
          className={`flex w-full items-center justify-between rounded-[16px] border px-4 py-3 text-left transition ${
            homeSelected
              ? "border-[#0b4da2] bg-[#edf5ff]"
              : "border-[#e4e8ef] bg-[#fafbfc] hover:bg-[#f4f8ff]"
          } ${played ? "cursor-default" : ""}`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative h-11 w-11 overflow-hidden rounded-xl bg-white shadow-sm">
              <Image
                src={getTeamIcon(home)}
                alt={home}
                fill
                className="object-contain p-1"
                unoptimized
              />
            </div>
            <span className="truncate text-[15px] font-black text-[#111]">
              {home}
            </span>
          </div>

          {showScores ? (
            <span className="text-[18px] font-black text-[#111]">
              {played ? Number(game.hscore ?? 0) : Number(score?.home ?? 0)}
            </span>
          ) : null}
        </button>

        <button
          type="button"
          disabled={played}
          onClick={() => onPick(away)}
          className={`flex w-full items-center justify-between rounded-[16px] border px-4 py-3 text-left transition ${
            awaySelected
              ? "border-[#0b4da2] bg-[#edf5ff]"
              : "border-[#e4e8ef] bg-[#fafbfc] hover:bg-[#f4f8ff]"
          } ${played ? "cursor-default" : ""}`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative h-11 w-11 overflow-hidden rounded-xl bg-white shadow-sm">
              <Image
                src={getTeamIcon(away)}
                alt={away}
                fill
                className="object-contain p-1"
                unoptimized
              />
            </div>
            <span className="truncate text-[15px] font-black text-[#111]">
              {away}
            </span>
          </div>

          {showScores ? (
            <span className="text-[18px] font-black text-[#111]">
              {played ? Number(game.ascore ?? 0) : Number(score?.away ?? 0)}
            </span>
          ) : null}
        </button>
      </div>

      {!played && pick && (
        <div className="mt-3 rounded-[16px] border border-[#e7edf7] bg-[#f8fbff] p-3">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onToggleExpanded}
              className="text-[12px] font-black uppercase tracking-[0.08em] text-[#0b4da2]"
            >
              {expanded ? "Hide scores" : "Custom scores"}
            </button>

            <div className="rounded-full bg-[#ecf3ff] px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-[#0b4da2]">
              Tip selected
            </div>
          </div>

          {expanded && (
            <div className="mt-3">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <input
                  inputMode="numeric"
                  value={toInputValue(score?.home)}
                  onChange={(e) => onScoreChange("home", e.target.value)}
                  className="h-10 rounded-xl border border-[#d6e2f6] bg-white px-3 text-center text-sm font-bold text-[#111] outline-none"
                  placeholder="0"
                />
                <span className="text-[12px] font-black uppercase tracking-[0.08em] text-[#7a7a7a]">
                  v
                </span>
                <input
                  inputMode="numeric"
                  value={toInputValue(score?.away)}
                  onChange={(e) => onScoreChange("away", e.target.value)}
                  className="h-10 rounded-xl border border-[#d6e2f6] bg-white px-3 text-center text-sm font-bold text-[#111] outline-none"
                  placeholder="0"
                />
              </div>

              <button
                type="button"
                onClick={onApplyScore}
                className="mt-3 w-full rounded-xl bg-[#0b4da2] px-4 py-2.5 text-sm font-black text-white transition hover:brightness-110"
              >
                Apply winner from scores
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FinalsMatchCard({
  game,
  selected,
  score,
  expanded,
  onToggleExpanded,
  onPick,
  onClear,
  onScoreChange,
  onApplyScore,
}: {
  game: FinalsGameDef;
  selected?: string;
  score?: PredictedScore;
  expanded?: boolean;
  onToggleExpanded: () => void;
  onPick: (winner: string) => void;
  onClear: () => void;
  onScoreChange: (side: "home" | "away", value: string) => void;
  onApplyScore: () => void;
}) {
  const canPick = !!game.homeTeam && !!game.awayTeam;
  const homeSelected = selected === game.homeTeam;
  const awaySelected = selected === game.awayTeam;

  return (
    <div className="rounded-[22px] border border-[#e4e8ef] bg-white p-3 shadow-[0_10px_30px_rgba(11,77,162,0.05)]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#0b4da2]">
            {game.stage}
          </div>
          <div className="mt-1 text-lg font-black text-[#111]">{game.label}</div>
        </div>

        {selected ? (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#f0d2d2] bg-white text-[#b42318] transition hover:bg-[#fff5f5]"
            aria-label={`Clear ${game.label}`}
            title={`Clear ${game.label}`}
          >
            <TrashIcon />
          </button>
        ) : null}
      </div>

      {!canPick ? (
        <div className="rounded-[16px] border border-dashed border-[#d7deea] bg-[#f8fafc] px-4 py-6 text-center text-sm font-bold text-[#6f7a89]">
          Awaiting previous winner
        </div>
      ) : (
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => onPick(game.homeTeam)}
            className={`flex w-full items-center justify-between rounded-[16px] border px-4 py-3 text-left transition ${
              homeSelected
                ? "border-[#0b4da2] bg-[#edf5ff]"
                : "border-[#e4e8ef] bg-[#fafbfc] hover:bg-[#f4f8ff]"
            }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative h-11 w-11 overflow-hidden rounded-xl bg-white shadow-sm">
                <Image
                  src={getTeamIcon(game.homeTeam)}
                  alt={game.homeTeam}
                  fill
                  className="object-contain p-1"
                  unoptimized
                />
              </div>
              <span className="truncate text-[15px] font-black text-[#111]">
                {game.homeTeam}
              </span>
            </div>
            {selected ? (
              <span className="text-[18px] font-black text-[#111]">
                {score?.home ?? 0}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => onPick(game.awayTeam)}
            className={`flex w-full items-center justify-between rounded-[16px] border px-4 py-3 text-left transition ${
              awaySelected
                ? "border-[#0b4da2] bg-[#edf5ff]"
                : "border-[#e4e8ef] bg-[#fafbfc] hover:bg-[#f4f8ff]"
            }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative h-11 w-11 overflow-hidden rounded-xl bg-white shadow-sm">
                <Image
                  src={getTeamIcon(game.awayTeam)}
                  alt={game.awayTeam}
                  fill
                  className="object-contain p-1"
                  unoptimized
                />
              </div>
              <span className="truncate text-[15px] font-black text-[#111]">
                {game.awayTeam}
              </span>
            </div>
            {selected ? (
              <span className="text-[18px] font-black text-[#111]">
                {score?.away ?? 0}
              </span>
            ) : null}
          </button>
        </div>
      )}

      {canPick && selected && (
        <div className="mt-3 rounded-[16px] border border-[#e7edf7] bg-[#f8fbff] p-3">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onToggleExpanded}
              className="text-[12px] font-black uppercase tracking-[0.08em] text-[#0b4da2]"
            >
              {expanded ? "Hide scores" : "Custom scores"}
            </button>

            <div className="rounded-full bg-[#ecf3ff] px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-[#0b4da2]">
              Winner selected
            </div>
          </div>

          {expanded && (
            <div className="mt-3">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <input
                  inputMode="numeric"
                  value={toInputValue(score?.home)}
                  onChange={(e) => onScoreChange("home", e.target.value)}
                  className="h-10 rounded-xl border border-[#d6e2f6] bg-white px-3 text-center text-sm font-bold text-[#111] outline-none"
                  placeholder="0"
                />
                <span className="text-[12px] font-black uppercase tracking-[0.08em] text-[#7a7a7a]">
                  v
                </span>
                <input
                  inputMode="numeric"
                  value={toInputValue(score?.away)}
                  onChange={(e) => onScoreChange("away", e.target.value)}
                  className="h-10 rounded-xl border border-[#d6e2f6] bg-white px-3 text-center text-sm font-bold text-[#111] outline-none"
                  placeholder="0"
                />
              </div>

              <button
                type="button"
                onClick={onApplyScore}
                className="mt-3 w-full rounded-xl bg-[#0b4da2] px-4 py-2.5 text-sm font-black text-white transition hover:brightness-110"
              >
                Apply winner from scores
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PredictorPage() {
  const [games, setGames] = useState<SquiggleGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [viewMode, setViewMode] = useState<ViewMode>("round");
  const [selectedRound, setSelectedRound] = useState(0);
  const [selectedTeam, setSelectedTeam] = useState("");

  const [picks, setPicks] = useState<PickMap>({});
  const [predictedScores, setPredictedScores] = useState<ScoreMap>({});
  const [expandedScores, setExpandedScores] = useState<Record<number, boolean>>(
    {}
  );

  const [showActualLadder, setShowActualLadder] = useState(false);
  const [showFinalsPredictor, setShowFinalsPredictor] = useState(false);

  const [showAutofillMenu, setShowAutofillMenu] = useState(false);
  const [showClearMenu, setShowClearMenu] = useState(false);

  const [finalsPicks, setFinalsPicks] = useState<FinalsPickMap>({});
  const [finalsScores, setFinalsScores] = useState<FinalsScoreMap>({});
  const [expandedFinalsScores, setExpandedFinalsScores] = useState<
    Partial<Record<FinalsGameId, boolean>>
  >({});

  const actionMenusRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadGames() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(API_URL, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        const nextGames: SquiggleGame[] = Array.isArray(json?.games)
          ? json.games
          : [];

        const filtered = nextGames
          .filter((g) => typeof g.round === "number" && (g.round ?? 0) <= 24)
          .sort((a, b) => {
            const da = new Date(a.date ?? a.localtime ?? "").getTime();
            const db = new Date(b.date ?? b.localtime ?? "").getTime();
            return da - db;
          });

        if (!mounted) return;

        const currentRound = getCurrentRound(filtered);
        setGames(filtered);
        setSelectedRound(currentRound);
        setPicks(buildInitialPicks(filtered));
        setPredictedScores(buildInitialScores(filtered));
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadGames();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        actionMenusRef.current &&
        !actionMenusRef.current.contains(e.target as Node)
      ) {
        setShowAutofillMenu(false);
        setShowClearMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const allRounds = useMemo(() => {
    return Array.from(
      new Set(
        games
          .map((g) => g.round)
          .filter((r): r is number => typeof r === "number" && r >= 0 && r <= 24)
      )
    ).sort((a, b) => a - b);
  }, [games]);

  const allTeams = useMemo(() => getAllTeams(games), [games]);

  const currentRoundIndex = allRounds.indexOf(selectedRound);

  const roundGames = useMemo(
    () => games.filter((g) => g.round === selectedRound),
    [games, selectedRound]
  );

  const teamGames = useMemo(() => {
    if (!selectedTeam) return [];
    return games.filter((g) => {
      const home = normaliseTeamName(g.hteam);
      const away = normaliseTeamName(g.ateam);
      return home === selectedTeam || away === selectedTeam;
    });
  }, [games, selectedTeam]);

  const groupedGames = useMemo(() => {
    const source = viewMode === "round" ? roundGames : teamGames;
    const map = new Map<string, SquiggleGame[]>();

    source.forEach((game) => {
      const key = formatDayHeading(game.date ?? game.localtime);
      const existing = map.get(key) ?? [];
      existing.push(game);
      map.set(key, existing);
    });

    return Array.from(map.entries());
  }, [viewMode, roundGames, teamGames]);

  const predictedLadder = useMemo(
    () => buildPredictedLadder(games, picks, predictedScores),
    [games, picks, predictedScores]
  );

  const actualOnlyLadder = useMemo(() => {
    const playedOnly = games.filter((g) => isPlayed(g));
    return buildPredictedLadder(playedOnly, {}, {});
  }, [games]);

  const ladderToShow = showActualLadder ? actualOnlyLadder : predictedLadder;

  const hasCompletedRegularSeason = useMemo(() => {
    const regularSeasonRounds = allRounds.filter((round) => round <= 24);

    return (
      regularSeasonRounds.length > 0 &&
      regularSeasonRounds.every((round) => {
        const roundGamesOnly = games.filter((g) => g.round === round);
        return (
          roundGamesOnly.length > 0 &&
          roundGamesOnly.every((g, idx) => {
            if (isPlayed(g)) return true;
            return !!picks[getGameId(g, idx)];
          })
        );
      })
    );
  }, [allRounds, games, picks]);

  const finalsAvailable = selectedRound >= 24 || hasCompletedRegularSeason;

  const finalsDefs = useMemo(
    () => buildFinalsDefs(predictedLadder, finalsPicks),
    [predictedLadder, finalsPicks]
  );

  const finalsById = useMemo(() => {
    const map: Partial<Record<FinalsGameId, FinalsGameDef>> = {};
    finalsDefs.forEach((game) => {
      map[game.id] = game;
    });
    return map;
  }, [finalsDefs]);

  const predictedPremier = finalsPicks.GF ?? "";

  function setWinnerForGame(game: SquiggleGame, index: number, winner: string) {
    const id = getGameId(game, index);
    const home = normaliseTeamName(game.hteam);
    const away = normaliseTeamName(game.ateam);

    if (!home || !away || isPlayed(game)) return;

    setPicks((prev) => ({
      ...prev,
      [id]: winner,
    }));

    setPredictedScores((prev) => {
      const existing = prev[id];
      let nextScore: PredictedScore;

      if (winner === "DRAW") {
        nextScore = randomWinningScore("draw", existing);
      } else if (winner === home) {
        nextScore = randomWinningScore("home", existing);
      } else {
        nextScore = randomWinningScore("away", existing);
      }

      return {
        ...prev,
        [id]: nextScore,
      };
    });
  }

  function clearTip(game: SquiggleGame, index: number) {
    const id = getGameId(game, index);
    if (isPlayed(game)) return;

    setPicks((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    setPredictedScores((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    setExpandedScores((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function updateCustomScore(
    game: SquiggleGame,
    index: number,
    side: "home" | "away",
    rawValue: string
  ) {
    const id = getGameId(game, index);
    const safe = rawValue.replace(/[^\d]/g, "");
    const value = safe === "" ? 0 : Number(safe);

    setPredictedScores((prev) => ({
      ...prev,
      [id]: {
        home: side === "home" ? value : prev[id]?.home ?? 0,
        away: side === "away" ? value : prev[id]?.away ?? 0,
        custom: true,
      },
    }));
  }

  function applyWinnerFromScores(game: SquiggleGame, index: number) {
    const id = getGameId(game, index);
    const score = predictedScores[id];
    if (!score) return;

    const home = normaliseTeamName(game.hteam);
    const away = normaliseTeamName(game.ateam);
    if (!home || !away) return;

    if (score.home > score.away) {
      setWinnerForGame(game, index, home);
    } else if (score.away > score.home) {
      setWinnerForGame(game, index, away);
    } else {
      setWinnerForGame(game, index, "DRAW");
    }

    setPredictedScores((prev) => ({
      ...prev,
      [id]: {
        ...score,
        custom: true,
      },
    }));
  }

  function autofillRound() {
    const nextPicks: PickMap = {};
    const nextScores: ScoreMap = {};

    roundGames.forEach((game, index) => {
      if (isPlayed(game)) return;

      const id = getGameId(game, index);
      const home = normaliseTeamName(game.hteam);
      const away = normaliseTeamName(game.ateam);
      if (!home || !away) return;

      const pickHome = Math.random() >= 0.5;
      const winner = pickHome ? home : away;

      nextPicks[id] = winner;
      nextScores[id] = randomWinningScore(pickHome ? "home" : "away");
    });

    setPicks((prev) => ({ ...prev, ...nextPicks }));
    setPredictedScores((prev) => ({ ...prev, ...nextScores }));
    setShowAutofillMenu(false);
  }

  function autofillAll() {
    const nextPicks: PickMap = {};
    const nextScores: ScoreMap = {};

    games.forEach((game, index) => {
      if (isPlayed(game)) return;

      const id = getGameId(game, index);
      const home = normaliseTeamName(game.hteam);
      const away = normaliseTeamName(game.ateam);
      if (!home || !away) return;

      const pickHome = Math.random() >= 0.5;
      const winner = pickHome ? home : away;

      nextPicks[id] = winner;
      nextScores[id] = randomWinningScore(pickHome ? "home" : "away");
    });

    setPicks((prev) => ({ ...prev, ...nextPicks }));
    setPredictedScores((prev) => ({ ...prev, ...nextScores }));
    setShowAutofillMenu(false);
  }

  function clearRound() {
    const ids = new Set(roundGames.filter((g) => !isPlayed(g)).map((g, i) => getGameId(g, i)));

    setPicks((prev) => {
      const next = { ...prev };
      ids.forEach((id) => delete next[id]);
      return next;
    });

    setPredictedScores((prev) => {
      const next = { ...prev };
      ids.forEach((id) => delete next[id]);
      return next;
    });

    setExpandedScores((prev) => {
      const next = { ...prev };
      ids.forEach((id) => delete next[id]);
      return next;
    });

    setShowClearMenu(false);
  }

  function clearAll() {
    setPicks(buildInitialPicks(games));
    setPredictedScores(buildInitialScores(games));
    setExpandedScores({});
    setFinalsPicks({});
    setFinalsScores({});
    setExpandedFinalsScores({});
    setShowClearMenu(false);
  }

  function setFinalsWinner(game: FinalsGameDef, winner: string) {
    if (!game.homeTeam || !game.awayTeam) return;

    setFinalsPicks((prev) => ({
      ...prev,
      [game.id]: winner,
    }));

    setFinalsScores((prev) => {
      const existing = prev[game.id];
      const nextScore =
        winner === game.homeTeam
          ? randomWinningScore("home", existing)
          : randomWinningScore("away", existing);

      return {
        ...prev,
        [game.id]: nextScore,
      };
    });
  }

  function clearFinalsTip(id: FinalsGameId) {
    setFinalsPicks((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    setFinalsScores((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    setExpandedFinalsScores((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }

  function updateFinalsCustomScore(
    id: FinalsGameId,
    side: "home" | "away",
    rawValue: string
  ) {
    const safe = rawValue.replace(/[^\d]/g, "");
    const value = safe === "" ? 0 : Number(safe);

    setFinalsScores((prev) => ({
      ...prev,
      [id]: {
        home: side === "home" ? value : prev[id]?.home ?? 0,
        away: side === "away" ? value : prev[id]?.away ?? 0,
        custom: true,
      },
    }));
  }

  function applyFinalsWinnerFromScores(id: FinalsGameId) {
    const game = finalsById[id];
    const score = finalsScores[id];

    if (!game || !score || !game.homeTeam || !game.awayTeam) return;

    let winner = game.homeTeam;
    if (score.away > score.home) winner = game.awayTeam;

    setFinalsWinner(game, winner);

    setFinalsScores((prev) => ({
      ...prev,
      [id]: {
        ...score,
        custom: true,
      },
    }));
  }

  if (loading) {
    return (
      <div
        className="min-h-screen bg-cover bg-center bg-no-repeat px-4 py-6"
        style={{ backgroundImage: `url('${BG_IMAGE}')` }}
      >
        <div className="mx-auto max-w-[1500px]">
          <SectionCard className="px-6 py-10">
            <div className="text-lg font-bold text-[#111]">Loading predictor…</div>
          </SectionCard>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen bg-cover bg-center bg-no-repeat px-4 py-6"
        style={{ backgroundImage: `url('${BG_IMAGE}')` }}
      >
        <div className="mx-auto max-w-[1500px]">
          <SectionCard className="border-red-200 px-6 py-10">
            <div className="text-lg font-bold text-red-600">
              Could not load predictor
            </div>
            <p className="mt-2 text-sm font-medium text-[#666]">{error}</p>
          </SectionCard>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat px-3 py-4 text-[#111] sm:px-5 lg:px-6"
      style={{ backgroundImage: `url('${BG_IMAGE}')` }}
    >
      <div className="mx-auto max-w-[1500px]">
        <SectionCard className="relative z-[200] mb-4 overflow-visible p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-[28px] font-black tracking-tight text-[#111] sm:text-[36px]">
                AFL Ladder Predictor
              </h1>
              <p className="mt-1 text-sm font-medium text-[#666]">
                Tip the rest of the 2026 season, then predict the finals bracket.
              </p>
            </div>

            <div ref={actionMenusRef} className="relative z-[80] flex flex-wrap items-center gap-2">
              <div className="relative z-[90]">
                <button
                  type="button"
                  onClick={() => {
                    setShowAutofillMenu((prev) => !prev);
                    setShowClearMenu(false);
                  }}
                  className="rounded-xl bg-[#0b4da2] px-4 py-2 text-sm font-black text-white shadow-sm transition hover:brightness-110"
                >
                  Autofill
                </button>

                {showAutofillMenu && (
                  <div className="absolute right-0 z-[300] mt-2 w-44 overflow-hidden rounded-2xl border border-[#d9d9d9] bg-white shadow-[0_12px_28px_rgba(0,0,0,0.12)]">
                    <button
                      type="button"
                      onClick={autofillRound}
                      className="block w-full px-4 py-3 text-left text-sm font-bold text-[#111] transition hover:bg-[#f7fbff]"
                    >
                      Autofill Round
                    </button>
                    <button
                      type="button"
                      onClick={autofillAll}
                      className="block w-full px-4 py-3 text-left text-sm font-bold text-[#111] transition hover:bg-[#f7fbff]"
                    >
                      Autofill All
                    </button>
                  </div>
                )}
              </div>

              <div className="relative z-[90]">
                <button
                  type="button"
                  onClick={() => {
                    setShowClearMenu((prev) => !prev);
                    setShowAutofillMenu(false);
                  }}
                  className="rounded-xl border border-[#d7d7d7] bg-white px-4 py-2 text-sm font-black text-[#111] shadow-sm transition hover:bg-[#fafafa]"
                >
                  Clear
                </button>

                {showClearMenu && (
                  <div className="absolute right-0 z-[90] mt-2 w-44 overflow-hidden rounded-2xl border border-[#d9d9d9] bg-white shadow-[0_12px_28px_rgba(0,0,0,0.12)]">
                    <button
                      type="button"
                      onClick={clearRound}
                      className="block w-full px-4 py-3 text-left text-sm font-bold text-[#111] transition hover:bg-[#fafafa]"
                    >
                      Clear Round
                    </button>
                    <button
                      type="button"
                      onClick={clearAll}
                      className="block w-full px-4 py-3 text-left text-sm font-bold text-[#b42318] transition hover:bg-[#fff5f5]"
                    >
                      Clear All
                    </button>
                  </div>
                )}
              </div>

              {finalsAvailable && (
                <button
                  type="button"
                  onClick={() => setShowFinalsPredictor((prev) => !prev)}
                  className={`rounded-xl px-4 py-2 text-sm font-black shadow-sm transition ${
                    showFinalsPredictor
                      ? "border border-[#d0d0d0] bg-white text-[#0b4da2] hover:bg-[#f6f9ff]"
                      : "bg-[#0b4da2] text-white hover:brightness-110"
                  }`}
                >
                  {showFinalsPredictor ? "Show Ladder" : "Finals Predictor"}
                </button>
              )}
            </div>
          </div>
        </SectionCard>

        <div className="relative z-0 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <SectionCard className="relative overflow-visible">
            {!showFinalsPredictor && (
              <div className="border-b border-[#ececec] px-4 py-3 sm:px-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-3 text-sm font-semibold text-[#555]">
                      <span>Actual Ladder</span>
                      <button
                        type="button"
                        onClick={() => setShowActualLadder((prev) => !prev)}
                        className={`relative h-7 w-14 rounded-full transition ${
                          showActualLadder ? "bg-[#0b4da2]" : "bg-[#d2d2d2]"
                        }`}
                      >
                        <span
                          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                            showActualLadder ? "left-8" : "left-1"
                          }`}
                        />
                      </button>
                    </label>

                    <div className="inline-flex overflow-hidden rounded-xl border border-[#d7d7d7] bg-white shadow-sm">
                      <button
                        type="button"
                        onClick={() => setViewMode("round")}
                        className={`px-4 py-2 text-sm font-black transition ${
                          viewMode === "round"
                            ? "bg-[#0b4da2] text-white"
                            : "text-[#0b4da2] hover:bg-[#f4f8ff]"
                        }`}
                      >
                        By Round
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode("team")}
                        className={`px-4 py-2 text-sm font-black transition ${
                          viewMode === "team"
                            ? "bg-[#0b4da2] text-white"
                            : "text-[#0b4da2] hover:bg-[#f4f8ff]"
                        }`}
                      >
                        By Team
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {viewMode === "round" ? (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            currentRoundIndex > 0 &&
                            setSelectedRound(allRounds[currentRoundIndex - 1])
                          }
                          disabled={currentRoundIndex <= 0}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#dde3ea] bg-white text-[#111] transition disabled:opacity-40"
                        >
                          <ChevronLeftIcon />
                        </button>

                        <div className="rounded-2xl border border-[#e5e7eb] bg-[#f8fafc] px-4 py-2.5 text-sm font-black text-[#111]">
                          Round {selectedRound}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            currentRoundIndex < allRounds.length - 1 &&
                            setSelectedRound(allRounds[currentRoundIndex + 1])
                          }
                          disabled={currentRoundIndex >= allRounds.length - 1}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#dde3ea] bg-white text-[#111] transition disabled:opacity-40"
                        >
                          <ChevronRightIcon />
                        </button>
                      </>
                    ) : (
                      <select
                        value={selectedTeam}
                        onChange={(e) => setSelectedTeam(e.target.value)}
                        className="h-11 rounded-2xl border border-[#d7dce5] bg-white px-4 text-sm font-bold text-[#111] outline-none"
                      >
                        <option value="">Choose team</option>
                        {allTeams.map((team) => (
                          <option key={team} value={team}>
                            {team}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>
            )}

            {showFinalsPredictor ? (
              <div className="p-4 sm:p-5">
                {!finalsAvailable ? (
                  <div className="rounded-[18px] border border-[#e0e0e0] bg-[#f8f8f8] px-4 py-5 text-sm font-semibold text-[#666]">
                    Finals Predictor unlocks once you get to Round 24.
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-medium text-[#666]">
                        Top 6 make finals. Teams 7–10 play wildcard games first. Seed 6 faces the higher-ranked wildcard winner in EF2, and seed 5 faces the lower-ranked winner in EF1.
                      </p>

                      {predictedPremier ? (
                        <div className="rounded-full bg-[#eef4ff] px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#0b4da2]">
                          Premier: {predictedPremier}
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-5">
                      {[
                        {
                          title: "Wildcard",
                          ids: ["WC1", "WC2"] as FinalsGameId[],
                        },
                        {
                          title: "Qualifying Finals",
                          ids: ["QF1", "QF2"] as FinalsGameId[],
                        },
                        {
                          title: "Elimination Finals",
                          ids: ["EF1", "EF2"] as FinalsGameId[],
                        },
                        {
                          title: "Semi Finals",
                          ids: ["SF1", "SF2"] as FinalsGameId[],
                        },
                        {
                          title: "Preliminary Finals",
                          ids: ["PF1", "PF2"] as FinalsGameId[],
                        },
                        {
                          title: "Grand Final",
                          ids: ["GF"] as FinalsGameId[],
                        },
                      ].map((section) => (
                        <div key={section.title}>
                          <div className="mb-3 text-[12px] font-black uppercase tracking-[0.16em] text-[#0b4da2]">
                            {section.title}
                          </div>
                          <div
                            className={`grid gap-4 ${
                              section.ids.length === 1
                                ? "grid-cols-1"
                                : "grid-cols-1 lg:grid-cols-2"
                            }`}
                          >
                            {section.ids.map((id) => {
                              const game = finalsById[id];
                              if (!game) return null;

                              return (
                                <FinalsMatchCard
                                  key={id}
                                  game={game}
                                  selected={finalsPicks[id]}
                                  score={finalsScores[id]}
                                  expanded={!!expandedFinalsScores[id]}
                                  onToggleExpanded={() =>
                                    setExpandedFinalsScores((prev) => ({
                                      ...prev,
                                      [id]: !prev[id],
                                    }))
                                  }
                                  onPick={(winner) => setFinalsWinner(game, winner)}
                                  onClear={() => clearFinalsTip(id)}
                                  onScoreChange={(side, value) =>
                                    updateFinalsCustomScore(id, side, value)
                                  }
                                  onApplyScore={() => applyFinalsWinnerFromScores(id)}
                                />
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="p-4 sm:p-5">
                {viewMode === "team" && !selectedTeam ? (
                  <div className="rounded-[18px] border border-[#e0e0e0] bg-[#f8f8f8] px-4 py-5 text-sm font-semibold text-[#666]">
                    Choose a team to view its matches.
                  </div>
                ) : groupedGames.length === 0 ? (
                  <div className="rounded-[18px] border border-[#e0e0e0] bg-[#f8f8f8] px-4 py-5 text-sm font-semibold text-[#666]">
                    No games found.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {groupedGames.map(([day, dayGames]) => (
                      <div key={day}>
                        <div className="mb-3 text-[12px] font-black uppercase tracking-[0.16em] text-[#0b4da2]">
                          {day}
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                          {dayGames.map((game, index) => {
                            const id = getGameId(game, index);

                            return (
                              <GameCard
                                key={id}
                                game={game}
                                index={index}
                                pick={picks[id]}
                                score={predictedScores[id]}
                                expanded={!!expandedScores[id]}
                                onPick={(winner) => setWinnerForGame(game, index, winner)}
                                onClear={() => clearTip(game, index)}
                                onToggleExpanded={() =>
                                  setExpandedScores((prev) => ({
                                    ...prev,
                                    [id]: !prev[id],
                                  }))
                                }
                                onScoreChange={(side, value) =>
                                  updateCustomScore(game, index, side, value)
                                }
                                onApplyScore={() => applyWinnerFromScores(game, index)}
                              />
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {viewMode === "round" && roundGames.length > 0 && (
                      <div className="flex items-center justify-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() =>
                            currentRoundIndex > 0 &&
                            setSelectedRound(allRounds[currentRoundIndex - 1])
                          }
                          disabled={currentRoundIndex <= 0}
                          className="inline-flex items-center gap-2 rounded-xl border border-[#d7dce5] bg-white px-4 py-2.5 text-sm font-black text-[#111] transition disabled:opacity-40"
                        >
                          <ChevronLeftIcon />
                          Previous
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            currentRoundIndex < allRounds.length - 1 &&
                            setSelectedRound(allRounds[currentRoundIndex + 1])
                          }
                          disabled={currentRoundIndex >= allRounds.length - 1}
                          className="inline-flex items-center gap-2 rounded-xl border border-[#d7dce5] bg-white px-4 py-2.5 text-sm font-black text-[#111] transition disabled:opacity-40"
                        >
                          Next
                          <ChevronRightIcon />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </SectionCard>

          <SectionCard className="overflow-hidden">
            <div className="border-b border-[#ececec] px-4 py-4 sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[12px] font-black uppercase tracking-[0.16em] text-[#0b4da2]">
                    {showActualLadder ? "Actual Ladder" : "Predicted Ladder"}
                  </div>
                  <div className="mt-1 text-sm font-medium text-[#666]">
                    Order: P, W-L-D, PTS, %
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="rounded-full bg-[#edf5ff] px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-[#0b4da2]">
                    Top 6 Finals
                  </div>
                  <div className="rounded-full bg-[#f3efff] px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-[#7b61ff]">
                    7–10 Wildcard
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-[#eceff4] bg-[#f8fafc]">
                    <th className="px-3 py-3 text-center text-[12px] font-black uppercase tracking-[0.08em] text-[#667085] sm:px-4">
                      #
                    </th>
                    <th className="px-3 py-3 text-left text-[12px] font-black uppercase tracking-[0.08em] text-[#667085] sm:px-4">
                      Team
                    </th>
                    <th className="px-3 py-3 text-center text-[12px] font-black uppercase tracking-[0.08em] text-[#667085] sm:px-4">
                      P
                    </th>
                    <th className="px-3 py-3 text-center text-[12px] font-black uppercase tracking-[0.08em] text-[#667085] sm:px-4">
                      W-L-D
                    </th>
                    <th className="px-3 py-3 text-center text-[12px] font-black uppercase tracking-[0.08em] text-[#667085] sm:px-4">
                      PTS
                    </th>
                    <th className="px-3 py-3 text-center text-[12px] font-black uppercase tracking-[0.08em] text-[#667085] sm:px-4">
                      %
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {ladderToShow.map((stat, index) => (
                    <LadderRow
                      key={stat.team}
                      stat={stat}
                      index={index}
                      dividerAfter={index === 5 || index === 9}
                      dividerColor={index === 5 ? "#0b4da2" : "#7b61ff"}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}