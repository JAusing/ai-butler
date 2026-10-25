import { z } from "zod";
import { createSession, hashPassword, publicUser, verifyPassword } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";

const bodySchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(128),
});

// Verified against when the email is unknown, so both failures take similar time.
const dummyHash = hashPassword("not-a-real-password");

// POST /api/auth/login
export async function POST(request: Request) {
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return Response.json({ error: "請輸入 email 和密碼" }, { status: 400 });
  }
  const { email, password } = body.data;

  try {
    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase() });
    const ok = await verifyPassword(password, user?.passwordHash ?? (await dummyHash));
    if (!user || !ok) {
      return Response.json({ error: "email 或密碼錯誤" }, { status: 401 });
    }

    await createSession(user._id);
    return Response.json({
      user: publicUser({ _id: user._id, email: user.email, name: user.name, role: user.role }),
    });
  } catch (error) {
    console.error("[api/auth/login]", error);
    return Response.json({ error: "登入失敗" }, { status: 500 });
  }
}
