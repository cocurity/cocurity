"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";

export default function TopNav() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-3">
      <nav className="lp-nav">
        <Link href="/">Home</Link>
        <Link href="/scan">Scans</Link>
        <Link href="/verify">Verify</Link>
      </nav>

      {status === "loading" ? (
        <span className="h-8 w-16 animate-pulse rounded-lg bg-white/10" />
      ) : session?.user ? (
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-200 transition hover:bg-white/10"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt=""
                width={24}
                height={24}
                className="h-6 w-6 rounded-full"
              />
            ) : (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-semibold text-cyan-200">
                {session.user.name?.[0]?.toUpperCase() ?? "U"}
              </span>
            )}
            <span className="hidden sm:inline">
              {session.user.name ?? "User"}
            </span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-white/10 bg-[#0e142b]/95 p-1.5 shadow-xl backdrop-blur-lg">
              <div className="border-b border-white/10 px-3 py-2">
                <p className="truncate text-sm font-medium text-slate-100">
                  {session.user.name}
                </p>
                <p className="truncate text-xs text-slate-400">
                  {session.user.email}
                </p>
              </div>
              <Link
                href="/mypage"
                className="mt-1 block rounded-lg px-3 py-2 text-sm text-slate-200 no-underline transition hover:bg-white/10"
                onClick={() => setMenuOpen(false)}
              >
                My page
              </Link>
              <button
                type="button"
                className="mt-0.5 w-full rounded-lg px-3 py-2 text-left text-sm text-slate-300 transition hover:bg-white/10"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      ) : (
        <Link href="/login" className="lp-button lp-button-ghost no-underline">
          Login
        </Link>
      )}
    </div>
  );
}
