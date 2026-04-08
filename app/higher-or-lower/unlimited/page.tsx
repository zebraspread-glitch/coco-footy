"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import players from "../../data/public/afl_players26.json";

type Player = {
  id: string;
  name: string;
  club: string;
  pos: string[];
  points: number;
};

type ClubStyle = {
  primary: string;
};

const CLUB_STYLES: Record<string, ClubStyle> = {
  adelaide: { primary: "#0C2340" },
  brisbane: { primary: "#7B1E3A" },
  carlton: { primary: "#031A29" },
  collingwood: { primary: "#111111" },
  essendon: { primary: "#111111" },
  fremantle: { primary: "#2B0A57" },
  geelong: { primary: "#0B1F3A" },
  gold_coast: { primary: "#A61E2D" },
  gws: { primary: "#232323" },
  hawthorn: { primary: "#4B2E1E" },
  melbourne: { primary: "#0C1F44" },
  north_melbourne: { primary: "#0B2D6B" },
  port_adelaide: { primary: "#111111" },
  richmond: { primary: "#111111" },
  st_kilda: { primary: "#111111" },
  sydney: { primary: "#B5121B" },
  west_coast: { primary: "#003087" },
  western_bulldogs: { primary: "#0B3A82" },
};

function normalizeClub(club: string) {
  return club.toLowerCase().replace(/[^a-z]/g, "");
}

function getClubKey(club: string) {
  const value = normalizeClub(club);

  if (value.includes("goldcoast") || value.includes("suns")) return "gold_coast";
  if (value.includes("greaterwesternsydney") || value === "gws" || value.includes("giants")) return "gws";
  if (value.includes("northmelbourne") || value.includes("kangaroos")) return "north_melbourne";
  if (value.includes("portadelaide")) return "port_adelaide";
  if (value.includes("stkilda") || value.includes("saints")) return "st_kilda";
  if (value.includes("westcoast") || value.includes("eagles")) return "west_coast";
  if (value.includes("westernbulldogs") || value.includes("bulldogs")) return "western_bulldogs";
  if (value.includes("adelaide")) return "adelaide";
  if (value.includes("brisbane")) return "brisbane";
  if (value.includes("carlton")) return "carlton";
  if (value.includes("collingwood")) return "collingwood";
  if (value.includes("essendon")) return "essendon";
  if (value.includes("fremantle")) return "fremantle";
  if (value.includes("geelong")) return "geelong";
  if (value.includes("hawthorn")) return "hawthorn";
  if (value.includes("melbourne") && !value.includes("north")) return "melbourne";
  if (value.includes("richmond")) return "richmond";
  if (value.includes("sydney") && !value.includes("gws")) return "sydney";

  return "adelaide";
}

function getLogoPath(club: string) {
  return `/team-icons/${getClubKey(club)}.png`;
}

function getClubStyle(club: string): ClubStyle {
  const key = getClubKey(club);
  return CLUB_STYLES[key] || { primary: "#111111" };
}

const ALL_PLAYERS = (players as Player[]).filter(
  (p) =>
    p &&
    typeof p.id === "string" &&
    typeof p.name === "string" &&
    typeof p.club === "string" &&
    typeof p.points === "number" &&
    !Number.isNaN(p.points) &&
    p.points > 0
);

function getRandomPlayer(excludeId?: string): Player {
  let player = ALL_PLAYERS[Math.floor(Math.random() * ALL_PLAYERS.length)];

  while (excludeId && player.id === excludeId) {
    player = ALL_PLAYERS[Math.floor(Math.random() * ALL_PLAYERS.length)];
  }

  return player;
}

function playerCardStyle(player: Player) {
  const club = getClubStyle(player.club);

  return {
    backgroundColor: club.primary,
    border: "1px solid rgba(255,255,255,0.12)",
    boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
  } as React.CSSProperties;
}

export default function HigherOrLowerUnlimitedPage() {
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [nextPlayer, setNextPlayer] = useState<Player | null>(null);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const savedBest = localStorage.getItem("higher_or_lower_best");
    if (savedBest) setBestStreak(Number(savedBest));

    const first = getRandomPlayer();
    const second = getRandomPlayer(first.id);

    setCurrentPlayer(first);
    setNextPlayer(second);
  }, []);

  const currentPoints = useMemo(() => currentPlayer?.points ?? 0, [currentPlayer]);
  const nextPoints = useMemo(() => nextPlayer?.points ?? 0, [nextPlayer]);

  function startNewRound(basePlayer?: Player) {
    const newCurrent = basePlayer ?? getRandomPlayer();
    const newNext = getRandomPlayer(newCurrent.id);

    setCurrentPlayer(newCurrent);
    setNextPlayer(newNext);
    setRevealed(false);
  }

  function handleGuess(direction: "higher" | "lower") {
    if (!currentPlayer || !nextPlayer || revealed || gameOver) return;

    const isCorrect =
      direction === "higher"
        ? nextPlayer.points >= currentPlayer.points
        : nextPlayer.points <= currentPlayer.points;

    setRevealed(true);

    setTimeout(() => {
      if (isCorrect) {
        const newStreak = streak + 1;
        setStreak(newStreak);

        if (newStreak > bestStreak) {
  setBestStreak(newStreak);

  localStorage.setItem("higher_or_lower_best", String(newStreak));

  // My Stats key
  localStorage.setItem(
    "coco_hol_unlimited_high_score",
    String(newStreak)
  );
}

        startNewRound(nextPlayer);
      } else {
        setGameOver(true);
      }
    }, 1000);
  }

  function restartGame() {
    setStreak(0);
    setGameOver(false);

    const first = getRandomPlayer();
    const second = getRandomPlayer(first.id);

    setCurrentPlayer(first);
    setNextPlayer(second);
    setRevealed(false);
  }

  if (!currentPlayer || !nextPlayer) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-white/70">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/higher-or-lower"
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            ← Back
          </Link>

          <div className="rounded-full border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-red-300">
            Unlimited
          </div>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black italic tracking-wide sm:text-5xl">
            HIGHER OR LOWER
          </h1>
          <p className="mt-3 text-sm text-white/60 sm:text-base">
            Guess whether the next player has higher or lower fantasy points.
          </p>
        </div>

        <div className="mb-8 flex items-center justify-center gap-4 sm:gap-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-center">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">
              Streak
            </div>
            <div className="mt-1 text-2xl font-black">{streak}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-center">
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">
              Best
            </div>
            <div className="mt-1 text-2xl font-black">{bestStreak}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div
            className="relative min-h-[260px] overflow-hidden rounded-[28px] p-6"
            style={playerCardStyle(currentPlayer)}
          >
            <img
              src={getLogoPath(currentPlayer.club)}
              alt={`${currentPlayer.club} logo`}
              className="pointer-events-none absolute bottom-4 right-4 h-28 w-28 object-contain opacity-100"
              draggable={false}
            />

            <div className="relative z-10">
              <p className="text-lg text-white/80">{currentPlayer.club}</p>
              <h2 className="mt-2 text-3xl font-black italic text-white sm:text-4xl">
                {currentPlayer.name}
              </h2>

              <div className="mt-10 text-6xl font-black leading-none sm:text-7xl">
                {currentPoints.toFixed(1)}
              </div>
            </div>
          </div>

          <div
            className="relative min-h-[260px] overflow-hidden rounded-[28px] p-6"
            style={playerCardStyle(nextPlayer)}
          >
            <img
              src={getLogoPath(nextPlayer.club)}
              alt={`${nextPlayer.club} logo`}
              className="pointer-events-none absolute bottom-4 right-4 h-28 w-28 object-contain opacity-100"
              draggable={false}
            />

            <div className="relative z-10">
              <p className="text-lg text-white/80">{nextPlayer.club}</p>
              <h2 className="mt-2 text-3xl font-black italic text-white sm:text-4xl">
                {nextPlayer.name}
              </h2>

              <div className="mt-10 text-6xl font-black leading-none sm:text-7xl">
                {revealed ? nextPoints.toFixed(1) : "?"}
              </div>
            </div>
          </div>
        </div>

        {!gameOver ? (
          <div className="mt-10 flex justify-center gap-4">
            <button
              onClick={() => handleGuess("lower")}
              disabled={revealed}
              className="rounded-2xl bg-blue-600 px-8 py-4 font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              LOWER
            </button>

            <button
              onClick={() => handleGuess("higher")}
              disabled={revealed}
              className="rounded-2xl bg-red-600 px-8 py-4 font-black text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              HIGHER
            </button>
          </div>
        ) : (
          <div className="mt-10 rounded-[28px] border border-white/10 bg-white/5 p-8 text-center">
            <div className="text-3xl font-black italic text-white">Game Over</div>
            <p className="mt-3 text-white/65">Final streak: {streak}</p>

            <div className="mt-6 flex justify-center">
              <button
                onClick={restartGame}
                className="rounded-2xl bg-white px-6 py-3 text-sm font-black uppercase tracking-wide text-black transition hover:opacity-90"
              >
                Play Again
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}