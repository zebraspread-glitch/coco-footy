"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SignOutButton, useUser } from "@clerk/nextjs";

export default function AccountDropdown({
  statsHref = "/mystats",
}: {
  statsHref?: string;
}) {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);

    return () => {
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, []);

  if (!isLoaded) {
    return (
      <div ref={boxRef} className="relative">
        <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-black/30 px-4 py-2 text-sm font-extrabold text-white/60">
          Loading...
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div ref={boxRef} className="relative">
        <button
          onClick={() => router.push("/login")}
          className="flex items-center gap-2 rounded-xl border border-white/15 bg-black/30 px-4 py-2 text-sm font-extrabold text-white/90 transition hover:border-white/30 hover:bg-black/40"
        >
          Sign in
          <span className="text-white/60">→</span>
        </button>
      </div>
    );
  }

  const displayName =
    user.username ||
    user.firstName ||
    user.primaryEmailAddress?.emailAddress ||
    "Account";

  return (
    <div ref={boxRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl border border-white/15 bg-black/30 px-4 py-2 text-sm font-extrabold text-white/90 transition hover:border-white/30 hover:bg-black/40"
      >
        <span className="max-w-[180px] truncate">{displayName}</span>
        <span className={`text-white/60 transition ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-white/15 bg-zinc-950 shadow-lg">
          <button
            onClick={() => {
              setOpen(false);
              router.push(statsHref);
            }}
            className="w-full px-4 py-3 text-left text-sm text-white/85 transition hover:bg-white/5"
          >
            My Stats
          </button>

          <SignOutButton redirectUrl="/">
            <button
              onClick={() => setOpen(false)}
              className="w-full px-4 py-3 text-left text-sm text-white/85 transition hover:bg-white/5"
            >
              Sign Out
            </button>
          </SignOutButton>
        </div>
      )}
    </div>
  );
}