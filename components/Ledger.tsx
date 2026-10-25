"use client";

import { useEffect, useRef, useState } from "react";
import SummaryCard from "@/components/SummaryCard";
import TabBar from "@/components/TabBar";
import { redirectIfUnauthorized } from "@/lib/client-auth";
import { categoryMeta } from "@/lib/categories";
import {
  WEEKDAYS,
  daysInMonth,
  localToday,
  pad,
  shiftMonth,
  weekdayOf,
} from "@/lib/date";
import { card, money } from "@/lib/ui";

interface LedgerEntry {
  _id: string;
  title: string;
  type: "expense" | "income";
  amount: number;
  currency: string;
  category: string;
  merchant: string | null;
  occurredAt: string;
  userName?: string | null;
}

interface AnalyzeResult {
  summary?: string;
  note?: string | null;
  entries?: LedgerEntry[];
  error?: string;
}

interface LoadedMonth {
  month: string;
  entries: LedgerEntry[];
  failed: boolean;
}

const dayOf = (entry: LedgerEntry) => entry.occurredAt.slice(0, 10);

async function fetchMonth(month: string): Promise<LedgerEntry[]> {
  const res = await fetch(`/api/entries?month=${month}`);
  if (redirectIfUnauthorized(res) || !res.ok) throw new Error("load failed");
  return (await res.json()).entries;
}

export default function Ledger() {
  const today = localToday();
  const [selected, setSelected] = useState(today);
  const [loaded, setLoaded] = useState<LoadedMonth | null>(null);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  const month = selected.slice(0, 7);
  const loading = loaded?.month !== month;
  const entries = loaded?.month === month ? loaded.entries : [];
  const failed = !loading && loaded?.failed;

  useEffect(() => {
    let cancelled = false;
    fetchMonth(month)
      .then((entries) => {
        if (!cancelled) setLoaded({ month, entries, failed: false });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ month, entries: [], failed: true });
      });
    return () => {
      cancelled = true;
    };
  }, [month]);

  useEffect(() => {
    stripRef.current
      ?.querySelector('[data-selected="true"]')
      ?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [selected, loaded?.month]);

  const expenses = entries.filter((e) => e.type === "expense");
  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalIncome = entries
    .filter((e) => e.type === "income")
    .reduce((sum, e) => sum + e.amount, 0);

  const daysWithEntries = new Set(entries.map(dayOf));
  const dayEntries = entries.filter((e) => dayOf(e) === selected);
  const dayExpense = dayEntries
    .filter((e) => e.type === "expense")
    .reduce((sum, e) => sum + e.amount, 0);

  const [year, monthNum] = month.split("-").map(Number);
  const dayCount = daysInMonth(month);
  const [, selMonth, selDay] = selected.split("-").map(Number);

  function goMonth(delta: number) {
    const target = shiftMonth(month, delta);
    setSelected(target === today.slice(0, 7) ? today : `${target}-01`);
  }

  async function submit(e: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    e.preventDefault();
    const value = text.trim();
    if (!value || submitting) return;
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: value, today }),
      });
      if (redirectIfUnauthorized(res)) return;
      const data: AnalyzeResult = await res.json();
      setResult(data);
      if (res.ok && data.entries?.length) {
        const first = dayOf(data.entries[0]);
        setText("");
        setSelected(first);
        const m = first.slice(0, 7);
        setLoaded({ month: m, entries: await fetchMonth(m), failed: false });
      }
    } catch {
      setResult({ error: "網路錯誤，請再試一次" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col bg-zinc-50 dark:bg-zinc-950">
      <div className="flex-1 pb-64">
        <header className="flex items-center justify-between px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-3">
          <button
            onClick={() => goMonth(-1)}
            aria-label="上個月"
            className="flex size-10 items-center justify-center rounded-full bg-white text-lg shadow-sm ring-1 ring-black/5 active:scale-95 dark:bg-zinc-900 dark:ring-white/10"
          >
            ‹
          </button>
          <div className="text-center">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">AI記帳本</p>
            <h1 className="text-lg font-bold">
              {year} 年 {monthNum} 月
            </h1>
          </div>
          <button
            onClick={() => goMonth(1)}
            aria-label="下個月"
            className="flex size-10 items-center justify-center rounded-full bg-white text-lg shadow-sm ring-1 ring-black/5 active:scale-95 dark:bg-zinc-900 dark:ring-white/10"
          >
            ›
          </button>
        </header>

        <section className="px-5">
          <SummaryCard
            label="本月支出"
            expense={totalExpense}
            income={totalIncome}
            count={entries.length}
          />
        </section>

        <nav className="sticky top-0 z-10 mt-4 bg-zinc-50/85 py-3 backdrop-blur dark:bg-zinc-950/85">
          <div
            ref={stripRef}
            className="no-scrollbar flex snap-x gap-2 overflow-x-auto px-5"
          >
            {Array.from({ length: dayCount }, (_, i) => {
              const date = `${month}-${pad(i + 1)}`;
              const isSelected = date === selected;
              return (
                <button
                  key={date}
                  data-selected={isSelected}
                  onClick={() => setSelected(date)}
                  className={`relative flex w-12 shrink-0 snap-center flex-col items-center rounded-2xl py-2 transition active:scale-95 ${
                    isSelected
                      ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/30"
                      : "bg-white text-zinc-700 ring-1 ring-black/5 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-white/10"
                  } ${date === today && !isSelected ? "ring-2 ring-indigo-400" : ""}`}
                >
                  <span
                    className={`text-[11px] ${isSelected ? "text-white/80" : "text-zinc-400"}`}
                  >
                    {WEEKDAYS[weekdayOf(date)]}
                  </span>
                  <span className="text-base font-bold">{i + 1}</span>
                  <span
                    className={`mt-0.5 size-1.5 rounded-full ${
                      daysWithEntries.has(date)
                        ? isSelected
                          ? "bg-white"
                          : "bg-fuchsia-400"
                        : "bg-transparent"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </nav>

        <section className="px-5">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-semibold">
              {selMonth} 月 {selDay} 日 週{WEEKDAYS[weekdayOf(selected)]}
              {selected === today && (
                <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
                  今天
                </span>
              )}
            </h2>
            {dayExpense > 0 && (
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                支出 {money(dayExpense)}
              </span>
            )}
          </div>

          {failed ? (
            <p className="py-10 text-center text-sm text-red-500">
              讀取失敗，請稍後再試
            </p>
          ) : dayEntries.length === 0 ? (
            <div className="py-12 text-center text-zinc-400">
              <p className="text-4xl">{loading ? "⏳" : "🌱"}</p>
              <p className="mt-2 text-sm">
                {loading ? "載入中…" : "這天還沒有記帳，在下方輸入一句話就能新增"}
              </p>
            </div>
          ) : (
            <ul className={`${card} divide-y divide-zinc-100 dark:divide-zinc-800`}>
              {dayEntries.map((entry) => {
                const meta = categoryMeta(entry.category);
                return (
                  <li key={entry._id} className="flex items-center gap-3 px-4 py-3.5">
                    <span
                      className={`flex size-11 shrink-0 items-center justify-center rounded-2xl text-xl ${meta.tint}`}
                    >
                      {meta.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{entry.title || "（無標題）"}</p>
                      <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {entry.category}
                        {entry.merchant ? ` · ${entry.merchant}` : ""}
                      </p>
                      <p className="truncate text-xs text-indigo-500 dark:text-indigo-300">
                        👤 {entry.userName ?? "未知"}
                      </p>
                    </div>
                    <span
                      className={`font-semibold tabular-nums ${
                        entry.type === "income" ? "text-emerald-500" : ""
                      }`}
                    >
                      {entry.type === "income" ? "+" : "-"}
                      {money(entry.amount)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-md">
        <div className="px-4 pb-2">
        {result && (
          <div className={`${card} mb-2 p-4 text-sm shadow-lg`}>
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                {result.error ? (
                  <p className="text-red-500">{result.error}</p>
                ) : (
                  <>
                    <p>{result.summary}</p>
                    {result.note && (
                      <p className="mt-1 truncate text-zinc-500 dark:text-zinc-400">
                        備註：{result.note}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      共 {result.entries?.length ?? 0} 筆
                    </p>
                  </>
                )}
              </div>
              <button
                onClick={() => setResult(null)}
                aria-label="關閉"
                className="text-zinc-400"
              >
                ✕
              </button>
            </div>
          </div>
        )}
        <form
          onSubmit={submit}
          className="flex items-center gap-2 rounded-full bg-white p-1.5 pl-5 shadow-xl ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10"
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
            enterKeyHint="send"
            placeholder="例如：午餐牛肉麵 200，晚餐茶葉蛋 10"
            className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-zinc-400"
          />
          <button
            type="submit"
            disabled={submitting || !text.trim()}
            className="shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition active:scale-95 disabled:opacity-40"
          >
            {submitting ? "分析中…" : "記一筆"}
          </button>
        </form>
        </div>
        <TabBar />
      </div>
    </div>
  );
}
