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
      <div className="backdrop-blur-md bg-black/40 border-b border-white/10">
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
          
          {/* LEFT: game modes */}
          <div className="flex items-center gap-6 text-white/70 text-sm font-semibold">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={active ? "text-white" : "hover:text-white"}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* RIGHT: brand + account */}
          <div className="flex items-center gap-6 text-white/70 text-sm font-semibold">

            {/* Brand */}
            <Link
              href="/"
              className="flex items-center gap-2 text-white font-extrabold tracking-widest hover:text-blue-400 transition"
            >
              <span>🏈</span>
              <span>COCO FOOTY</span>
            </Link>

            {/* Account */}
            <AccountDropdown />

          </div>

        </div>
      </div>
    </div>
  );
}