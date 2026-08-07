import { Injectable } from "@nestjs/common";
import type { RefreshToken } from "@prisma/client";
import { PrismaService } from "../../prisma.service";

@Injectable()
export class SessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async startExclusiveSession(
    userId: string,
    familyId: string,
    refreshTtlSeconds: number,
  ): Promise<RefreshToken> {
    const [, , refreshToken] = await this.prisma.$transaction([
      this.prisma.refreshToken.deleteMany({ where: { userId } }),
      this.prisma.user.update({
        where: { id: userId },
        data: { sessionId: familyId },
      }),
      this.prisma.refreshToken.create({
        data: {
          token: `${crypto.randomUUID()}.${crypto.randomUUID()}`,
          familyId,
          userId,
          expiresAt: new Date(Date.now() + refreshTtlSeconds * 1000),
        },
      }),
    ]);
    return refreshToken;
  }

  async revokeSession(userId: string, familyId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.refreshToken.deleteMany({ where: { familyId } }),
      this.prisma.user.updateMany({
        where: { id: userId, sessionId: familyId },
        data: { sessionId: null },
      }),
    ]);
  }
}
