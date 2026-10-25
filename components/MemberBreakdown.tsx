import { card, money } from "@/lib/ui";

interface Props {
  title: string;
  members: { id: string; name: string; amount: number }[];
  total: number;
  loading: boolean;
}

// Avatar + bar colors, cycled by rank so each member keeps a distinct color.
const STYLES = [
  { tint: "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300", bar: "bg-indigo-500" },
  { tint: "bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-500/20 dark:text-fuchsia-300", bar: "bg-fuchsia-500" },
  { tint: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300", bar: "bg-emerald-500" },
  { tint: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300", bar: "bg-amber-500" },
  { tint: "bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-300", bar: "bg-sky-500" },
];

export default function MemberBreakdown({ title, members, total, loading }: Props) {
  return (
    <div className={`${card} p-5`}>
      <h2 className="text-sm font-semibold">{title}</h2>
      {members.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
          {loading ? "載入中…" : "這段期間還沒有支出"}
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-4">
          {members.map(({ id, name, amount }, i) => {
            const style = STYLES[i % STYLES.length];
            const pct = total ? (amount / total) * 100 : 0;
            return (
              <li key={id} className="flex items-center gap-3">
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-2xl text-lg font-bold ${style.tint}`}
                >
                  {Array.from(name)[0]}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="truncate font-medium">{name}</span>
                    <span className="shrink-0 font-semibold">
                      {money(amount)}
                      <span className="ml-1.5 text-xs font-normal text-zinc-500 dark:text-zinc-400">
                        {Math.round(pct)}%
                      </span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className={`h-full rounded-full ${style.bar}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
