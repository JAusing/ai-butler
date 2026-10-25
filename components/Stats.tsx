"use client";

import { useEffect, useState } from "react";
import CategoryBreakdown from "@/components/CategoryBreakdown";
import MemberBreakdown from "@/components/MemberBreakdown";
import SummaryCard from "@/components/SummaryCard";
import TabBar from "@/components/TabBar";
import { redirectIfUnauthorized } from "@/lib/client-auth";
import { localToday, pad, shiftMonth } from "@/lib/date";
import { card, money } from "@/lib/ui";

interface StatsData {
  totalExpense: number;
  totalIncome: number;
  count: number;
  categories: { category: string; amount: number }[];
  members: { id: string; name: string; amount: number }[];
  months?: { month: number; expense: number; income: number }[];
}

type Mode = "month" | "year";

const compact = (n: number) =>
  n >= 10000 ? `${+(n / 10000).toFixed(1)}萬` : String(n);

const navButton =
  "flex size-10 items-center justify-center rounded-full bg-white text-lg shadow-sm ring-1 ring-black/5 active:scale-95 dark:bg-zinc-900 dark:ring-white/10";

export default function Stats() {
  const today = localToday();
  const [mode, setMode] = useState<Mode>("month");
  const [month, setMonth] = useState(today.slice(0, 7));
  const [loaded, setLoaded] = useState<{ key: string; data: StatsData | null } | null>(
    null,
  );

  const year = month.slice(0, 4);
  const monthNum = Number(month.slice(5));
  const key = mode === "month" ? month : year;
  const loading = loaded?.key !== key;
  const data = loading ? null : loaded.data;
  const failed = !loading && !data;

  useEffect(() => {
    let cancelled = false;
    const query = mode === "month" ? `month=${key}` : `year=${key}`;
    fetch(`/api/stats?${query}`)
      .then((res) => {
        if (redirectIfUnauthorized(res) || !res.ok) throw new Error("load failed");
        return res.json() as Promise<StatsData>;
      })
      .then((result) => {
        if (!cancelled) setLoaded({ key, data: result });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ key, data: null });
      });
    return () => {
      cancelled = true;
    };
  }, [mode, key]);

  const isCurrent =
    mode === "month" ? month === today.slice(0, 7) : year === today.slice(0, 4);
  const periodLabel = mode === "month" ? `${year} 年 ${monthNum} 月` : `${year} 年`;
  const summaryLabel =
    mode === "month"
      ? isCurrent
        ? "本月支出"
        : `${monthNum} 月支出`
      : isCurrent
        ? "本年支出"
        : `${year} 年支出`;

  const months = data?.months ?? [];
  const maxExpense = Math.max(1, ...months.map((m) => m.expense));
  const currentMonthNum =
    year === today.slice(0, 4) ? Number(today.slice(5, 7)) : null;

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col bg-zinc-50 dark:bg-zinc-950">
      <div className="flex-1 pb-28">
        <header className="px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-3">
          <div className="mx-auto flex w-40 rounded-full bg-zinc-200 p-1 text-sm font-medium dark:bg-zinc-800">
            {(["month", "year"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 rounded-full py-1.5 transition ${
                  mode === m
                    ? "bg-white shadow-sm dark:bg-zinc-700"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                {m === "month" ? "月" : "年"}
              </button>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={() => setMonth(shiftMonth(month, mode === "month" ? -1 : -12))}
              aria-label="上一期"
              className={navButton}
            >
              ‹
            </button>
            <div className="text-center">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">統計</p>
              <h1 className="text-lg font-bold">{periodLabel}</h1>
            </div>
            <button
              onClick={() => setMonth(shiftMonth(month, mode === "month" ? 1 : 12))}
              aria-label="下一期"
              className={navButton}
            >
              ›
            </button>
          </div>
        </header>

        <div className="flex flex-col gap-4 px-5">
          {failed ? (
            <p className="py-10 text-center text-sm text-red-500">
              讀取失敗，請稍後再試
            </p>
          ) : (
            <>
              <SummaryCard
                label={summaryLabel}
                expense={data?.totalExpense ?? 0}
                income={data?.totalIncome ?? 0}
                count={data?.count ?? 0}
              />

              {mode === "year" && (
                <div className={`${card} p-5`}>
                  <h2 className="text-sm font-semibold">每月支出</h2>
                  <div className="mt-4 flex h-40 items-end gap-1">
                    {Array.from({ length: 12 }, (_, i) => {
                      const m = months[i] ?? { month: i + 1, expense: 0, income: 0 };
                      const active = m.month === currentMonthNum;
                      return (
                        <button
                          key={m.month}
                          onClick={() => {
                            setMonth(`${year}-${pad(m.month)}`);
                            setMode("month");
                          }}
                          aria-label={`${m.month} 月，支出 ${money(m.expense)}`}
                          className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
                        >
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                            {m.expense > 0 ? compact(m.expense) : ""}
                          </span>
                          <span
                            className={`w-full rounded-t-lg ${
                              active
                                ? "bg-gradient-to-t from-indigo-500 to-fuchsia-500"
                                : "bg-indigo-200 dark:bg-indigo-500/40"
                            }`}
                            style={{
                              height: m.expense > 0 ? `${Math.max(4, (m.expense / maxExpense) * 100)}%` : "2px",
                              opacity: m.expense > 0 ? 1 : 0.4,
                            }}
                          />
                          <span
                            className={`text-[11px] ${
                              active ? "font-bold text-indigo-500" : "text-zinc-400"
                            }`}
                          >
                            {m.month}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-xs text-zinc-400">點某個月可以看該月統計</p>
                </div>
              )}

              <MemberBreakdown
                title={mode === "month" ? "各成員花費" : "全年各成員花費"}
                members={data?.members ?? []}
                total={data?.totalExpense ?? 0}
                loading={loading}
              />

              <CategoryBreakdown
                title={mode === "month" ? "各項目花費" : "全年各項目花費"}
                categories={data?.categories ?? []}
                total={data?.totalExpense ?? 0}
                loading={loading}
              />
            </>
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-md">
        <TabBar />
      </div>
    </div>
  );
}
