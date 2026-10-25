import { categoryMeta } from "@/lib/categories";
import { card, money } from "@/lib/ui";

interface Props {
  title: string;
  categories: { category: string; amount: number }[];
  total: number;
  loading: boolean;
}

export default function CategoryBreakdown({ title, categories, total, loading }: Props) {
  return (
    <div className={`${card} p-5`}>
      <h2 className="text-sm font-semibold">{title}</h2>
      {categories.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
          {loading ? "載入中…" : "這段期間還沒有支出"}
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-4">
          {categories.map(({ category, amount }) => {
            const meta = categoryMeta(category);
            const pct = total ? (amount / total) * 100 : 0;
            return (
              <li key={category} className="flex items-center gap-3">
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-2xl text-lg ${meta.tint}`}
                >
                  {meta.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-medium">{category}</span>
                    <span className="font-semibold">
                      {money(amount)}
                      <span className="ml-1.5 text-xs font-normal text-zinc-500 dark:text-zinc-400">
                        {Math.round(pct)}%
                      </span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className={`h-full rounded-full ${meta.bar}`}
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
