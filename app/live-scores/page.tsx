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

const SEASON = 2026;
const ROUNDS = Array.from({ length: 25 }, (_, i) => i);

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

function ScoreCard({
  game,
  teamRecords,
}: {
  game: Game;
  teamRecords: Record<string, TeamRecord>;
}) {
  const isLive = game.complete > 0 && game.complete < 100;
  const isFinal = game.complete === 100;
  const isUpcoming = game.complete === 0;

  const homeLeading = game.hscore > game.ascore;
  const awayLeading = game.ascore > game.hscore;
  const isDraw = game.hscore === game.ascore;

  const borderClass = isLive
    ? "border-green-500 shadow-[0_0_0_1px_rgba(34,197,94,0.45)]"
    : isFinal
    ? "border-violet-500 shadow-[0_0_0_1px_rgba(139,92,246,0.45)]"
    : "border-white/10";

  const winningScoreClass = "text-blue-400";
  const normalScoreClass = "text-white";
  const losingScoreClass = "text-white/40";

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

  return (
    <div
      className={[
        "rounded-2xl border p-4",
        "bg-[#0a0a0f]/95 backdrop-blur-sm",
        borderClass,
      ].join(" ")}
    >
      <div className="mb-3 flex justify-between text-sm text-white/60">
        <span>{isLive ? "LIVE" : isFinal ? "FINAL" : "UPCOMING"}</span>
        <span>{game.timestr || formatGameTime(game.date)}</span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {getTeamIcon(game.hteam) && (
            <img
              src={getTeamIcon(game.hteam)!}
              alt={game.hteam}
              className="h-10 w-10 shrink-0 object-contain"
            />
          )}

          <div className="min-w-0">
            <div className="truncate text-sm text-white/70">{game.hteam}</div>
            <div className={`text-3xl font-extrabold ${homeScoreClass}`}>
              {isUpcoming
                ? formatTeamRecord(game.hteam, teamRecords)
                : game.hscore}
            </div>
          </div>
        </div>

        {!isUpcoming && (
          <div className="shrink-0 text-xs text-white/40">
            {game.hgoals ?? 0}.{game.hbehinds ?? 0}
          </div>
        )}
      </div>

      <div className="my-2 h-px bg-white/10" />

      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {getTeamIcon(game.ateam) && (
            <img
              src={getTeamIcon(game.ateam)!}
              alt={game.ateam}
              className="h-10 w-10 shrink-0 object-contain"
            />
          )}

          <div className="min-w-0">
            <div className="truncate text-sm text-white/70">{game.ateam}</div>
            <div className={`text-3xl font-extrabold ${awayScoreClass}`}>
              {isUpcoming
                ? formatTeamRecord(game.ateam, teamRecords)
                : game.ascore}
            </div>
          </div>
        </div>

        {!isUpcoming && (
          <div className="shrink-0 text-xs text-white/40">
            {game.agoals ?? 0}.{game.abehinds ?? 0}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LiveScoresPage() {
  const [selectedRound, setSelectedRound] = useState<number>(0);
  const [games, setGames] = useState<Game[]>([]);
  const [allSeasonGames, setAllSeasonGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchAllSeasonGames = async () => {
      try {
        const res = await fetch(
          `https://api.squiggle.com.au/?q=games;year=${SEASON}`,
          { cache: "no-store" }
        );

        const data = await res.json();

        if (mounted) {
          setAllSeasonGames(Array.isArray(data.games) ? data.games : []);
        }
      } catch (error) {
        console.error("Failed to fetch season games:", error);
        if (mounted) {
          setAllSeasonGames([]);
        }
      }
    };

    fetchAllSeasonGames();
    const interval = setInterval(fetchAllSeasonGames, 60000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchGames = async () => {
      try {
        setLoading(true);

        const res = await fetch(
          `https://api.squiggle.com.au/?q=games;year=${SEASON};round=${selectedRound}`,
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
  }, [selectedRound]);

  const sortedGames = useMemo(() => sortGames(games), [games]);
  const teamRecords = useMemo(
    () => buildTeamRecords(allSeasonGames),
    [allSeasonGames]
  );

  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white md:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <h1 className="text-3xl font-black uppercase tracking-wide md:text-4xl">
            Live Scores
          </h1>
          <p className="mt-2 text-sm text-white/55">
            Live AFL scores, fixtures, and results.
          </p>
        </div>

        <div className="mb-6">
          <div className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-white/45">
            Select Round
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {ROUNDS.map((round) => {
              const active = round === selectedRound;

              return (
                <button
                  key={round}
                  onClick={() => setSelectedRound(round)}
                  className={[
                    "shrink-0 rounded-xl border px-3 py-2 text-sm font-bold transition",
                    active
                      ? "border-blue-500 bg-blue-500/15 text-blue-300"
                      : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:bg-white/10 hover:text-white",
                  ].join(" ")}
                >
                  Round {round}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-[#0a0a0f] p-5 text-white/65">
            Loading scores...
          </div>
        ) : sortedGames.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#0a0a0f] p-5 text-white/65">
            No games found for Round {selectedRound}.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {sortedGames.map((game) => (
              <ScoreCard key={game.id} game={game} teamRecords={teamRecords} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}