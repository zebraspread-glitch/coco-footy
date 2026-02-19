"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Home, Search, X } from "lucide-react";
import playersData from "../data/public/afl_players.json";

/** ================= Types ================= */
type PlayerPos = "FWD" | "MID" | "DEF" | "RUCK";
type Player = {
  id: string;
  name: string;
  club: string;
  pos: PlayerPos[];
  points: number; // only for sorting
  number: number; // jumper number
};

type SlotIndex =
  | 1 | 2 | 3 | 4 | 5
  | 6 | 7 | 8 | 9 | 10
  | 11 | 12 | 13 | 14 | 15
  | 16 | 17 | 18 | 19 | 20;

type Rankings = Record<SlotIndex, string | null>;

const LS_KEY = "coco_player_rankings_v2";

/** ================= Clubs (colours + abbreviations) ================= */
const CLUB_COLOURS: Record<string, { bg: string; text: string }> = {
  Adelaide: { bg: "#002B5C", text: "#E41E2B" },
  Brisbane: { bg: "#7C003E", text: "#FFD200" },
  Carlton: { bg: "#001B4D", text: "#FFFFFF" },
  Collingwood: { bg: "#000000", text: "#FFFFFF" },
  Essendon: { bg: "#C8102E", text: "#FFFFFF" },
  Fremantle: { bg: "#2B0A3D", text: "#FFFFFF" },
  Geelong: { bg: "#0F2A4A", text: "#FFFFFF" },
  "Gold Coast": { bg: "#B30000", text: "#FFD200" },
  GWS: { bg: "#F15A22", text: "#111111" },
  Hawthorn: { bg: "#4B2E1E", text: "#F7B500" },
  Melbourne: { bg: "#0A2A5E", text: "#FFFFFF" },
  "North Melbourne": { bg: "#003A70", text: "#FFFFFF" },
  "Port Adelaide": { bg: "#00A1DE", text: "#111111" },
  Richmond: { bg: "#F7B500", text: "#111111" },
  "St Kilda": { bg: "#C8102E", text: "#FFFFFF" },
  Sydney: { bg: "#E41E2B", text: "#FFFFFF" },
  "West Coast": { bg: "#002B5C", text: "#FFD200" },
  "Western Bulldogs": { bg: "#0047AB", text: "#FFFFFF" },
};

const CLUB_ABBR: Record<string, string> = {
  Adelaide: "ADE",
  Brisbane: "BRL",
  Carlton: "CAR",
  Collingwood: "COL",
  Essendon: "ESS",
  Fremantle: "FRE",
  Geelong: "GEE",
  "Gold Coast": "GCS",
  GWS: "GWS",
  Hawthorn: "HAW",
  Melbourne: "MEL",
  "North Melbourne": "NTH",
  "Port Adelaide": "PTA",
  Richmond: "RIC",
  "St Kilda": "STK",
  Sydney: "SYD",
  "West Coast": "WCE",
  "Western Bulldogs": "WBD",
};

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function tint(hex: string, alpha = 0.82) {
  return `color-mix(in srgb, ${hex} ${Math.round(alpha * 100)}%, rgba(0,0,0,0))`;
}

/** ================= Local Storage ================= */
function safeLoad(): { rankings: Rankings; showCount: 5 | 10 | 20; posGate: "All" | PlayerPos } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { rankings: Rankings; showCount: 5 | 10 | 20; posGate: "All" | PlayerPos };
  } catch {
    return null;
  }
}

function safeSave(rankings: Rankings, showCount: 5 | 10 | 20, posGate: "All" | PlayerPos) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_KEY, JSON.stringify({ rankings, showCount, posGate }));
}

const ALL_SLOTS: SlotIndex[] = Array.from({ length: 20 }, (_, i) => (i + 1) as SlotIndex);

function defaultRankings(): Rankings {
  const r: Partial<Rankings> = {};
  for (const s of ALL_SLOTS) r[s] = null;
  return r as Rankings;
}

/** ================= Picker Modal ================= */
function PlayerPickerModal({
  open,
  onClose,
  title,
  players,
  onPick,
  takenIds,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  players: Player[];
  onPick: (p: Player) => void;
  takenIds: Set<string>;
}) {
  const [q, setQ] = useState("");

  useEffect(() => {
    if (open) setQ("");
  }, [open]);

  const filtered = useMemo(() => {
    const query = normalize(q);
    return players.filter((p) => {
      if (takenIds.has(p.id)) return false;
      if (!query) return true;
      return normalize(p.name).includes(query) || normalize(p.club).includes(query);
    });
  }, [players, q, takenIds]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0b0b0b]/95 backdrop-blur p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs tracking-[0.25em] font-extrabold text-white/60">PICK A PLAYER</div>
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
            placeholder="Search name or club..."
            className="w-full bg-transparent outline-none text-sm text-white/90 placeholder:text-white/40"
            autoFocus
          />
        </div>

        <div className="mt-4 max-h-[420px] overflow-auto rounded-xl border border-white/10">
          {filtered.length === 0 ? (
            <div className="text-sm text-white/50 py-10 text-center">No players found.</div>
          ) : (
            filtered.map((p) => {
              const clubMeta = CLUB_COLOURS[p.club] ?? { bg: "#111111", text: "#ffffff" };
              const abbr = CLUB_ABBR[p.club] ?? p.club.slice(0, 3).toUpperCase();

              return (
                <button
                  key={p.id}
                  onClick={() => onPick(p)}
                  className="w-full text-left px-4 py-3 border-b border-white/5 last:border-b-0 hover:bg-white/5 transition flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-extrabold text-white truncate">{p.name}</div>
                    <div className="text-xs text-white/60">{p.pos.join("/")}</div>
                  </div>

                  <div
                    className="shrink-0 rounded-lg px-3 py-2 font-black text-sm tracking-widest"
                    style={{ backgroundColor: tint(clubMeta.bg, 0.65), color: clubMeta.text }}
                    title={p.club}
                  >
                    {abbr}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

/** ================= Page ================= */
export default function PlayerRankingsPage() {
  const ALL_PLAYERS: Player[] = playersData as Player[];

  // ✅ IMPORTANT: do NOT read localStorage during render (causes hydration mismatch)
  const [hydrated, setHydrated] = useState(false);

  const [rankings, setRankings] = useState<Rankings>(defaultRankings());
  const [showCount, setShowCount] = useState<5 | 10 | 20>(10);
  const [posGate, setPosGate] = useState<"All" | PlayerPos>("All");

  // picker state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<SlotIndex>(1);

  // ✅ load saved state AFTER mount
  useEffect(() => {
    const loaded = safeLoad();
    if (loaded) {
      setRankings(loaded.rankings ?? defaultRankings());
      setShowCount(loaded.showCount ?? 10);
      setPosGate(loaded.posGate ?? "All");
    }
    setHydrated(true);
  }, []);

  // ✅ save only AFTER we've hydrated (so we don’t overwrite stored values with defaults)
  useEffect(() => {
    if (!hydrated) return;
    safeSave(rankings, showCount, posGate);
  }, [rankings, showCount, posGate, hydrated]);

  const visibleSlots = useMemo(() => ALL_SLOTS.slice(0, showCount), [showCount]);

  // if you reduce showCount, clear hidden slots so duplicates don't get "stuck"
  useEffect(() => {
    setRankings((prev) => {
      const next = { ...prev };
      for (const s of ALL_SLOTS) {
        if (!visibleSlots.includes(s) && next[s]) next[s] = null;
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCount]);

  const takenIds = useMemo(() => {
    const ids = visibleSlots.map((s) => rankings[s]).filter(Boolean) as string[];
    return new Set(ids);
  }, [rankings, visibleSlots]);

  const getPlayerById = (id: string | null) => {
    if (!id) return null;
    return ALL_PLAYERS.find((p) => p.id === id) ?? null;
  };

  // players shown in picker are restricted by posGate
  const pickerPlayers = useMemo(() => {
    const base = ALL_PLAYERS.slice().sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
    const gated = posGate === "All" ? base : base.filter((p) => p.pos?.includes(posGate));
    return gated;
  }, [ALL_PLAYERS, posGate]);

  function openPicker(slot: SlotIndex) {
    setActiveSlot(slot);
    setPickerOpen(true);
  }

  function pickPlayer(p: Player) {
    if (posGate !== "All" && !p.pos?.includes(posGate)) return;
    setRankings((prev) => ({ ...prev, [activeSlot]: p.id }));
    setPickerOpen(false);
  }

  function clearAll() {
    setRankings(defaultRankings());
  }

  // If you change position gate, clear any already-picked players that don't match
  useEffect(() => {
    if (posGate === "All") return;
    setRankings((prev) => {
      const next = { ...prev };
      for (const s of visibleSlots) {
        const p = getPlayerById(next[s]);
        if (p && !p.pos?.includes(posGate)) next[s] = null;
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posGate]);

  return (
    <main
      className="min-h-screen text-white bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/coco-footy-bg.png')" }}
    >
      {/* overlay */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-black/75" />
        <div className="absolute inset-0 opacity-[0.14] [background-image:radial-gradient(rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
      </div>

      {/* top bar */}
      <header className="border-b border-white/10 bg-black/30 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="font-extrabold tracking-widest text-white">
            COCO <span className="text-blue-500">FOOTY</span>
          </div>

          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-extrabold tracking-wide hover:bg-white/10 transition"
          >
            <Home className="h-4 w-4" />
            HOME
          </a>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="text-center">
          <div className="text-5xl font-black tracking-tight">TOP {showCount}</div>
        </div>

        <div className="mt-8 flex flex-col items-center">
          {/* list: only renders 1..showCount */}
          <div className="w-full max-w-xl space-y-2">
            {visibleSlots.map((slot) => {
              const p = getPlayerById(rankings[slot]);
              const clubMeta = p ? CLUB_COLOURS[p.club] ?? { bg: "#111111", text: "#ffffff" } : null;

              return (
                <div key={slot} className="flex items-center gap-3">
                  <div className="w-14 shrink-0 bg-[#f2a71b] text-black font-black text-2xl text-center py-2 rounded-sm">
                    {slot}
                  </div>

                  <button
                    onClick={() => openPicker(slot)}
                    className="flex-1 h-12 border border-white/70 bg-black rounded-sm px-4 text-left font-black tracking-widest uppercase hover:bg-neutral-900 transition"
                    style={
                      p && clubMeta
                        ? { backgroundColor: clubMeta.bg, color: clubMeta.text, borderColor: "rgba(255,255,255,0.75)" }
                        : undefined
                    }
                  >
                    {p ? p.name : "+ SELECT PLAYER"}
                    {p ? (
                      <span className="ml-3 text-xs font-extrabold tracking-widest opacity-80">
                        {p.pos.join("/")}
                      </span>
                    ) : null}
                  </button>
                </div>
              );
            })}
          </div>

          {/* position gate */}
          <div className="mt-8 flex items-center gap-4">
            <select
              value={posGate}
              onChange={(e) => setPosGate(e.target.value as any)}
              className="h-10 px-6 rounded-md bg-[#d89a1a] text-black font-black tracking-wide outline-none"
              title="Only allow this position"
            >
              <option value="All">All</option>
              <option value="MID">MID</option>
              <option value="FWD">FWD</option>
              <option value="DEF">DEF</option>
              <option value="RUCK">RUCK</option>
            </select>
          </div>

          {/* show buttons */}
          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={() => setShowCount(5)}
              className={`h-11 px-8 rounded-md font-black tracking-wide transition ${
                showCount === 5 ? "bg-[#d89a1a] text-black" : "bg-white/10 text-white hover:bg-white/15"
              }`}
            >
              Show 5
            </button>

            <button
              onClick={() => setShowCount(10)}
              className={`h-11 px-8 rounded-md font-black tracking-wide transition ${
                showCount === 10 ? "bg-[#d89a1a] text-black" : "bg-white/10 text-white hover:bg-white/15"
              }`}
            >
              Show 10
            </button>

            <button
              onClick={() => setShowCount(20)}
              className={`h-11 px-8 rounded-md font-black tracking-wide transition ${
                showCount === 20 ? "bg-[#d89a1a] text-black" : "bg-white/10 text-white hover:bg-white/15"
              }`}
            >
              Show 20
            </button>

            <button
              onClick={clearAll}
              className="h-11 px-8 rounded-md border border-white/30 bg-white/5 text-white font-extrabold tracking-wide hover:bg-white/10 transition"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <PlayerPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title={`Top ${showCount} • Slot ${activeSlot} • ${posGate === "All" ? "Any" : posGate}`}
        players={pickerPlayers}
        onPick={pickPlayer}
        takenIds={takenIds}
      />
    </main>
  );
}
