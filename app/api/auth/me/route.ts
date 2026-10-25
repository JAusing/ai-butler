import { getCurrentUser, publicUser, unauthorized } from "@/lib/auth";

// GET /api/auth/me — who is logged in right now.
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorized();
    return Response.json({ user: publicUser(user) });
  } catch (error) {
    console.error("[api/auth/me]", error);
    return Response.json({ error: "讀取失敗" }, { status: 500 });
  }
}
