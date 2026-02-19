"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type User = { email: string; username: string };

const LS_USER = "coco_user";

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(LS_USER);
    if (!raw) return null;
    const u = JSON.parse(raw) as User;
    if (!u?.username) return null;
    return u;
  } catch {
    return null;
  }
}

export default function AccountDropdown({
statsHref = "/mystats"
}: {
  statsHref?: string;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setUser(loadUser());

    const onStorage = () => setUser(loadUser());
    window.addEventListener("storage", onStorage);

    const onClickOutside = (e: MouseEvent) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);

    return () => {
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, []);

if (!user) {
  return (
    <div ref={boxRef} className="relative">
      <button
        onClick={() => router.push("/login")}
        className="rounded-xl border border-white/15 bg-black/30 px-4 py-2 text-sm font-extrabold text-white/90 hover:border-white/30 transition flex items-center gap-2"
      >
        Sign in
        <span className="text-white/60">→</span>
      </button>
    </div>
  );
}

  return (
    <div ref={boxRef} className="relative">
      {/* Username button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-xl border border-white/15 bg-black/30 px-4 py-2 text-sm font-extrabold text-white/90 hover:border-white/30 transition flex items-center gap-2"
      >
        <span className="truncate max-w-[180px]">{user.username}</span>
        <span className={`text-white/60 transition ${open ? "rotate-180" : ""}`}>▾</span>
      </button>

{/* Dropdown */}
{open && (
  <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-white/15 bg-zinc-950 shadow-lg">
    <button
      onClick={() => {
        localStorage.removeItem(LS_USER);
        setUser(null);
        setOpen(false);
        router.push("/");
      }}
      className="w-full px-4 py-3 text-left text-sm text-white/85 hover:bg-white/5"
    >
      Sign Out
    </button>
  </div>
)}

    </div>
  );
}

