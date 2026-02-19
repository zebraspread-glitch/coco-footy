"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "signin" | "signup";

const LS_USER = "coco_user"; // { email, username }
const LS_USERS = "coco_users"; // array of { email, name, passwordHash } (basic demo)

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveJSON(key: string, value: any) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

// Demo-only “hash” (NOT secure). Replace with real auth later.
function fakeHash(pw: string) {
  let h = 0;
  for (let i = 0; i < pw.length; i++) h = (h * 31 + pw.charCodeAt(i)) >>> 0;
  return String(h);
}

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("signin");
const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(() => (mode === "signin" ? "SIGN IN" : "SIGN UP"), [mode]);

  function submit() {
    setError(null);

    const e = normalizeEmail(email);
    if (!e.includes("@")) return setError("Enter a valid email.");
    if (pw.length < 6) return setError("Password must be at least 6 characters.");

const users = loadJSON<Array<{ email: string; username: string; passwordHash: string }>>(LS_USERS, []);

    if (mode === "signup") {
if (username.trim().length < 3) return setError("Enter a username (min 3 chars).");
      if (pw !== pw2) return setError("Passwords do not match.");

      const exists = users.some((u) => normalizeEmail(u.email) === e);
      if (exists) return setError("That email is already registered.");

      const nextUsers = [
        ...users,
{ email: e, username: username.trim(), passwordHash: fakeHash(pw) },
      ];
      saveJSON(LS_USERS, nextUsers);
saveJSON(LS_USER, { email: e, username: username.trim() });
      router.push("/");
      return;
    }

    // signin
    const user = users.find((u) => normalizeEmail(u.email) === e);
    if (!user) return setError("No account found for that email.");
    if (user.passwordHash !== fakeHash(pw)) return setError("Incorrect password.");

saveJSON(LS_USER, { email: user.email, username: user.username });
    router.push("/");
  }

  return (
    <main className="min-h-screen text-white relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-black" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/35 to-black/70" />

      <div className="relative mx-auto max-w-md px-6 py-14">
        <button
          className="mb-6 rounded-xl border border-white/20 px-4 py-2 text-white/80 hover:text-white hover:border-white/40"
          onClick={() => router.push("/")}
        >
          ← Home
        </button>

        <div className="rounded-2xl border border-white/15 bg-black/35 p-6">
          <div className="text-3xl font-extrabold tracking-wide">{title}</div>
          <div className="mt-2 text-white/60 text-sm">
            {mode === "signin" ? "Welcome back." : "Create your Coco Footy account."}
          </div>

          <div className="mt-6 flex gap-2">
            <button
              className={`flex-1 rounded-xl border px-4 py-2 font-bold ${
                mode === "signin"
                  ? "border-white/30 bg-white/10"
                  : "border-white/15 hover:border-white/30"
              }`}
              onClick={() => setMode("signin")}
            >
              Sign In
            </button>
            <button
              className={`flex-1 rounded-xl border px-4 py-2 font-bold ${
                mode === "signup"
                  ? "border-white/30 bg-white/10"
                  : "border-white/15 hover:border-white/30"
              }`}
              onClick={() => setMode("signup")}
            >
              Sign Up
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {mode === "signup" && (
  <input
    value={username}
    onChange={(e) => setUsername(e.target.value)}
    placeholder="Username"
                className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-white/40"
              />
            )}

            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-white/40"
            />

            <input
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Password"
              type="password"
              className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-white/40"
            />

            {mode === "signup" && (
              <input
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                placeholder="Confirm password"
                type="password"
                className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-white/40"
              />
            )}

            {error && <div className="text-red-400 font-semibold text-sm">{error}</div>}

            <button
              onClick={submit}
              className="w-full rounded-xl bg-yellow-50 text-black px-4 py-3 font-extrabold hover:opacity-90 transition"
            >
              {mode === "signin" ? "Sign In" : "Create Account"}
            </button>
          </div>
        </div>

        <div className="mt-4 text-center text-white/40 text-xs">
          Demo login (localStorage). We can upgrade to real auth later.
        </div>
      </div>
    </main>
  );
}

