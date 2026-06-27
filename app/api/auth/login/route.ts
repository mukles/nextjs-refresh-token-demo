import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { findUserByEmail } from "@/lib/db";
import { issueRefreshToken } from "@/lib/tokens";
import { setAccessCookie, setRefreshCookie, signAccessToken } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const parsed = loginSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const user = findUserByEmail(parsed.data.email);
  const passwordOk =
    user && (await bcrypt.compare(parsed.data.password, user.passwordHash));

  if (!user || !passwordOk) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  const accessToken = await signAccessToken(user);
  const refresh = issueRefreshToken(user.id);

  const res = NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name },
  });
  setAccessCookie(res, accessToken);
  setRefreshCookie(res, refresh.token);
  return res;
}
