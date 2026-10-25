import { money } from "@/lib/ui";

interface Props {
  label: string;
  expense: number;
  income: number;
  count: number;
}

export default function SummaryCard({ label, expense, income, count }: Props) {
  const balance = income - expense;
  return (
    <div className="rounded-3xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 p-5 text-white shadow-lg shadow-violet-500/25">
      <p className="text-sm text-white/80">{label}</p>
      <p className="mt-1 text-4xl font-bold tracking-tight">{money(expense)}</p>
      <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
        <div className="rounded-2xl bg-white/15 px-3 py-2">
          <p className="text-xs text-white/75">收入</p>
          <p className="font-semibold">{money(income)}</p>
        </div>
        <div className="rounded-2xl bg-white/15 px-3 py-2">
          <p className="text-xs text-white/75">結餘</p>
          <p className="font-semibold">
            {balance < 0 ? "-" : ""}
            {money(Math.abs(balance))}
          </p>
        </div>
        <div className="rounded-2xl bg-white/15 px-3 py-2">
          <p className="text-xs text-white/75">筆數</p>
          <p className="font-semibold">{count}</p>
        </div>
      </div>
    </div>
  );
}
