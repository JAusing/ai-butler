import { getCurrentUser, unauthorized } from "@/lib/auth";
import { Entry } from "@/models/Entry";
import { User } from "@/models/User";

const MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;
const YEAR_RE = /^\d{4}$/;

interface StatsAggregate {
  totals: { _id: "expense" | "income"; amount: number; count: number }[];
  byCategory: { _id: string; amount: number }[];
  byMember: { _id: string; amount: number; user: { name: string }[] }[];
  byMonth: { _id: { month: number; type: "expense" | "income" }; amount: number }[];
}

// GET /api/stats?month=YYYY-MM  or  /api/stats?year=YYYY
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const month = params.get("month");
  const year = params.get("year");

  let start: Date;
  let end: Date;
  const monthMatch = month ? MONTH_RE.exec(month) : null;
  if (monthMatch) {
    const y = Number(monthMatch[1]);
    const m = Number(monthMatch[2]) - 1;
    start = new Date(Date.UTC(y, m, 1));
    end = new Date(Date.UTC(y, m + 1, 1));
  } else if (year && YEAR_RE.test(year)) {
    start = new Date(Date.UTC(Number(year), 0, 1));
    end = new Date(Date.UTC(Number(year) + 1, 0, 1));
  } else {
    return Response.json(
      { error: "請提供 month=YYYY-MM 或 year=YYYY" },
      { status: 400 },
    );
  }

  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const [agg] = await Entry.aggregate<StatsAggregate>([
      // Shared ledger: stats cover everyone's entries.
      { $match: { occurredAt: { $gte: start, $lt: end } } },
      {
        $facet: {
          totals: [
            { $group: { _id: "$type", amount: { $sum: "$amount" }, count: { $sum: 1 } } },
          ],
          byCategory: [
            { $match: { type: "expense" } },
            { $group: { _id: "$category", amount: { $sum: "$amount" } } },
            { $sort: { amount: -1 } },
          ],
          byMember: [
            { $match: { type: "expense" } },
            { $group: { _id: "$userId", amount: { $sum: "$amount" } } },
            { $sort: { amount: -1 } },
            {
              $lookup: {
                from: User.collection.name,
                localField: "_id",
                foreignField: "_id",
                as: "user",
              },
            },
          ],
          byMonth: [
            {
              $group: {
                _id: { month: { $month: "$occurredAt" }, type: "$type" },
                amount: { $sum: "$amount" },
              },
            },
          ],
        },
      },
    ]);

    const expense = agg.totals.find((t) => t._id === "expense");
    const income = agg.totals.find((t) => t._id === "income");

    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      expense: 0,
      income: 0,
    }));
    for (const row of agg.byMonth) {
      months[row._id.month - 1][row._id.type] = row.amount;
    }

    return Response.json({
      totalExpense: expense?.amount ?? 0,
      totalIncome: income?.amount ?? 0,
      count: (expense?.count ?? 0) + (income?.count ?? 0),
      categories: agg.byCategory.map((c) => ({ category: c._id, amount: c.amount })),
      members: agg.byMember.map((m) => ({
        id: String(m._id),
        name: m.user[0]?.name ?? "未知",
        amount: m.amount,
      })),
      ...(monthMatch ? {} : { months }),
    });
  } catch (error) {
    console.error("[api/stats]", error);
    return Response.json({ error: "統計失敗" }, { status: 500 });
  }
}
