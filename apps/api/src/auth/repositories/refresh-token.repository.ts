import { Injectable } from "@nestjs/common";
import type { RefreshToken } from "@prisma/client";
import { PrismaService } from "../../prisma.service";

function newTokenValue() {
  return `${crypto.randomUUID()}.${crypto.randomUUID()}`;
}

@Injectable()
export class RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByToken(token: string): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findUnique({ where: { token } });
  }

  findById(id: string): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findUnique({ where: { id } });
  }

  issue(
    userId: string,
    familyId: string,
    ttlSeconds: number,
  ): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({
      data: {
        token: newTokenValue(),
        familyId,
        userId,
        expiresAt: new Date(Date.now() + ttlSeconds * 1000),
      },
    });
  }

  async claim(id: string, replacedByToken: string): Promise<boolean> {
    const claimed = await this.prisma.refreshToken.updateMany({
      where: { id, used: false },
      data: { used: true, usedAt: new Date(), replacedByToken },
    });
    return claimed.count === 1;
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({ where: { id } });
  }
}
