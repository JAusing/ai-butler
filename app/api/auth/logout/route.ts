import { destroySession } from "@/lib/auth";

// POST /api/auth/logout
export async function POST() {
  try {
    await destroySession();
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[api/auth/logout]", error);
    return Response.json({ error: "登出失敗" }, { status: 500 });
  }
}
