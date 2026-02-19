"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Search, X, Home, ArrowLeft } from "lucide-react";

/** ================= Types ================= */
type Seed = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
type Ladder = Record<Seed, string>;

type MatchId =
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

type State = {
  submitted: boolean;
  ladder: Ladder;
  winners: Partial<Record<MatchId, "A" | "B">>;
};

const LS_KEY = "coco_finals_predictor_bracket_v5";

const SEEDS: Seed[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/** ================= Teams ================= */
const TEAM_OPTIONS = [
  "Crows",
  "Lions",
  "Blues",
  "Magpies",
  "Bombers",
  "Dockers",
  "Cats",
  "Suns",
  "Giants",
  "Hawks",
  "Demons",
  "Kangaroos",
  "Power",
  "Tigers",
  "Saints",
  "Swans",
  "Eagles",
  "Bulldogs",
] as const;

type TeamName = (typeof TEAM_OPTIONS)[number];

const TEAM_COLOURS: Record<TeamName, { bg: string; text: string }> = {
  Crows: { bg: "#002B5C", text: "#E41E2B" },
  Lions: { bg: "#7C003E", text: "#FFD200" },
  Blues: { bg: "#001B4D", text: "#FFFFFF" },
  Magpies: { bg: "#000000", text: "#FFFFFF" },
  Bombers: { bg: "#C8102E", text: "#FFFFFF" },
  Dockers: { bg: "#2B0A3D", text: "#FFFFFF" },
  Cats: { bg: "#0F2A4A", text: "#FFFFFF" },
  Suns: { bg: "#B30000", text: "#FFD200" },
  Giants: { bg: "#F15A22", text: "#111111" },
  Hawks: { bg: "#4B2E1E", text: "#F7B500" },
  Demons: { bg: "#0A2A5E", text: "#FFFFFF" },
  Kangaroos: { bg: "#003A70", text: "#FFFFFF" },
  Power: { bg: "#00A1DE", text: "#111111" },
  Tigers: { bg: "#F7B500", text: "#111111" },
  Saints: { bg: "#C8102E", text: "#FFFFFF" },
  Swans: { bg: "#E41E2B", text: "#FFFFFF" },
  Eagles: { bg: "#002B5C", text: "#FFD200" },
  Bulldogs: { bg: "#0047AB", text: "#FFFFFF" },
};

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function safeLoad(): State | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as State;
  } catch {
    return null;
  }
}

function safeSave(s: State) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_KEY, JSON.stringify(s));
}

function allFilled(ladder: Ladder) {
  return SEEDS.every((s) => ladder[s].trim().length > 0);
}

function allUnique(ladder: Ladder) {
  const vals = SEEDS.map((s) => normalize(ladder[s])).filter(Boolean);
  return new Set(vals).size === vals.length;
}

/** subtle tint for half-panels */
function tint(hex: string, alpha = 0.62) {
  return `color-mix(in srgb, ${hex} ${Math.round(alpha * 100)}%, rgba(0,0,0,0))`;
}

/** ================= Team Picker Modal ================= */
function TeamPickerModal({
  open,
  onClose,
  options,
  onPick,
  title,
}: {
  open: boolean;
  onClose: () => void;
  options: string[];
  onPick: (team: string) => void;
  title: string;
}) {
  const [q, setQ] = useState("");

  useEffect(() => {
    if (open) setQ("");
  }, [open]);

  const filtered = useMemo(() => {
    const query = normalize(q);
    if (!query) return options;
    return options.filter((t) => normalize(t).includes(query));
  }, [q, options]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      <div className="relative w-full max-w-xl rounded-2xl border border-white/10 bg-[#0b0b0b]/95 backdrop-blur p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs tracking-[0.25em] font-extrabold text-white/60">
              SELECT TEAM
            </div>
            <div className="text-xl font-black italic text-white">{title}</div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 p-2 hover:bg-white/10 transition"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-white/70" />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
          <Search className="h-4 w-4 text-white/50" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search team..."
            className="w-full bg-transparent outline-none text-sm text-white/90 placeholder:text-white/40"
            autoFocus
          />
        </div>

        <div className="mt-4 max-h-[360px] overflow-auto space-y-2 pr-1">
          {filtered.length === 0 ? (
            <div className="text-sm text-white/50 py-6 text-center">No teams found.</div>
          ) : (
            filtered.map((t) => {
              const key = t as TeamName;
              const meta = TEAM_COLOURS[key];
              return (
                <button
                  key={t}
                  onClick={() => onPick(t)}
                  className="w-full text-left rounded-xl border border-white/10 px-4 py-3 hover:brightness-110 transition"
                  style={{ backgroundColor: meta.bg, color: meta.text }}
                >
                  <div className="font-extrabold">{t}</div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

/** ================= Bracket Card ================= */
function BracketCard({
  id,
  aName,
  bName,
  winner,
  onPick,
  widthClass = "w-[240px]",
}: {
  id: MatchId;
  aName?: string;
  bName?: string;
  winner?: "A" | "B";
  onPick: (id: MatchId, w: "A" | "B") => void;
  widthClass?: string;
}) {
  const aPicked = winner === "A";
  const bPicked = winner === "B";
  const aElim = winner === "B";
  const bElim = winner === "A";

  const aMeta = aName ? TEAM_COLOURS[aName as TeamName] : null;
  const bMeta = bName ? TEAM_COLOURS[bName as TeamName] : null;

  // ✅ FIX: only allow picking when BOTH teams exist
  const canPick = Boolean(aName) && Boolean(bName);

  return (
    <div className="relative">
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
        <div className="px-4 py-1 rounded-md bg-sky-300 text-sky-900 text-xs font-extrabold tracking-widest shadow">
          {id}
        </div>
      </div>

      <div
        className={`relative h-[72px] ${widthClass} rounded-xl border border-black/20 bg-[#4b4b4b]
        shadow-[0_6px_18px_rgba(0,0,0,0.25)] overflow-hidden`}
      >
        <div className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-black/25" />

        <button
          onClick={() => canPick && onPick(id, "A")}
          disabled={!canPick}
          className={`absolute inset-y-0 left-0 w-1/2 px-3 flex items-center justify-center text-center transition ${
            !canPick ? "opacity-50 cursor-not-allowed" : "hover:brightness-110"
          }`}
          style={{
            background: aName
              ? `radial-gradient(circle at 30% 40%, rgba(255,255,255,0.22), transparent 55%), ${tint(
                  aMeta!.bg,
                  0.62
                )}`
              : "radial-gradient(circle at 30% 40%, rgba(255,255,255,0.18), transparent 55%), rgba(120,120,120,0.6)",
            filter: aElim ? "grayscale(1)" : undefined,
            opacity: aElim ? 0.38 : undefined,
          }}
          title={canPick && aName ? `Pick ${aName}` : "TBD"}
        >
          <span
            className="font-black italic tracking-wide text-sm drop-shadow"
            style={{
              color: aName ? aMeta!.text : "rgba(255,255,255,0.65)",
              opacity: aPicked ? 1 : 0.92,
            }}
          >
            {aName ?? ""}
          </span>
        </button>

        <button
          onClick={() => canPick && onPick(id, "B")}
          disabled={!canPick}
          className={`absolute inset-y-0 right-0 w-1/2 px-3 flex items-center justify-center text-center transition ${
            !canPick ? "opacity-50 cursor-not-allowed" : "hover:brightness-110"
          }`}
          style={{
            background: bName
              ? `radial-gradient(circle at 70% 40%, rgba(255,255,255,0.22), transparent 55%), ${tint(
                  bMeta!.bg,
                  0.62
                )}`
              : "radial-gradient(circle at 70% 40%, rgba(255,255,255,0.18), transparent 55%), rgba(120,120,120,0.6)",
            filter: bElim ? "grayscale(1)" : undefined,
            opacity: bElim ? 0.38 : undefined,
          }}
          title={canPick && bName ? `Pick ${bName}` : "TBD"}
        >
          <span
            className="font-black italic tracking-wide text-sm drop-shadow"
            style={{
              color: bName ? bMeta!.text : "rgba(255,255,255,0.65)",
              opacity: bPicked ? 1 : 0.92,
            }}
          >
            {bName ?? ""}
          </span>
        </button>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="h-8 w-8 rounded-full bg-[#3a3a3a] border border-black/30 flex items-center justify-center shadow">
            <span className="text-white font-extrabold">V</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** ================= Page ================= */
export default function FinalsPredictorPage() {
  const loaded = useMemo(() => safeLoad(), []);

  const [submitted, setSubmitted] = useState<boolean>(loaded?.submitted ?? false);
  const [ladder, setLadder] = useState<Ladder>(
    loaded?.ladder ??
      ({
        1: "",
        2: "",
        3: "",
        4: "",
        5: "",
        6: "",
        7: "",
        8: "",
        9: "",
        10: "",
      } as Ladder)
  );

  const [winners, setWinners] = useState<Partial<Record<MatchId, "A" | "B">>>(
    loaded?.winners ?? {}
  );

  function clearLadder() {
    setLadder({
      1: "",
      2: "",
      3: "",
      4: "",
      5: "",
      6: "",
      7: "",
      8: "",
      9: "",
      10: "",
    });
    setSubmitted(false);
    setWinners({});
  }

  // simple swap-drag
  const [dragFrom, setDragFrom] = useState<Seed | null>(null);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSeed, setPickerSeed] = useState<Seed>(1);

  useEffect(() => {
    safeSave({ submitted, ladder, winners });
  }, [submitted, ladder, winners]);

  const canSubmit = useMemo(() => allFilled(ladder) && allUnique(ladder), [ladder]);

  const availableTeamsForSeed = useMemo(() => {
    const taken = new Set(
      SEEDS.filter((s) => s !== pickerSeed)
        .map((s) => ladder[s])
        .filter(Boolean)
        .map(normalize)
    );
    return TEAM_OPTIONS.filter((t) => !taken.has(normalize(t)));
  }, [ladder, pickerSeed]);

  const nameOfSeed = (seed?: Seed) => (seed ? ladder[seed]?.trim() || undefined : undefined);

  /** ========= Correct AFL Final Ten Logic ========= */

  // Week 1: Wildcards
  const WC1 = winners.WC1;
  const WC2 = winners.WC2;

  const wc1A = 7 as Seed;
  const wc1B = 10 as Seed;
  const wc2A = 8 as Seed;
  const wc2B = 9 as Seed;

  const wc1WinnerSeed: Seed | undefined =
    WC1 === "A" ? wc1A : WC1 === "B" ? wc1B : undefined;
  const wc2WinnerSeed: Seed | undefined =
    WC2 === "A" ? wc2A : WC2 === "B" ? wc2B : undefined;

  const wcWinners = [wc1WinnerSeed, wc2WinnerSeed].filter(Boolean) as Seed[];
  const higherWC: Seed | undefined =
    wcWinners.length === 2 ? (Math.min(...wcWinners) as Seed) : undefined;
  const lowerWC: Seed | undefined =
    wcWinners.length === 2 ? (Math.max(...wcWinners) as Seed) : undefined;

  // Week 2: Qualifying
  const QF1 = winners.QF1;
  const QF2 = winners.QF2;

  const qf1A = 1 as Seed;
  const qf1B = 4 as Seed;
  const qf2A = 2 as Seed;
  const qf2B = 3 as Seed;

  const qf1WinnerSeed: Seed | undefined =
    QF1 === "A" ? qf1A : QF1 === "B" ? qf1B : undefined;
  const qf2WinnerSeed: Seed | undefined =
    QF2 === "A" ? qf2A : QF2 === "B" ? qf2B : undefined;

  const qf1LoserSeed: Seed | undefined =
    QF1 === "A" ? qf1B : QF1 === "B" ? qf1A : undefined;
  const qf2LoserSeed: Seed | undefined =
    QF2 === "A" ? qf2B : QF2 === "B" ? qf2A : undefined;

  // Week 2: Eliminations (need WC winners)
  const EF1 = winners.EF1;
  const EF2 = winners.EF2;

  const ef1A = 5 as Seed;
  const ef1B = lowerWC;
  const ef2A = 6 as Seed;
  const ef2B = higherWC;

  const ef1WinnerSeed: Seed | undefined =
    EF1 === "A" ? ef1A : EF1 === "B" ? ef1B : undefined;
  const ef2WinnerSeed: Seed | undefined =
    EF2 === "A" ? ef2A : EF2 === "B" ? ef2B : undefined;

  // Week 3: Semis
  const SF1 = winners.SF1;
  const SF2 = winners.SF2;

  const sf1A = qf1LoserSeed;
  const sf1B = ef1WinnerSeed;
  const sf2A = qf2LoserSeed;
  const sf2B = ef2WinnerSeed;

  const sf1WinnerSeed: Seed | undefined =
    SF1 === "A" ? sf1A : SF1 === "B" ? sf1B : undefined;
  const sf2WinnerSeed: Seed | undefined =
    SF2 === "A" ? sf2A : SF2 === "B" ? sf2B : undefined;

  // Week 4: Prelims (CROSSOVER)
  const PF1 = winners.PF1;
  const PF2 = winners.PF2;

  const pf1A = qf1WinnerSeed;
  const pf1B = sf2WinnerSeed;
  const pf2A = qf2WinnerSeed;
  const pf2B = sf1WinnerSeed;

  const pf1WinnerSeed: Seed | undefined =
    PF1 === "A" ? pf1A : PF1 === "B" ? pf1B : undefined;
  const pf2WinnerSeed: Seed | undefined =
    PF2 === "A" ? pf2A : PF2 === "B" ? pf2B : undefined;

  // Week 5: GF
  const gfA = pf1WinnerSeed;
  const gfB = pf2WinnerSeed;

  function pickWinner(id: MatchId, w: "A" | "B") {
    setWinners((prev) => {
      const next = { ...prev, [id]: w };

      // wipe downstream so bracket stays consistent
      const wipe: MatchId[] = [];
      if (id === "WC1" || id === "WC2") wipe.push("EF1", "EF2", "SF1", "SF2", "PF1", "PF2", "GF");
      if (id === "EF1" || id === "EF2") wipe.push("SF1", "SF2", "PF1", "PF2", "GF");
      if (id === "QF1" || id === "QF2") wipe.push("SF1", "SF2", "PF1", "PF2", "GF");
      if (id === "SF1" || id === "SF2") wipe.push("PF1", "PF2", "GF");
      if (id === "PF1" || id === "PF2") wipe.push("GF");

      for (const k of wipe) if (k !== id) delete next[k];
      return next;
    });
  }

  function backToLadder() {
    setSubmitted(false);
    setWinners({});
  }

  function swapSeeds(a: Seed, b: Seed) {
    setLadder((prev) => {
      const next = { ...prev };
      const tmp = next[a];
      next[a] = next[b];
      next[b] = tmp;
      return next;
    });
  }

  const GF = winners.GF;
  const premiers = GF
    ? GF === "A"
      ? nameOfSeed(gfA)
      : nameOfSeed(gfB)
    : undefined;

  return (
    <div className="min-h-screen bg-white">
      <TeamPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        options={availableTeamsForSeed.slice()}
        onPick={(team) => {
          setLadder((prev) => ({ ...prev, [pickerSeed]: team }));
          setPickerOpen(false);
        }}
        title={`Ladder #${pickerSeed}`}
      />

      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-black/10 bg-white/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="font-extrabold tracking-widest text-black">
            FINALS <span className="text-sky-600">PREDICTOR</span>
          </div>

          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-black/5 px-4 py-2 text-sm font-extrabold tracking-wide hover:bg-black/10 transition"
          >
            <Home className="h-4 w-4" />
            HOME
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* LADDER */}
        {!submitted && (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-6">
              <div className="text-4xl font-black tracking-tight">LADDER 1–10</div>
              <div className="text-sm text-black/60 mt-2">
                Click to select a team. Drag rows to swap positions.
              </div>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow">
              <div className="space-y-3">
                {SEEDS.map((seed) => {
                  const team = ladder[seed];
                  const meta = team ? TEAM_COLOURS[team as TeamName] : null;

                  return (
                    <div
                      key={seed}
                      draggable={Boolean(team)}
                      onDragStart={() => setDragFrom(seed)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (!dragFrom) return;
                        if (dragFrom === seed) return;
                        swapSeeds(dragFrom, seed);
                        setDragFrom(null);
                      }}
                      onDragEnd={() => setDragFrom(null)}
                      className={`flex items-center gap-4 rounded-lg ${dragFrom === seed ? "opacity-70" : ""}`}
                      title={team ? "Drag to swap with another position" : "Pick a team first"}
                    >
                      <div className="w-16 shrink-0 rounded-md bg-blue-600 text-white font-extrabold text-center py-2">
                        #{seed}
                      </div>

                      <button
                        onClick={() => {
                          setPickerSeed(seed);
                          setPickerOpen(true);
                        }}
                        className="flex-1 rounded-md border border-black/20 bg-black text-white h-14 px-5 text-left font-extrabold tracking-wide hover:opacity-90 transition"
                        style={meta ? { backgroundColor: meta.bg, color: meta.text } : undefined}
                      >
                        {team ? team : "+ Select Team"}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-4 mt-6">
                <button
                  onClick={clearLadder}
                  className="px-5 py-2 rounded-lg border border-red-500/40 text-red-500 font-bold hover:bg-red-500/10 transition"
                >
                  CLEAR
                </button>

                <button
                  disabled={!canSubmit}
                  onClick={() => setSubmitted(true)}
                  className={`px-6 py-2 rounded-lg font-bold transition ${
                    canSubmit
                      ? "bg-black text-white hover:opacity-90"
                      : "bg-black/20 text-black/40 cursor-not-allowed"
                  }`}
                >
                  SUBMIT
                </button>
              </div>

              <div className="mt-2 text-xs text-black/55">
                {!allFilled(ladder) ? "Fill all 10." : !allUnique(ladder) ? "Teams must be unique." : "Ready."}
              </div>
            </div>
          </div>
        )}

        {/* BRACKET */}
        {submitted && (
          <div className="w-full flex flex-col items-center">
            <div className="relative w-full max-w-[980px] h-[720px]">
              {/* WC row */}
              <div className="absolute left-1/2 -translate-x-1/2 top-2 flex gap-10 justify-center">
                <BracketCard
                  id="WC1"
                  aName={nameOfSeed(7)}
                  bName={nameOfSeed(10)}
                  winner={winners.WC1}
                  onPick={pickWinner}
                />
                <BracketCard
                  id="WC2"
                  aName={nameOfSeed(8)}
                  bName={nameOfSeed(9)}
                  winner={winners.WC2}
                  onPick={pickWinner}
                />
              </div>

              {/* QF/EF row */}
              <div className="absolute left-1/2 -translate-x-1/2 top-[140px] w-full px-2">
                <div className="flex items-center justify-center gap-8">
                  <BracketCard
                    id="QF1"
                    aName={nameOfSeed(1)}
                    bName={nameOfSeed(4)}
                    winner={winners.QF1}
                    onPick={pickWinner}
                    widthClass="w-[220px]"
                  />
                  <BracketCard
                    id="EF1"
                    aName={nameOfSeed(5)}
                    bName={nameOfSeed(lowerWC)}
                    winner={winners.EF1}
                    onPick={pickWinner}
                    widthClass="w-[220px]"
                  />
                  <BracketCard
                    id="EF2"
                    aName={nameOfSeed(6)}
                    bName={nameOfSeed(higherWC)}
                    winner={winners.EF2}
                    onPick={pickWinner}
                    widthClass="w-[220px]"
                  />
                  <BracketCard
                    id="QF2"
                    aName={nameOfSeed(2)}
                    bName={nameOfSeed(3)}
                    winner={winners.QF2}
                    onPick={pickWinner}
                    widthClass="w-[220px]"
                  />
                </div>
              </div>

              {/* SF row */}
              <div className="absolute left-1/2 -translate-x-1/2 top-[290px] w-full px-2">
                <div className="flex items-center justify-center gap-[220px]">
                  <BracketCard
                    id="SF1"
                    aName={nameOfSeed(sf1A)}
                    bName={nameOfSeed(sf1B)}
                    winner={winners.SF1}
                    onPick={pickWinner}
                  />
                  <BracketCard
                    id="SF2"
                    aName={nameOfSeed(sf2A)}
                    bName={nameOfSeed(sf2B)}
                    winner={winners.SF2}
                    onPick={pickWinner}
                  />
                </div>
              </div>

              {/* PF row (CROSSOVER) */}
              <div className="absolute left-1/2 -translate-x-1/2 top-[440px] w-full px-2">
                <div className="flex items-center justify-center gap-8">
                  <BracketCard
                    id="PF1"
                    aName={nameOfSeed(pf1A)}
                    bName={nameOfSeed(pf1B)}
                    winner={winners.PF1}
                    onPick={pickWinner}
                  />
                  <BracketCard
                    id="PF2"
                    aName={nameOfSeed(pf2A)}
                    bName={nameOfSeed(pf2B)}
                    winner={winners.PF2}
                    onPick={pickWinner}
                  />
                </div>
              </div>

              {/* GF row */}
              <div className="absolute left-1/2 -translate-x-1/2 top-[585px] flex flex-col items-center">
                <BracketCard
                  id="GF"
                  aName={nameOfSeed(gfA)}
                  bName={nameOfSeed(gfB)}
                  winner={winners.GF}
                  onPick={pickWinner}
                />

                {premiers && (
                  <div className="mt-4 text-2xl font-black tracking-wide flex items-center gap-2">
                    🏆 <span className="italic">PREMIERS: {premiers}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={backToLadder}
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-black/10 bg-black text-white px-8 py-4 font-extrabold tracking-wide hover:bg-black/90 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              BACK TO LADDER
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
