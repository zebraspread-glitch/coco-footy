"use client";

import React, { useEffect, useMemo, useState } from "react";
import numbersData from "../data/public/afl_player_numbers.json";

type PlayerNumber = {
  id: string;
  name: string;
  club: string;
  number: number;
};

type ClubColors = { primary: string; secondary: string };

// AFL club colors (primary/secondary). These are commonly used club colors.
// If any club name in your JSON doesn't match exactly, add an alias in CLUB_ALIASES below.
const CLUB_COLORS: Record<string, ClubColors> = {
  Adelaide: { primary: "#002B5C", secondary: "#C8102E" },
  Brisbane: { primary: "#6A0032", secondary: "#F9B233" },
  Carlton: { primary: "#0B2A5B", secondary: "#FFFFFF" },
  Collingwood: { primary: "#000000", secondary: "#FFFFFF" },
  Essendon: { primary: "#000000", secondary: "#CC2031" },
  Fremantle: { primary: "#2B003A", secondary: "#FFFFFF" },
  Geelong: { primary: "#0E4B3B", secondary: "#FFFFFF" },
  "Gold Coast": { primary: "#C8102E", secondary: "#F9B233" },
  GWS: { primary: "#F47920", secondary: "#1C1C1C" },
  Hawthorn: { primary: "#4B2E1E", secondary: "#F9B233" },
  Melbourne: { primary: "#0F1131", secondary: "#CC2031" },
  "North Melbourne": { primary: "#0B2A5B", secondary: "#FFFFFF" },
  "Port Adelaide": { primary: "#000000", secondary: "#00AEEF" },
  Richmond: { primary: "#000000", secondary: "#F9B233" },
  "St Kilda": { primary: "#000000", secondary: "#CC2031" },
  Sydney: { primary: "#CC2031", secondary: "#FFFFFF" },
  "West Coast": { primary: "#002B5C", secondary: "#F9B233" },
  "Western Bulldogs": { primary: "#0B2A5B", secondary: "#C8102E" },
};

const CLUB_ALIASES: Record<string, keyof typeof CLUB_COLORS> = {
  "Greater Western Sydney": "GWS",
  "GWS Giants": "GWS",
  "Gold Coast Suns": "Gold Coast",
  "Brisbane Lions": "Brisbane",
  "Sydney Swans": "Sydney",
  "Port": "Port Adelaide",
  "Kangaroos": "North Melbourne",
  "North": "North Melbourne",
  "Bulldogs": "Western Bulldogs",
  "West Coast Eagles": "West Coast",
  "Adelaide Crows": "Adelaide",
  "Geelong Cats": "Geelong",
  "St. Kilda": "St Kilda",
};

const FALLBACK_COLORS: ClubColors = { primary: "#111827", secondary: "#FFFFFF" };

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function todayKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function buildOptions(correct: number, pool: number[], count = 4) {
  const others = pool.filter((n) => n !== correct);
  const picks = shuffle(others).slice(0, count - 1);
  return shuffle([correct, ...picks]);
}

export default function StreakPage() {
  const players: PlayerNumber[] = (numbersData as PlayerNumber[]).filter(
    (p) =>
      typeof p?.name === "string" &&
      typeof p?.club === "string" &&
      typeof p?.number === "number" &&
      Number.isFinite(p.number)
  );

  const numberPool = useMemo(
    () => Array.from(new Set(players.map((p) => p.number))),
    [players]
  );

  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);

  const [current, setCurrent] = useState<PlayerNumber | null>(null);
  const [options, setOptions] = useState<number[]>([]);
  const [locked, setLocked] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);

  // Hint system (2 per run). Using hint hides 2 incorrect options (50/50).
  const [hintsLeft, setHintsLeft] = useState(2);
  const [hiddenOptions, setHiddenOptions] = useState<Set<number>>(new Set());

  useEffect(() => {
    const key = `coco_streak_best_${todayKey()}`;
    const saved = Number(localStorage.getItem(key) ?? "0");
    if (Number.isFinite(saved)) setBest(saved);
  }, []);

  function saveBest(nextBest: number) {
  const dailyKey = `coco_streak_best_${todayKey()}`;
  localStorage.setItem(dailyKey, String(nextBest));
  setBest(nextBest);

  // ✅ NEW: save all-time highest streak
  const allTimeKey = "coco_streak_highest";
  const currentAllTime = Number(localStorage.getItem(allTimeKey) ?? "0");

  if (nextBest > currentAllTime) {
    localStorage.setItem(allTimeKey, String(nextBest));
  }
}

  function normalizeClub(club?: string | null) {
    if (!club) return "";
    const trimmed = club.trim();
    return CLUB_ALIASES[trimmed] ?? trimmed;
  }

  function getColors(club?: string | null): ClubColors {
    const key = normalizeClub(club) as keyof typeof CLUB_COLORS;
    return CLUB_COLORS[key] ?? FALLBACK_COLORS;
  }

  function nextRound(nextStreak: number) {
    if (players.length < 4 || numberPool.length < 4) return;

    const p = players[Math.floor(Math.random() * players.length)];
    const nextOptions = buildOptions(p.number, numberPool, 4);

    setCurrent(p);
    setOptions(nextOptions);

    setStreak(nextStreak);
    setPicked(null);
    setLocked(false);
    setGameOver(false);

    // Reset per-turn hint hiding
    setHiddenOptions(new Set());
  }

  useEffect(() => {
    if (players.length >= 4 && numberPool.length >= 4) {
      nextRound(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players.length, numberPool.length]);

  function onPick(n: number) {
    if (!current || locked) return;

    setLocked(true);
    setPicked(n);

    if (n === current.number) {
      const next = streak + 1;
      setTimeout(() => nextRound(next), 450);
    } else {
      setGameOver(true);
      saveBest(Math.max(best, streak));
    }
  }

  function resetGame() {
    setHintsLeft(2);
    setHiddenOptions(new Set());
    nextRound(0);
  }

  function useHint() {
    if (!current || locked || gameOver) return;
    if (hintsLeft <= 0) return;

    // Already used hint this turn
    if (hiddenOptions.size > 0) return;

    const correct = current.number;
    const incorrect = options.filter((n) => n !== correct);

    // Hide 2 incorrect options
    const toHide = shuffle(incorrect).slice(0, 2);
    setHiddenOptions(new Set(toHide));
    setHintsLeft((h) => Math.max(0, h - 1));
  }

  if (players.length < 4 || numberPool.length < 4) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center bg-black px-6">
        <div className="max-w-xl w-full rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
          <div className="text-2xl font-black">Player Number Streak</div>
          <div className="mt-2 text-white/70">
            You need at least <b>4 players</b> with valid numbers in:
          </div>
          <div className="mt-2 text-white/80 font-mono text-sm">
            app/data/public/afl_player_numbers.json
          </div>
          <div className="mt-3 text-white/60 text-sm">
            Make sure there’s <b>no trailing comma</b> after the last item.
          </div>
          <a
            href="/"
            className="inline-block mt-5 rounded-full bg-blue-500 text-black font-extrabold px-6 py-3 hover:opacity-90 transition"
          >
            Back Home
          </a>
        </div>
      </div>
    );
  }

  const colors = getColors(current?.club);
  const cardBg = `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`;
  const optionBg = `linear-gradient(135deg, ${colors.primary}, rgba(0,0,0,0.25))`;

  return (
    <div
      className="min-h-screen text-white bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/coco-footy-bg.png')" }}
    >
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-black/55 via-black/25 to-black/70" />

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Top bar */}
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <a
            href="/"
            className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 transition"
          >
            ← Back
          </a>

<div className="flex flex-wrap items-center gap-2 justify-center sm:justify-end">
            <button
              onClick={useHint}
              disabled={!current || locked || gameOver || hintsLeft <= 0 || hiddenOptions.size > 0}
              className={`rounded-full px-4 py-2 text-sm font-extrabold border transition ${
                !current || locked || gameOver || hintsLeft <= 0 || hiddenOptions.size > 0
                  ? "bg-white/5 text-white/40 border-white/10 cursor-not-allowed"
                  : "bg-white/10 text-white border-white/20 hover:bg-white/15"
              }`}
              title="Use a hint to remove two wrong options (50/50)"
            >
              Hint (50/50) • {hintsLeft} left
            </button>

            <div className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm">
              Streak: <span className="font-extrabold">{streak}</span>
            </div>
            <div className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm">
              Best (Today): <span className="font-extrabold">{best}</span>
            </div>
          </div>
        </div>

        {/* MAIN CARD - bigger, fills more screen */}
        <div
          className="mt-10 rounded-3xl border border-white/10 p-10 md:p-14 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
          style={{ background: cardBg }}
        >
          <div className="text-center">
            <div className="text-white/85 text-sm md:text-base font-semibold tracking-[0.25em]">
              PLAYER NUMBER STREAK
            </div>

            <div
              className="mt-5 text-4xl md:text-6xl font-black"
              style={{ color: colors.secondary }}
            >
              {current?.name}
            </div>

            <div className="mt-3 text-white/90 text-lg md:text-xl">
              {current?.club}
            </div>

            {/* Options */}
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 max-w-4xl mx-auto">
              {options.map((n) => {
                const isPicked = picked === n;
                const isCorrect = current ? n === current.number : false;

                const isHidden = hiddenOptions.has(n) && !locked && !gameOver;

                const base =
                  "rounded-2xl border px-6 py-6 md:px-8 md:py-7 text-xl md:text-2xl font-extrabold transition";
                const idle = "border-white/25 hover:border-white/40";
                const correct = "border-green-400/70";
                const wrong = "border-red-400/70";
                const faded = "opacity-60";

                let style: React.CSSProperties = { background: optionBg };
                let cls = `${base} ${idle}`;

                if (isHidden) {
                  cls = `${base} border-white/10 opacity-30 cursor-not-allowed`;
                  style = { background: "rgba(255,255,255,0.10)" };
                }

                if (locked) {
                  if (isPicked) {
                    cls = `${base} ${isCorrect ? correct : wrong}`;
                    style = {
                      background: isCorrect
                        ? "linear-gradient(135deg, rgba(34,197,94,0.75), rgba(0,0,0,0.25))"
                        : "linear-gradient(135deg, rgba(239,68,68,0.75), rgba(0,0,0,0.25))",
                    };
                  } else {
                    cls = `${base} border-white/10 ${faded}`;
                    style = { background: "rgba(255,255,255,0.10)" };
                  }
                }

                return (
                  <button
                    key={n}
                    onClick={() => onPick(n)}
                    disabled={locked || isHidden}
                    className={cls}
                    style={style}
                  >
                    #{n}
                  </button>
                );
              })}
            </div>

            {/* Game over */}
            {gameOver ? (
              <div className="mt-10">
                <div className="text-2xl md:text-3xl font-black">Game Over</div>
                <div className="text-white/90 mt-2 text-lg">
                  Correct answer was{" "}
                  <span className="font-extrabold">#{current?.number}</span>
                </div>

                <button
                  onClick={resetGame}
                  className="mt-6 rounded-full bg-blue-500 text-black font-extrabold px-8 py-4 hover:opacity-90 transition text-lg"
                >
                  Play Again
                </button>
              </div>
            ) : (
              <div className="mt-8 text-white/85 text-sm md:text-base">
                Pick the correct jumper number. One mistake ends your streak.
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-white/35">
          COCO FOOTY • Streak Mode
        </div>
      </div>
    </div>
  );
}
