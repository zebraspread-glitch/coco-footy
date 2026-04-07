"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import AccountDropdown from "../../components/AccountDropdown";

const NAV = [
  { label: "Daily Challenge", href: "/daily" },
  { label: "Streak Mode", href: "/streak" },
  { label: "Versus Mode", href: "/versus" },
  { label: "Live Scores", href: "/live-scores" },
];

export default function TopBar() {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-50">
      <div className="border-b border-white/10 bg-black/40 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-3 sm:px-4 md:px-6">
          <div className="flex min-h-[64px] flex-col gap-3 py-3 md:h-14 md:flex-row md:items-center md:justify-between md:gap-6 md:py-0">
            
            {/* TOP ROW ON MOBILE / LEFT ON DESKTOP */}
            <div className="flex items-center justify-between gap-3 md:contents">
              
              {/* Brand */}
              <Link
                href="/"
                className="flex shrink-0 items-center gap-2 text-sm font-extrabold tracking-[0.22em] text-white transition hover:text-blue-400 sm:text-base"
              >
                <span className="text-base sm:text-lg">🏈</span>
                <span className="whitespace-nowrap">COCO FOOTY</span>
              </Link>

              {/* Right controls on mobile */}
              <div className="flex items-center gap-2 md:hidden">
                <Link
                  href="/settings"
                  className="flex h-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-sm font-semibold text-white/80 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
                >
                  <span className="mr-1">⚙️</span>
                  <span>Settings</span>
                </Link>

                <div className="flex h-9 items-center">
                  <AccountDropdown />
                </div>
              </div>

              {/* LEFT: game modes on desktop */}
              <div className="hidden items-center gap-6 text-sm font-semibold text-white/70 md:flex">
                {NAV.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`transition ${
                        active ? "text-white" : "hover:text-white"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              {/* RIGHT: settings + account on desktop */}
              <div className="hidden items-center gap-6 text-sm font-semibold text-white/70 md:flex">
                <Link
                  href="/settings"
                  className="flex items-center gap-1 transition hover:text-white"
                >
                  <span>⚙️</span>
                  <span>Settings</span>
                </Link>

                <AccountDropdown />
              </div>
            </div>

            {/* MOBILE NAV */}
            <div className="grid grid-cols-2 gap-2 md:hidden">
              {NAV.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex min-h-[42px] items-center justify-center rounded-xl border px-3 text-center text-[13px] font-semibold transition ${
                      active
                        ? "border-white/20 bg-white/12 text-white"
                        : "border-white/10 bg-white/5 text-white/75 hover:border-white/20 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}