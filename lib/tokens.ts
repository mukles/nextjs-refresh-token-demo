import { refreshTokens, revokeFamily, type StoredRefreshToken } from "@/lib/db";
import { REFRESH_TOKEN_TTL_SECONDS } from "@/lib/auth";

function generateOpaqueToken(): string {
  return `${crypto.randomUUID()}.${crypto.randomUUID()}`;
}

export function issueRefreshToken(
  userId: string,
  familyId?: string,
): StoredRefreshToken {
  const record: StoredRefreshToken = {
    token: generateOpaqueToken(),
    familyId: familyId ?? crypto.randomUUID(),
    userId,
    used: false,
    expiresAt: Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000,
  };
  refreshTokens.set(record.token, record);
  return record;
}

export type RotationResult =
  | { status: "rotated"; userId: string; next: StoredRefreshToken }
  | { status: "reuse_detected" }
  | { status: "invalid" };

export function rotateRefreshToken(presentedToken: string): RotationResult {
  const record = refreshTokens.get(presentedToken);

  if (!record) return { status: "invalid" };

  if (record.used) {
    revokeFamily(record.familyId);
    return { status: "reuse_detected" };
  }

  if (record.expiresAt < Date.now()) {
    refreshTokens.delete(presentedToken);
    return { status: "invalid" };
  }

  record.used = true;
  const next = issueRefreshToken(record.userId, record.familyId);
  return { status: "rotated", userId: record.userId, next };
}
