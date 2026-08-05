import { Injectable, UnauthorizedException } from "@nestjs/common";
import type { RefreshToken, User } from "@prisma/client";
import bcrypt from "bcryptjs";
import { decodeJwt, jwtVerify, SignJWT } from "jose";
import { PrismaService } from "../prisma.service";

export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";

function positiveSeconds(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function accessTokenTtlSeconds(): number {
  return positiveSeconds(process.env.ACCESS_TOKEN_TTL_SECONDS, 60);
}

export function refreshTokenTtlSeconds(): number {
  return positiveSeconds(
    process.env.REFRESH_TOKEN_TTL_SECONDS,
    60 * 60 * 24 * 7,
  );
}

export function refreshTokenGraceSeconds(): number {
  return positiveSeconds(process.env.REFRESH_TOKEN_GRACE_SECONDS, 10);
}

type TokenPair = { accessToken: string; refreshToken: string };
type StudentProfile = {
  _id: string;
  name: string;
  mobileNumber: string;
  [key: string]: unknown;
};

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  sendOtp(mobileNumber: string) {
    return {
      message: `OTP sent to ${mobileNumber}`,
      ...(process.env.NODE_ENV === "production" ? {} : { demoOtp: "123456" }),
    };
  }

  async verifyOtp(mobileNumber: string, otp: string) {
    if (otp !== "123456") {
      throw new UnauthorizedException("Invalid OTP");
    }

    const email = `student-${mobileNumber}@demo.local`;
    const existing = await this.prisma.user.findUnique({ where: { email } });
    const user = existing
      ? await this.prisma.user.update({
          where: { id: existing.id },
          data: { mobileNumber },
        })
      : await this.prisma.user.create({
          data: {
            email,
            mobileNumber,
            name: `Student ${mobileNumber.slice(-4)}`,
            passwordHash: await bcrypt.hash(crypto.randomUUID(), 10),
          },
        });
    const tokens = await this.createExclusiveSession(user);
    return {
      body: { message: "OTP verified successfully" },
      tokens,
    };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const tokens = await this.createExclusiveSession(user);
    return {
      body: { user: { id: user.id, email: user.email, name: user.name } },
      tokens,
    };
  }

  async refresh(presentedToken: string): Promise<TokenPair> {
    const localRecord = await this.prisma.refreshToken.findUnique({
      where: { token: presentedToken },
    });

    if (!localRecord) throw new UnauthorizedException("Invalid refresh token");
    return this.rotateLocalRefreshToken(localRecord);
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) return;
    const record = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });
    if (record) {
      await this.invalidateSession(record.userId, record.familyId);
    }
  }

  async getProfile(accessToken: string): Promise<StudentProfile> {
    const secret = this.jwtSecret();
    let subject: string | undefined;
    let sessionId: string | undefined;
    try {
      const { payload } = await jwtVerify(accessToken, secret);
      subject = payload.sub;
      sessionId = typeof payload.sid === "string" ? payload.sid : undefined;
    } catch {
      throw new UnauthorizedException("Access token missing or expired");
    }
    if (!subject || !sessionId) {
      throw new UnauthorizedException("Invalid access token session");
    }

    const user = await this.prisma.user.findUnique({ where: { id: subject } });
    if (!user) throw new UnauthorizedException("User not found");
    if (user.sessionId !== sessionId) {
      throw new UnauthorizedException({
        error: "This session was replaced by a login on another device",
        code: "SESSION_REPLACED",
      });
    }

    return {
      _id: user.id,
      name: user.name,
      mobileNumber: user.mobileNumber ?? user.email,
      mobileVerified: Boolean(user.mobileNumber),
      image: null,
      profileCompleted: Boolean(user.mobileNumber),
      isActive: true,
      gender: "Not specified",
      address: {},
      institution: null,
      activeClass: null,
      class: [],
      trial: null,
    };
  }

  async getMe(accessToken: string) {
    const profile = await this.getProfile(accessToken);
    const claims = decodeJwt(accessToken);
    return {
      user: {
        id: profile._id,
        name: profile.name,
        mobile: profile.mobileNumber,
      },
      accessTokenExpiresAt: claims.exp
        ? new Date(claims.exp * 1000).toISOString()
        : null,
    };
  }

  private async signAccessToken(user: User, sessionId: string) {
    return new SignJWT({
      email: user.email,
      name: user.name,
      mobile: user.mobileNumber,
      sid: sessionId,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(user.id)
      .setIssuedAt()
      .setExpirationTime(`${accessTokenTtlSeconds()}s`)
      .sign(this.jwtSecret());
  }

  private jwtSecret() {
    return new TextEncoder().encode(
      process.env.JWT_SECRET ?? "dev-only-insecure-secret-change-me",
    );
  }

  private issueRefreshToken(
    userId: string,
    familyId: string = crypto.randomUUID(),
  ): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({
      data: {
        token: `${crypto.randomUUID()}.${crypto.randomUUID()}`,
        familyId,
        userId,
        expiresAt: new Date(Date.now() + refreshTokenTtlSeconds() * 1000),
      },
    });
  }

  private async createExclusiveSession(user: User): Promise<TokenPair> {
    const familyId = crypto.randomUUID();
    const [, , refresh] = await this.prisma.$transaction([
      this.prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { sessionId: familyId },
      }),
      this.prisma.refreshToken.create({
        data: {
          token: `${crypto.randomUUID()}.${crypto.randomUUID()}`,
          familyId,
          userId: user.id,
          expiresAt: new Date(Date.now() + refreshTokenTtlSeconds() * 1000),
        },
      }),
    ]);
    return {
      accessToken: await this.signAccessToken(user, refresh.familyId),
      refreshToken: refresh.token,
    };
  }

  private async rotateLocalRefreshToken(record: RefreshToken) {
    if (record.used) {
      return this.resolveUsedRefreshToken(record);
    }
    if (record.expiresAt.getTime() <= Date.now()) {
      await this.invalidateSession(record.userId, record.familyId);
      throw new UnauthorizedException("Refresh token expired");
    }

    // Create first so a process crash after claiming can never leave concurrent
    // requests pointing at a replacement that does not exist.
    const candidate = await this.issueRefreshToken(
      record.userId,
      record.familyId,
    );
    const usedAt = new Date();
    const claimed = await this.prisma.refreshToken.updateMany({
      where: { id: record.id, used: false },
      data: {
        used: true,
        usedAt,
        replacedByToken: candidate.token,
      },
    });
    if (claimed.count !== 1) {
      // Logout or a newer login may already have deleted the candidate.
      await this.prisma.refreshToken.deleteMany({
        where: { id: candidate.id },
      });
      const claimedRecord = await this.prisma.refreshToken.findUnique({
        where: { id: record.id },
      });
      if (!claimedRecord) {
        throw new UnauthorizedException("Session is no longer active");
      }
      return this.resolveUsedRefreshToken(claimedRecord);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: record.userId },
    });
    if (!user || user.sessionId !== record.familyId) {
      await this.invalidateSession(record.userId, record.familyId);
      throw new UnauthorizedException("Session is no longer active");
    }

    return {
      accessToken: await this.signAccessToken(user, record.familyId),
      refreshToken: candidate.token,
    };
  }

  private async resolveUsedRefreshToken(
    record: RefreshToken,
  ): Promise<TokenPair> {
    const graceMilliseconds = refreshTokenGraceSeconds() * 1000;
    const withinGrace =
      record.usedAt !== null &&
      Date.now() - record.usedAt.getTime() <= graceMilliseconds;

    if (withinGrace && record.replacedByToken) {
      const [replacement, user] = await Promise.all([
        this.prisma.refreshToken.findUnique({
          where: { token: record.replacedByToken },
        }),
        this.prisma.user.findUnique({ where: { id: record.userId } }),
      ]);
      if (
        replacement &&
        !replacement.used &&
        replacement.expiresAt.getTime() > Date.now() &&
        user?.sessionId === record.familyId
      ) {
        return {
          accessToken: await this.signAccessToken(user, record.familyId),
          refreshToken: replacement.token,
        };
      }
    }

    await this.invalidateSession(record.userId, record.familyId);
    throw new UnauthorizedException({
      error: "Refresh token reuse detected; session revoked",
      code: "REUSE_DETECTED",
    });
  }

  private async invalidateSession(userId: string, familyId: string) {
    await this.prisma.$transaction([
      this.prisma.refreshToken.deleteMany({ where: { familyId } }),
      this.prisma.user.updateMany({
        where: { id: userId, sessionId: familyId },
        data: { sessionId: null },
      }),
    ]);
  }
}
