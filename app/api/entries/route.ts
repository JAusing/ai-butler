import { getCurrentUser, unauthorized } from "@/lib/auth";
import { Entry } from "@/models/Entry";
import "@/models/User"; // registers the model that populate("userId") needs

const MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;

// GET /api/entries?month=YYYY-MM — all entries whose date falls in that month.
export async function GET(request: Request) {
  const month = new URL(request.url).searchParams.get("month");
  const match = month ? MONTH_RE.exec(month) : null;
  if (!match) {
    return Response.json({ error: "month 格式必須是 YYYY-MM" }, { status: 400 });
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1));

  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    // The ledger is shared: every logged-in user sees everyone's entries.
    const docs = await Entry.find({ occurredAt: { $gte: start, $lt: end } })
      .sort({ occurredAt: 1, createdAt: 1 })
      .select("userId title type amount currency category merchant occurredAt note")
      .populate<{ userId: { name: string } | null }>("userId", "name")
      .lean();
    // userId is required on every entry; userName is only null if that user was deleted.
    const entries = docs.map(({ userId, ...entry }) => ({
      ...entry,
      userName: userId?.name ?? null,
    }));
    return Response.json({ entries });
  } catch (error) {
    console.error("[api/entries]", error);
    return Response.json({ error: "讀取失敗" }, { status: 500 });
  }
}
