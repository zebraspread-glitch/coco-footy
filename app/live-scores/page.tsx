"use client";

import { useEffect, useMemo, useState } from "react";

type Game = {
  id: number;
  round?: number;
  hteam: string;
  ateam: string;
  hteamid?: number;
  ateamid?: number;
  hscore: number;
  ascore: number;
  hgoals?: number;
  hbehinds?: number;
  agoals?: number;
  abehinds?: number;
  timestr?: string;
  venue?: string;
  date?: string;
  complete: number;
};

type TeamRecord = {
  wins: number;
  losses: number;
  draws: number;
};

type LadderRow = {
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

const DEFAULT_SEASON = 2026;
const EARLIEST_SQUIGGLE_SEASON = 2000;

function buildSeasonOptions() {
  const currentYear = new Date().getFullYear();
  const lastYear = Math.max(currentYear, DEFAULT_SEASON);

  return Array.from(
    { length: lastYear - EARLIEST_SQUIGGLE_SEASON + 1 },
    (_, i) => lastYear - i
  );
}

const SEASON_OPTIONS = buildSeasonOptions();

function clubSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function normalizeTeamName(teamName?: string) {
  if (!teamName) return "";

  const map: Record<string, string> = {
    Brisbane: "Brisbane Lions",
    "Brisbane Lions": "Brisbane Lions",
    "Greater Western Sydney": "GWS",
    GWS: "GWS",
  };

  return map[teamName] || teamName;
}

function getTeamIcon(teamName?: string) {
  if (!teamName) return null;

  const normalized = normalizeTeamName(teamName);

  const iconMap: Record<string, string> = {
    Adelaide: "/team-icons/adelaide.png",
    Brisbane: "/team-icons/brisbane.png",
    "Brisbane Lions": "/team-icons/brisbane.png",
    Carlton: "/team-icons/carlton.png",
    Collingwood: "/team-icons/collingwood.png",
    Essendon: "/team-icons/essendon.png",
    Fremantle: "/team-icons/fremantle.png",
    Geelong: "/team-icons/geelong.png",
    "Gold Coast": "/team-icons/gold_coast.png",
    "Greater Western Sydney": "/team-icons/gws.png",
    GWS: "/team-icons/gws.png",
    Hawthorn: "/team-icons/hawthorn.png",
    Melbourne: "/team-icons/melbourne.png",
    "North Melbourne": "/team-icons/north_melbourne.png",
    "Port Adelaide": "/team-icons/port_adelaide.png",
    Richmond: "/team-icons/richmond.png",
    "St Kilda": "/team-icons/st_kilda.png",
    Sydney: "/team-icons/sydney.png",
    "West Coast": "/team-icons/west_coast.png",
    "Western Bulldogs": "/team-icons/western_bulldogs.png",
  };

  return iconMap[normalized] || `/team-icons/${clubSlug(normalized)}.png`;
}

function formatGameTime(dateString?: string) {
  if (!dateString) return "TBD";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "TBD";

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatGameDay(dateString?: string) {
  if (!dateString) return "UPCOMING";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "UPCOMING";

  const days = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];

  return days[date.getDay()];
}

function isSameLocalDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m ${String(
      seconds
    ).padStart(2, "0")}s`;
  }

  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

function getGameStatusPill(game: Game, nowMs: number) {
  const isLive = game.complete > 0 && game.complete < 100;
  const isFinal = game.complete === 100;
  const isUpcoming = game.complete === 0;

  if (isLive) return "LIVE";
  if (isFinal) return "FINAL";

  if (!isUpcoming || !game.date) {
    return game.timestr || formatGameTime(game.date);
  }

  const gameDate = new Date(game.date);
  if (Number.isNaN(gameDate.getTime())) {
    return game.timestr || "TBD";
  }

  const now = new Date(nowMs);
  const isToday = isSameLocalDay(gameDate, now);
  const diff = gameDate.getTime() - nowMs;

  if (isToday && diff > 0) {
    return `Starts in ${formatCountdown(diff)}`;
  }

  return game.timestr || formatGameTime(game.date);
}

function sortGames(games: Game[]) {
  return [...games].sort((a, b) => {
    const aLive = a.complete > 0 && a.complete < 100;
    const bLive = b.complete > 0 && b.complete < 100;

    if (aLive && !bLive) return -1;
    if (bLive && !aLive) return 1;

    if (a.complete === 0 && b.complete === 100) return -1;
    if (a.complete === 100 && b.complete === 0) return 1;

    const aDate = a.date ? new Date(a.date).getTime() : 0;
    const bDate = b.date ? new Date(b.date).getTime() : 0;

    return aDate - bDate;
  });
}

function buildTeamRecords(allGames: Game[]) {
  const records: Record<string, TeamRecord> = {};

  const ensureTeam = (team: string) => {
    const normalized = normalizeTeamName(team);

    if (!records[normalized]) {
      records[normalized] = { wins: 0, losses: 0, draws: 0 };
    }

    return normalized;
  };

  for (const game of allGames) {
    if (game.complete !== 100) continue;

    const homeTeam = ensureTeam(game.hteam);
    const awayTeam = ensureTeam(game.ateam);

    if (game.hscore > game.ascore) {
      records[homeTeam].wins += 1;
      records[awayTeam].losses += 1;
    } else if (game.ascore > game.hscore) {
      records[awayTeam].wins += 1;
      records[homeTeam].losses += 1;
    } else {
      records[homeTeam].draws += 1;
      records[awayTeam].draws += 1;
    }
  }

  return records;
}

function formatTeamRecord(teamName: string, records: Record<string, TeamRecord>) {
  const normalized = normalizeTeamName(teamName);
  const record = records[normalized];

  if (!record) return "0-0";

  if (record.draws > 0) {
    return `${record.wins}-${record.losses}-${record.draws}`;
  }

  return `${record.wins}-${record.losses}`;
}

function getCurrentRound(allSeasonGames: Game[]) {
  if (!allSeasonGames.length) return 0;

  const sortedByDate = [...allSeasonGames].sort((a, b) => {
    const aDate = a.date ? new Date(a.date).getTime() : 0;
    const bDate = b.date ? new Date(b.date).getTime() : 0;
    return aDate - bDate;
  });

  const liveGame = sortedByDate.find((g) => g.complete > 0 && g.complete < 100);
  if (liveGame?.round !== undefined) return liveGame.round;

  const upcomingGame = sortedByDate.find((g) => g.complete === 0);
  if (upcomingGame?.round !== undefined) return upcomingGame.round;

  const completedRounds = sortedByDate
    .filter((g) => g.complete === 100 && g.round !== undefined)
    .map((g) => g.round as number);

  if (completedRounds.length > 0) {
    return Math.max(...completedRounds);
  }

  const firstRound = sortedByDate.find((g) => g.round !== undefined)?.round;
  return firstRound ?? 0;
}

function buildLiveLadder(allGames: Game[]) {
  const ladderMap: Record<string, LadderRow> = {};

  const ensureTeam = (teamName: string) => {
    const normalized = normalizeTeamName(teamName);

    if (!ladderMap[normalized]) {
      ladderMap[normalized] = {
        team: normalized,
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

    return ladderMap[normalized];
  };

  for (const game of allGames) {
    if (game.round === undefined || game.round > 24) continue;

    const countsForLadder =
      game.complete === 100 || (game.complete > 0 && game.complete < 100);

    if (!countsForLadder) continue;

    const home = ensureTeam(game.hteam);
    const away = ensureTeam(game.ateam);

    home.played += 1;
    away.played += 1;

    home.pointsFor += game.hscore ?? 0;
    home.pointsAgainst += game.ascore ?? 0;

    away.pointsFor += game.ascore ?? 0;
    away.pointsAgainst += game.hscore ?? 0;

    if (game.hscore > game.ascore) {
      home.wins += 1;
      away.losses += 1;
      home.premiershipPoints += 4;
    } else if (game.ascore > game.hscore) {
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

  const rows = Object.values(ladderMap).map((row) => ({
    ...row,
    percentage:
      row.pointsAgainst > 0 ? (row.pointsFor / row.pointsAgainst) * 100 : 0,
  }));

  rows.sort((a, b) => {
    if (b.premiershipPoints !== a.premiershipPoints) {
      return b.premiershipPoints - a.premiershipPoints;
    }
    if (b.percentage !== a.percentage) {
      return b.percentage - a.percentage;
    }
    if (b.pointsFor !== a.pointsFor) {
      return b.pointsFor - a.pointsFor;
    }
    return a.team.localeCompare(b.team);
  });

  return rows;
}

function ScoreCard({
  game,
  teamRecords,
  nowMs,
}: {
  game: Game;
  teamRecords: Record<string, TeamRecord>;
  nowMs: number;
}) {
  const isLive = game.complete > 0 && game.complete < 100;
  const isFinal = game.complete === 100;
  const isUpcoming = game.complete === 0;

  const homeLeading = game.hscore > game.ascore;
  const awayLeading = game.ascore > game.hscore;
  const isDraw = game.hscore === game.ascore;

  const borderClass = isLive
    ? "border-emerald-400/60 shadow-[0_0_0_1px_rgba(52,211,153,0.25),0_18px_50px_rgba(0,0,0,0.35)]"
    : isFinal
    ? "border-violet-400/60 shadow-[0_0_0_1px_rgba(167,139,250,0.2),0_18px_50px_rgba(0,0,0,0.35)]"
    : "border-white/10 shadow-[0_18px_50px_rgba(0,0,0,0.35)]";

  const winningScoreClass = "text-white";
  const normalScoreClass = "text-white";
  const losingScoreClass = "text-white/45";

  const homeScoreClass =
    isUpcoming || isDraw
      ? normalScoreClass
      : homeLeading
      ? winningScoreClass
      : losingScoreClass;

  const awayScoreClass =
    isUpcoming || isDraw
      ? normalScoreClass
      : awayLeading
      ? winningScoreClass
      : losingScoreClass;

  const statusPill = getGameStatusPill(game, nowMs);
  const showCountdown = isUpcoming && statusPill.startsWith("Starts in");

  return (
    <div
      className={[
        "group rounded-[26px] border p-5 transition duration-200",
        "bg-[linear-gradient(180deg,rgba(11,16,28,0.98)_0%,rgba(6,8,16,0.98)_100%)]",
        "hover:border-white/20 hover:translate-y-[-1px]",
        borderClass,
      ].join(" ")}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
          {isLive ? "LIVE" : isFinal ? "FINAL" : formatGameDay(game.date)}
        </div>
        <div
          className={[
            "rounded-full border px-3 py-1 text-xs font-semibold",
            showCountdown
              ? "border-sky-400/30 bg-sky-400/12 text-sky-300 shadow-[0_0_0_1px_rgba(56,189,248,0.08)]"
              : "border-white/10 bg-white/[0.04] text-white/70",
          ].join(" ")}
        >
          {statusPill}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {getTeamIcon(game.hteam) && (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/[0.03] ring-1 ring-white/8">
              <img
                src={getTeamIcon(game.hteam)!}
                alt={game.hteam}
                className="h-10 w-10 object-contain"
              />
            </div>
          )}

          <div className="min-w-0">
            <div className="truncate text-[15px] font-medium text-white/72">
              {game.hteam}
            </div>
            <div className={`text-[2.1rem] leading-none font-black ${homeScoreClass}`}>
              {isUpcoming
                ? formatTeamRecord(game.hteam, teamRecords)
                : game.hscore}
            </div>
          </div>
        </div>

        {!isUpcoming && (
          <div className="shrink-0 text-right">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
              Goals
            </div>
            <div className="text-sm font-bold text-white/55">
              {game.hgoals ?? 0}.{game.hbehinds ?? 0}
            </div>
          </div>
        )}
      </div>

      <div className="my-4 h-px bg-white/8" />

      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {getTeamIcon(game.ateam) && (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/[0.03] ring-1 ring-white/8">
              <img
                src={getTeamIcon(game.ateam)!}
                alt={game.ateam}
                className="h-10 w-10 object-contain"
              />
            </div>
          )}

          <div className="min-w-0">
            <div className="truncate text-[15px] font-medium text-white/72">
              {game.ateam}
            </div>
            <div className={`text-[2.1rem] leading-none font-black ${awayScoreClass}`}>
              {isUpcoming
                ? formatTeamRecord(game.ateam, teamRecords)
                : game.ascore}
            </div>
          </div>
        </div>

        {!isUpcoming && (
          <div className="shrink-0 text-right">
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
              Goals
            </div>
            <div className="text-sm font-bold text-white/55">
              {game.agoals ?? 0}.{game.abehinds ?? 0}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LadderTable({
  ladder,
  season,
}: {
  ladder: LadderRow[];
  season: number;
}) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(11,16,28,0.98)_0%,rgba(6,8,16,0.98)_100%)] shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
      <div className="border-b border-white/10 px-5 py-5">
        <div className="flex items-start justify-between">
          <h2 className="text-2xl font-black uppercase tracking-[0.08em]">
            Ladder
          </h2>
          <span className="text-sm text-white/60">Season {season}</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-white/[0.03] text-white/55">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Team</th>
              <th className="px-3 py-3 text-center">P</th>
              <th className="px-3 py-3 text-center">W</th>
              <th className="px-3 py-3 text-center">L</th>
              <th className="px-3 py-3 text-center">%</th>
              <th className="px-4 py-3 text-center">Pts</th>
            </tr>
          </thead>

          <tbody>
            {ladder.map((row, index) => {
              const pos = index + 1;

              let isGold = false;
              let isBlue = false;

              if (season === 2026) {
                isGold = pos >= 1 && pos <= 6;
                isBlue = pos >= 7 && pos <= 10;
              } else {
                isGold = pos >= 1 && pos <= 8;
                isBlue = false;
              }

              const rowClass = isGold
                ? "bg-yellow-400/[0.12]"
                : isBlue
                ? "bg-sky-400/[0.12]"
                : "";

              return (
                <tr
                  key={row.team}
                  className={`border-t border-white/8 ${rowClass}`}
                >
                  <td className="px-4 py-3 font-bold">{pos}</td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getTeamIcon(row.team) && (
                        <img
                          src={getTeamIcon(row.team)!}
                          alt={row.team}
                          className="h-6 w-6"
                        />
                      )}
                      <span className="font-semibold">{row.team}</span>
                    </div>
                  </td>

                  <td className="px-3 py-3 text-center">{row.played}</td>
                  <td className="px-3 py-3 text-center">{row.wins}</td>
                  <td className="px-3 py-3 text-center">{row.losses}</td>
                  <td className="px-3 py-3 text-center">
                    {row.percentage.toFixed(1)}
                  </td>
                  <td className="px-4 py-3 text-center font-bold">
                    {row.premiershipPoints}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex gap-4 border-t border-white/10 px-5 py-3 text-xs text-white/60">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-yellow-400"></div>
          Finals
        </div>

        {season === 2026 && (
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-sky-400"></div>
            Wildcard
          </div>
        )}
      </div>
    </div>
  );
}

export default function LiveScoresPage() {
  const [selectedSeason, setSelectedSeason] = useState<number>(DEFAULT_SEASON);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [allSeasonGames, setAllSeasonGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasUserSelectedRound, setHasUserSelectedRound] = useState(false);
  const [view, setView] = useState<"scores" | "ladder">("scores");
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setHasUserSelectedRound(false);
    setSelectedRound(null);
    setGames([]);
    setAllSeasonGames([]);
    setLoading(true);
  }, [selectedSeason]);

  useEffect(() => {
    let mounted = true;

    const fetchAllSeasonGames = async () => {
      try {
        const res = await fetch(
          `https://api.squiggle.com.au/?q=games;year=${selectedSeason}`,
          { cache: "no-store" }
        );

        const data = await res.json();

        if (!mounted) return;

        const seasonGames = Array.isArray(data.games) ? data.games : [];
        setAllSeasonGames(seasonGames);

        if (!hasUserSelectedRound) {
          const currentRound = getCurrentRound(seasonGames);
          setSelectedRound(currentRound);
        }
      } catch (error) {
        console.error("Failed to fetch season games:", error);
        if (mounted) {
          setAllSeasonGames([]);
          if (!hasUserSelectedRound) {
            setSelectedRound(0);
          }
        }
      }
    };

    fetchAllSeasonGames();
    const interval = setInterval(fetchAllSeasonGames, 60000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [selectedSeason, hasUserSelectedRound]);

  useEffect(() => {
    if (selectedRound === null) return;

    let mounted = true;

    const fetchGames = async () => {
      try {
        setLoading(true);

        const res = await fetch(
          `https://api.squiggle.com.au/?q=games;year=${selectedSeason};round=${selectedRound}`,
          { cache: "no-store" }
        );

        const data = await res.json();

        if (mounted) {
          setGames(Array.isArray(data.games) ? data.games : []);
        }
      } catch (error) {
        console.error("Failed to fetch live scores:", error);
        if (mounted) {
          setGames([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchGames();
    const interval = setInterval(fetchGames, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [selectedSeason, selectedRound]);

  const sortedGames = useMemo(() => sortGames(games), [games]);

  const teamRecords = useMemo(
    () => buildTeamRecords(allSeasonGames),
    [allSeasonGames]
  );

  const liveLadder = useMemo(
    () => buildLiveLadder(allSeasonGames),
    [allSeasonGames]
  );

  const availableRounds = useMemo(() => {
    const rounds = Array.from(
      new Set(
        allSeasonGames
          .map((game) => game.round)
          .filter((round): round is number => typeof round === "number")
      )
    );

    return rounds.sort((a, b) => a - b);
  }, [allSeasonGames]);

  return (
    <main className="min-h-screen bg-[#05070d] text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <div className="mb-8 rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_35%),linear-gradient(180deg,rgba(12,17,29,0.96)_0%,rgba(5,7,13,0.98)_100%)] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.4)] md:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                AFL Live Hub
              </div>
              <h1 className="text-4xl font-black uppercase tracking-[0.06em] text-white md:text-5xl">
                Live Scores
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60 md:text-base">
                Live footy scores across every Squiggle season.
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
              <button
                onClick={() => setView("scores")}
                className={[
                  "rounded-2xl border px-4 py-3 text-sm font-bold transition md:min-w-[120px]",
                  view === "scores"
                    ? "border-sky-400/50 bg-sky-400/15 text-sky-300 shadow-[0_0_0_1px_rgba(56,189,248,0.15)]"
                    : "border-white/10 bg-white/[0.04] text-white/70 hover:border-white/20 hover:bg-white/[0.06] hover:text-white",
                ].join(" ")}
              >
                Scores
              </button>

              <button
                onClick={() => setView("ladder")}
                className={[
                  "rounded-2xl border px-4 py-3 text-sm font-bold transition md:min-w-[120px]",
                  view === "ladder"
                    ? "border-sky-400/50 bg-sky-400/15 text-sky-300 shadow-[0_0_0_1px_rgba(56,189,248,0.15)]"
                    : "border-white/10 bg-white/[0.04] text-white/70 hover:border-white/20 hover:bg-white/[0.06] hover:text-white",
                ].join(" ")}
              >
                Ladder
              </button>

              <div className="relative">
                <select
                  value={selectedSeason}
                  onChange={(e) => setSelectedSeason(Number(e.target.value))}
                  className="w-full appearance-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 pr-10 text-sm font-bold text-white outline-none transition hover:border-white/20 md:min-w-[150px]"
                >
                  {SEASON_OPTIONS.map((season) => (
                    <option
                      key={season}
                      value={season}
                      className="bg-[#0b1020] text-white"
                    >
                      Season {season}
                    </option>
                  ))}
                </select>

                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-white/45">
                  ▼
                </div>
              </div>
            </div>
          </div>
        </div>

        {view === "scores" && (
          <>
            <div className="mb-6 rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(11,16,28,0.96)_0%,rgba(6,8,16,0.98)_100%)] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.3)] md:p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
                  Select Round
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/55">
                  Season {selectedSeason}
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {availableRounds.map((round) => {
                  const active = round === selectedRound;

                  return (
                    <button
                      key={round}
                      onClick={() => {
                        setHasUserSelectedRound(true);
                        setSelectedRound(round);
                      }}
                      className={[
                        "shrink-0 rounded-2xl border px-4 py-2.5 text-sm font-bold transition",
                        active
                          ? "border-sky-400/50 bg-sky-400/15 text-sky-300 shadow-[0_0_0_1px_rgba(56,189,248,0.15)]"
                          : "border-white/10 bg-white/[0.04] text-white/70 hover:border-white/20 hover:bg-white/[0.06] hover:text-white",
                      ].join(" ")}
                    >
                      Round {round}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedRound === null || loading ? (
              <div className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(11,16,28,0.96)_0%,rgba(6,8,16,0.98)_100%)] p-6 text-white/65 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                Loading scores...
              </div>
            ) : availableRounds.length === 0 ? (
              <div className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(11,16,28,0.96)_0%,rgba(6,8,16,0.98)_100%)] p-6 text-white/65 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                No rounds found for {selectedSeason}.
              </div>
            ) : sortedGames.length === 0 ? (
              <div className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(11,16,28,0.96)_0%,rgba(6,8,16,0.98)_100%)] p-6 text-white/65 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
                No games found for Round {selectedRound} in {selectedSeason}.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {sortedGames.map((game) => (
                  <ScoreCard
                    key={game.id}
                    game={game}
                    teamRecords={teamRecords}
                    nowMs={nowMs}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {view === "ladder" &&
          (allSeasonGames.length === 0 ? (
            <div className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(11,16,28,0.96)_0%,rgba(6,8,16,0.98)_100%)] p-6 text-white/65 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
              Loading ladder...
            </div>
          ) : (
            <LadderTable ladder={liveLadder} season={selectedSeason} />
          ))}
      </div>
    </main>
  );
}