import { z } from "zod";
import { createSession, hashPassword, publicUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";

const bodySchema = z.object({
  email: z.email().max(254),
  password: z.string().min(8).max(128),
  name: z.string().trim().min(1).max(50),
  code: z.string().trim(),
});

// Hardcoded for now: only people who know the code can sign up.
const REGISTER_CODE = "good";

// POST /api/auth/register — role is never taken from the client; new users are "user".
export async function POST(request: Request) {
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return Response.json(
      { error: "請輸入有效的 email、姓名，以及至少 8 碼的密碼" },
      { status: 400 },
    );
  }
  const { email, password, name, code } = body.data;
  if (code !== REGISTER_CODE) {
    return Response.json({ error: "驗證碼錯誤" }, { status: 403 });
  }

  try {
    await connectDB();
    const user = await User.create({
      email,
      name,
      passwordHash: await hashPassword(password),
    });
    await createSession(user._id);
    return Response.json({
      user: publicUser({ _id: user._id, email: user.email, name: user.name, role: user.role }),
    });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      return Response.json({ error: "這個 email 已經註冊過了" }, { status: 409 });
    }
    console.error("[api/auth/register]", error);
    return Response.json({ error: "註冊失敗" }, { status: 500 });
  }
}
