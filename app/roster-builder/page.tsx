"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import playersData from "../data/public/afl_players.json";

/** ================= Types ================= */
type PlayerPos = "FWD" | "MID" | "DEF" | "RUCK";
type Mode = "8" | "FULL";

type Slot = {
  id: string;
  label: string; // shows on the left (FWD, CHF, etc)
  allowed: PlayerPos[]; // which player positions are allowed to fill it
};

type Player = {
  id: string;
  name: string;
  club: string;
  pos: PlayerPos[];
  points: number;
};

type ClubMeta = {
  name: string;
  primary: string;
  text: string;
};

/** ================= Club colours ================= */
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
  { name: "St Kilda", primary: "#C8102E", text: "#FFFFFF" },
  { name: "Western Bulldogs", primary: "#0047AB", text: "#FFFFFF" },
  { name: "North Melbourne", primary: "#003A70", text: "#FFFFFF" },
  { name: "Gold Coast", primary: "#B30000", text: "#FFD200" },
  { name: "GWS", primary: "#F15A22", text: "#111111" },
];

/** ================= Slots ================= */
const SLOTS_8: Slot[] = [
  { id: "fwd1", label: "FWD", allowed: ["FWD"] },
  { id: "fwd2", label: "FWD", allowed: ["FWD"] },
  { id: "mid1", label: "MID", allowed: ["MID"] },
  { id: "mid2", label: "MID", allowed: ["MID"] },
  { id: "def1", label: "DEF", allowed: ["DEF"] },
  { id: "def2", label: "DEF", allowed: ["DEF"] },
  { id: "ruck", label: "RUCK", allowed: ["RUCK"] },
  { id: "flx", label: "FLX", allowed: ["FWD", "MID", "DEF"] },
];

const SLOTS_FULL: Slot[] = [
  { id: "ff", label: "FF", allowed: ["FWD"] },
  { id: "lfp", label: "LFP", allowed: ["FWD"] },
  { id: "rfp", label: "RFP", allowed: ["FWD"] },
  { id: "lhf", label: "LHF", allowed: ["FWD"] },
  { id: "chf", label: "CHF", allowed: ["FWD"] },
  { id: "rhf", label: "RHF", allowed: ["FWD"] },

  { id: "lw", label: "LW", allowed: ["MID", "FWD"] },
  { id: "rr", label: "RR", allowed: ["MID"] },
  { id: "ro", label: "RO", allowed: ["MID"] },
  { id: "ruck", label: "RUCK", allowed: ["RUCK"] },
  { id: "center", label: "CENTER", allowed: ["MID"] },
  { id: "rw", label: "RW", allowed: ["MID", "FWD"] },

  { id: "lhb", label: "LHB", allowed: ["DEF"] },
  { id: "chb", label: "CHB", allowed: ["DEF"] },
  { id: "rhb", label: "RHB", allowed: ["DEF"] },
  { id: "lbp", label: "LBP", allowed: ["DEF"] },
  { id: "rbp", label: "RBP", allowed: ["DEF"] },
  { id: "fb", label: "FB", allowed: ["DEF"] },
];

/** ================= Storage keys ================= */
const LS_MODE = "coco_roster_mode";
const LS_ROSTER_8 = "coco_roster_8";
const LS_ROSTER_FULL = "coco_roster_full";

/** ================= Helpers ================= */
function clubForPlayer(clubs: ClubMeta[], player: Player | null): ClubMeta | null {
  if (!player) return null;
  return clubs.find((c) => c.name === player.club) ?? null;
}

function buildEmpty(slots: Slot[]) {
  return Object.fromEntries(slots.map((s) => [s.id, null])) as Record<string, string | null>;
}

/** ================= Page ================= */
export default function RosterBuilderPage() {
  const router = useRouter();
  const ALL_PLAYERS: Player[] = playersData as Player[];

  const [mode, setMode] = useState<Mode>("8");

  const slots = useMemo(() => (mode === "8" ? SLOTS_8 : SLOTS_FULL), [mode]);
  const storageKey = mode === "8" ? LS_ROSTER_8 : LS_ROSTER_FULL;

  const [roster, setRoster] = useState<Record<string, string | null>>(buildEmpty(SLOTS_8));

  const [active, setActive] = useState<{ slotId: string; slotLabel: string; allowed: PlayerPos[] } | null>(null);
  const [search, setSearch] = useState("");

  /** load mode */
  useEffect(() => {
    try {
      const savedMode = (localStorage.getItem(LS_MODE) as Mode) || "8";
      setMode(savedMode === "FULL" ? "FULL" : "8");
    } catch {}
  }, []);

  /** load roster for mode */
  useEffect(() => {
    const slotsForMode = mode === "8" ? SLOTS_8 : SLOTS_FULL;
    const key = mode === "8" ? LS_ROSTER_8 : LS_ROSTER_FULL;

    try {
      localStorage.setItem(LS_MODE, mode);
    } catch {}

    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        setRoster(buildEmpty(slotsForMode));
        return;
      }
      const parsed = JSON.parse(raw) as Record<string, string | null>;
      const next = buildEmpty(slotsForMode);
      for (const s of slotsForMode) next[s.id] = parsed[s.id] ?? null;
      setRoster(next);
    } catch {
      setRoster(buildEmpty(slotsForMode));
    }
  }, [mode]);

  const getPlayerById = (pid: string | null) => {
    if (!pid) return null;
    return ALL_PLAYERS.find((p) => p.id === pid) ?? null;
  };

  const pickedIds = useMemo(() => {
    const ids: string[] = [];
    Object.values(roster).forEach((id) => id && ids.push(id));
    return new Set(ids);
  }, [roster]);

  const eligiblePlayers = useMemo(() => {
    if (!active) return [];
    const q = search.trim().toLowerCase();

    return ALL_PLAYERS
      .filter((p) => !pickedIds.has(p.id))
      .filter((p) => p.pos.some((pos) => active.allowed.includes(pos)))
      .filter((p) => (q ? p.name.toLowerCase().includes(q) : true))
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [ALL_PLAYERS, active, pickedIds, search]);

  const allFilled = useMemo(() => slots.every((s) => Boolean(roster[s.id])), [slots, roster]);

  function onOpen(slot: Slot) {
    setSearch("");
    setActive({ slotId: slot.id, slotLabel: slot.label, allowed: slot.allowed });
  }

  function onPick(playerId: string) {
    if (!active) return;

    setRoster((prev) => ({ ...prev, [active.slotId]: playerId }));
    setActive(null);
    setSearch("");
  }

  function onClearSlot(slotId: string) {
    setRoster((prev) => ({ ...prev, [slotId]: null }));
  }

  function onSave() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(roster));
    } catch {}
  }

  function onReset() {
    const slotsForMode = mode === "8" ? SLOTS_8 : SLOTS_FULL;
    setRoster(buildEmpty(slotsForMode));
    setActive(null);
    setSearch("");
    try {
      localStorage.removeItem(storageKey);
    } catch {}
  }

  return (
    <main className="min-h-screen text-white relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-black" />
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,#ffffff22,transparent_40%),radial-gradient(circle_at_80%_30%,#ffffff15,transparent_35%),radial-gradient(circle_at_30%_80%,#ffffff10,transparent_40%)]" />
      <div className="absolute inset-0 bg-gradient-to-br from-black via-black/70 to-black/90" />

      <div className="relative mx-auto max-w-5xl px-6 py-10">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-extrabold tracking-wide text-white">ROSTER BUILDER</h1>

            {/* Mode toggle */}
            <div className="ml-2 inline-flex rounded-xl border border-white/15 bg-black/30 p-1">
              <button
                onClick={() => setMode("8")}
                className={`px-4 py-2 rounded-lg font-extrabold tracking-wide ${
                  mode === "8" ? "bg-blue-600 text-white" : "text-white/70 hover:text-white"
                }`}
              >
                8 Player Team
              </button>
              <button
                onClick={() => setMode("FULL")}
                className={`px-4 py-2 rounded-lg font-extrabold tracking-wide ${
                  mode === "FULL" ? "bg-blue-600 text-white" : "text-white/70 hover:text-white"
                }`}
              >
                Full Team
              </button>
            </div>
          </div>

          <button
            className="rounded-xl border border-white/20 px-4 py-2 text-white/80 hover:text-white hover:border-white/40"
            onClick={() => router.push("/")}
          >
            ← Home
          </button>
        </div>

        {/* Status */}
        <div className="mt-6 text-center text-white/60 font-semibold tracking-wide">
          {allFilled ? "Roster complete. Save it." : "Click a slot to select a player."}
        </div>

        {/* Slots */}
        <div className="mt-8">
          <RosterColumn
            clubs={AFL_CLUBS}
            slots={slots}
            selection={roster}
            getPlayer={getPlayerById}
            onOpen={onOpen}
            onClear={onClearSlot}
            badgeClass="bg-blue-600 text-white"
          />
        </div>

        {/* Actions */}
        <div className="mt-10 flex items-center justify-center gap-4">
          <button
            className={`rounded-xl px-6 py-3 font-extrabold tracking-wide border ${
              allFilled ? "border-white/20 text-white hover:border-white/40" : "border-white/10 text-white/40 cursor-not-allowed"
            }`}
            disabled={!allFilled}
            onClick={onSave}
            title={!allFilled ? "Fill every slot to save" : "Save roster"}
          >
            Save Team
          </button>

          <button
            className="rounded-xl px-6 py-3 font-extrabold tracking-wide bg-blue-600/90 hover:bg-blue-600 text-white"
            onClick={onReset}
          >
            RESET
          </button>
        </div>
      </div>

      {/* Picker Modal */}
      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setActive(null)} />

          <div className="relative w-full max-w-xl rounded-2xl border border-white/15 bg-zinc-950 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="font-extrabold tracking-wide">Select {active.slotLabel}</div>

              <button
                className="rounded-xl border border-white/20 px-3 py-2 text-white/80 hover:text-white hover:border-white/40"
                onClick={() => setActive(null)}
              >
                ✕
              </button>
            </div>

            <div className="mt-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${active.slotLabel}...`}
                className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-white/40"
                autoFocus
              />
            </div>

            <div className="mt-3 max-h-[420px] overflow-y-auto rounded-xl border border-white/10 bg-black/20">
              {eligiblePlayers.length === 0 ? (
                <div className="p-4 text-white/60">No eligible players found.</div>
              ) : (
                eligiblePlayers.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onPick(p.id)}
                    className="w-full px-4 py-3 text-left hover:bg-white/5 border-b border-white/5 last:border-b-0 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex items-center gap-3">
                      <div className="font-extrabold truncate">{p.name}</div>
                      <div className="text-white/55 text-xs">{p.club}</div>
                    </div>

                    <div className="shrink-0 flex items-center gap-3">
                      <div className="text-white/60 text-sm font-bold">{p.pos.join("/")}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/** ================= Column UI ================= */
function RosterColumn({
  clubs,
  slots,
  selection,
  getPlayer,
  onOpen,
  onClear,
  badgeClass,
}: {
  clubs: ClubMeta[];
  slots: Slot[];
  selection: Record<string, string | null>;
  getPlayer: (pid: string | null) => Player | null;
  onOpen: (slot: Slot) => void;
  onClear: (slotId: string) => void;
  badgeClass: string;
}) {
  return (
    <div className="space-y-3">
      {slots.map((slot) => {
        const p = getPlayer(selection[slot.id]);
        const clubMeta = clubForPlayer(clubs, p);

        return (
          <div key={slot.id} className="flex gap-3 items-center">
            <div className={`w-24 shrink-0 rounded-md font-extrabold text-center py-2 ${badgeClass}`}>
              {slot.label}
            </div>

            <button
              className={`flex-1 border border-white/70 rounded-md px-4 text-left transition flex items-center justify-between h-14 ${
                p ? "hover:brightness-110" : "hover:bg-white/5"
              }`}
              style={
                p && clubMeta
                  ? { backgroundColor: clubMeta.primary, color: clubMeta.text, borderColor: "rgba(255,255,255,0.35)" }
                  : { backgroundColor: "rgba(0,0,0,0.30)" }
              }
              onClick={() => onOpen(slot)}
            >
              <span className={`truncate block ${p ? "font-extrabold" : "font-extrabold text-white/80"}`}>
                {p ? p.name : "+ Select Player"}
              </span>

              {/* ✅ show position instead of points */}
              {p?.pos?.length ? (
                <span className="shrink-0 text-white/80 font-bold">{p.pos.join("/")}</span>
              ) : null}
            </button>

            {p ? (
              <button
                onClick={() => onClear(slot.id)}
                className="rounded-md border border-white/15 px-3 h-14 text-white/70 hover:text-white hover:border-white/30"
                title="Clear this slot"
              >
                ✕
              </button>
            ) : (
              <div className="w-[46px]" />
            )}
          </div>
        );
      })}
    </div>
  );
}
