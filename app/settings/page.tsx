"use client";

import { useEffect, useState } from "react";

type PrimaryColor =
  | "blue"
  | "red"
  | "green"
  | "yellow"
  | "purple"
  | "orange"
  | "pink";

type SavedSettings = {
  primaryColor: PrimaryColor;
};

const STORAGE_KEY = "cocofooty_settings";

const PRIMARY_COLOR_OPTIONS: {
  value: PrimaryColor;
  label: string;
  dotClass: string;
  activeClass: string;
}[] = [
  {
    value: "blue",
    label: "Blue",
    dotClass: "bg-sky-500",
    activeClass: "border-sky-400/50 bg-sky-500/10",
  },
  {
    value: "red",
    label: "Red",
    dotClass: "bg-red-500",
    activeClass: "border-red-400/50 bg-red-500/10",
  },
  {
    value: "green",
    label: "Green",
    dotClass: "bg-emerald-500",
    activeClass: "border-emerald-400/50 bg-emerald-500/10",
  },
  {
    value: "yellow",
    label: "Yellow",
    dotClass: "bg-yellow-400",
    activeClass: "border-yellow-300/50 bg-yellow-400/10",
  },
  {
    value: "purple",
    label: "Purple",
    dotClass: "bg-violet-500",
    activeClass: "border-violet-400/50 bg-violet-500/10",
  },
  {
    value: "orange",
    label: "Orange",
    dotClass: "bg-orange-500",
    activeClass: "border-orange-400/50 bg-orange-500/10",
  },
  {
    value: "pink",
    label: "Pink",
    dotClass: "bg-pink-500",
    activeClass: "border-pink-400/50 bg-pink-500/10",
  },
];

const DEFAULT_SETTINGS: SavedSettings = {
  primaryColor: "red",
};

function loadSettings(): SavedSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;

    const parsed = JSON.parse(raw);
    return {
      primaryColor: parsed?.primaryColor ?? DEFAULT_SETTINGS.primaryColor,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: SavedSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<SavedSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    setSettings(loadSettings());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    saveSettings(settings);
  }, [settings, mounted]);

  if (!mounted) {
    return (
      <main className="min-h-screen bg-black px-4 py-10 text-white">
        <div className="mx-auto max-w-2xl animate-pulse">
          <div className="h-[420px] rounded-[28px] bg-white/10" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white">
      <div className="mx-auto max-w-2xl">
        <section className="rounded-[28px] border border-white/10 bg-[#0d0d0d] p-5 md:p-6">
          <div className="mb-5">
            <div className="text-[11px] font-black uppercase tracking-[0.28em] text-white/50">
              Primary Colour
            </div>
            <h2 className="mt-2 text-2xl font-black uppercase tracking-[0.08em]">
              Home Button Gradient
            </h2>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-white/10 bg-black/25">
            {PRIMARY_COLOR_OPTIONS.map((option, index) => {
              const active = settings.primaryColor === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setSettings({
                      primaryColor: option.value,
                    })
                  }
                  className={`flex w-full items-center justify-between px-4 py-4 text-left transition ${
                    active
                      ? option.activeClass
                      : "bg-transparent hover:bg-white/[0.04]"
                  } ${
                    index !== PRIMARY_COLOR_OPTIONS.length - 1
                      ? "border-b border-white/10"
                      : ""
                  }`}
                >
                  <span className="text-[15px] font-extrabold text-white">
                    {option.label}
                  </span>

                  <div className="flex items-center gap-3">
                    {active && (
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/55">
                        Selected
                      </span>
                    )}
                    <span className={`h-5 w-5 rounded-full ${option.dotClass}`} />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}