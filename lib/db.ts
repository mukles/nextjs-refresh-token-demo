import { prisma } from "@/lib/prisma";
import type { RefreshToken, User } from "@prisma/client";

export type { RefreshToken, User };

export function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } });
}

export function findUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

export function findRefreshToken(token: string): Promise<RefreshToken | null> {
  return prisma.refreshToken.findUnique({ where: { token } });
}

export async function revokeFamily(familyId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({ where: { familyId } });
}
