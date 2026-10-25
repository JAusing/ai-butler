import { z } from "zod";
import { analyzeText } from "@/lib/analyze";
import { getCurrentUser, unauthorized } from "@/lib/auth";
import { Entry } from "@/models/Entry";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const bodySchema = z.object({
  text: z.string().trim().min(1).max(500),
  // The user's local date; the server may be in another timezone.
  today: z.string().regex(DATE_RE).optional(),
});

/** Entries are stored at UTC midnight of their calendar date. */
function toDay(value: string | null, fallback: string) {
  for (const candidate of [value, fallback]) {
    if (candidate && DATE_RE.test(candidate)) {
      const date = new Date(`${candidate}T00:00:00.000Z`);
      if (!Number.isNaN(date.getTime())) return date;
    }
  }
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

export async function POST(request: Request) {
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return Response.json({ error: "請提供 1–500 字的 text" }, { status: 400 });
  }
  const { text } = body.data;
  const today = body.data.today ?? new Date().toISOString().slice(0, 10);

  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();

    const analysis = await analyzeText(text, today);
    if (analysis.items.length === 0) {
      return Response.json(
        { error: "無法從文字中辨識出金額", summary: analysis.summary },
        { status: 422 },
      );
    }

    const entries = await Entry.insertMany(
      analysis.items.map((item) => ({
        ...item,
        userId: user._id,
        rawText: text,
        note: analysis.note,
        occurredAt: toDay(item.occurredAt, today),
      })),
    );

    return Response.json({
      summary: analysis.summary,
      note: analysis.note,
      entries,
    });
  } catch (error) {
    console.error("[api/analyze]", error);
    return Response.json({ error: "分析或儲存失敗" }, { status: 500 });
  }
}
