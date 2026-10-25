"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const TABS = [
  { href: "/", label: "記帳", icon: "📒" },
  { href: "/stats", label: "統計", icon: "📊" },
];

export default function TabBar() {
  const pathname = usePathname();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setName(data?.user?.name ?? null))
      .catch(() => {});
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    window.location.assign("/login");
  }

  return (
    <nav className="grid grid-cols-3 border-t border-zinc-200 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-col items-center gap-0.5 py-2 text-xs ${
              active
                ? "font-semibold text-indigo-500"
                : "text-zinc-400 dark:text-zinc-500"
            }`}
          >
            <span className={`text-xl ${active ? "" : "grayscale"}`}>{tab.icon}</span>
            {tab.label}
          </Link>
        );
      })}
      <button
        onClick={logout}
        className="flex min-w-0 cursor-pointer flex-col items-center gap-0.5 py-2 text-xs text-zinc-400 dark:text-zinc-500"
      >
        <span className="text-xl grayscale">🚪</span>
        <span className="max-w-full truncate px-2">
          登出{name ? `（${name}）` : ""}
        </span>
      </button>
    </nav>
  );
}
