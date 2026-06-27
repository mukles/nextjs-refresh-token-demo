import { prisma } from "@/lib/prisma";
import { findRefreshToken, revokeFamily, type RefreshToken } from "@/lib/db";
import { REFRESH_TOKEN_TTL_SECONDS } from "@/lib/auth";

function generateOpaqueToken(): string {
  return `${crypto.randomUUID()}.${crypto.randomUUID()}`;
}

export function issueRefreshToken(
  userId: string,
  familyId?: string,
): Promise<RefreshToken> {
  return prisma.refreshToken.create({
    data: {
      token: generateOpaqueToken(),
      familyId: familyId ?? crypto.randomUUID(),
      userId,
      used: false,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
    },
  });
}

export type RotationResult =
  | { status: "rotated"; userId: string; next: RefreshToken }
  | { status: "reuse_detected" }
  | { status: "invalid" };

export async function rotateRefreshToken(
  presentedToken: string,
): Promise<RotationResult> {
  const record = await findRefreshToken(presentedToken);

  if (!record) return { status: "invalid" };

  if (record.used) {
    await revokeFamily(record.familyId);
    return { status: "reuse_detected" };
  }

  if (record.expiresAt.getTime() < Date.now()) {
    await prisma.refreshToken.delete({ where: { token: presentedToken } });
    return { status: "invalid" };
  }

  await prisma.refreshToken.update({
    where: { token: presentedToken },
    data: { used: true },
  });
  const next = await issueRefreshToken(record.userId, record.familyId);
  return { status: "rotated", userId: record.userId, next };
}
