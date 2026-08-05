import { Injectable, UnauthorizedException } from "@nestjs/common";
import type { RefreshToken, User } from "@prisma/client";
import bcrypt from "bcryptjs";
import { decodeJwt, jwtVerify, SignJWT } from "jose";
import { PrismaService } from "../prisma.service";

export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";
export const ACCESS_TOKEN_TTL_SECONDS = 60;
export const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

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
    const refresh = await this.issueRefreshToken(user.id);
    return {
      body: { message: "OTP verified successfully" },
      tokens: {
        accessToken: await this.signAccessToken(user),
        refreshToken: refresh.token,
      },
    };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const accessToken = await this.signAccessToken(user);
    const refresh = await this.issueRefreshToken(user.id);
    return {
      body: { user: { id: user.id, email: user.email, name: user.name } },
      tokens: { accessToken, refreshToken: refresh.token },
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
      await this.prisma.refreshToken.deleteMany({
        where: { familyId: record.familyId },
      });
    }
  }

  async getProfile(accessToken: string): Promise<StudentProfile> {
    const secret = this.jwtSecret();
    let subject: string | undefined;
    try {
      const { payload } = await jwtVerify(accessToken, secret);
      subject = payload.sub;
    } catch {
      throw new UnauthorizedException("Access token missing or expired");
    }
    if (!subject) throw new UnauthorizedException("Invalid access token");

    const user = await this.prisma.user.findUnique({ where: { id: subject } });
    if (!user) throw new UnauthorizedException("User not found");

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

  private async signAccessToken(user: User) {
    return new SignJWT({
      email: user.email,
      name: user.name,
      mobile: user.mobileNumber,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(user.id)
      .setIssuedAt()
      .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
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
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
      },
    });
  }

  private async rotateLocalRefreshToken(record: RefreshToken) {
    if (record.used) {
      await this.prisma.refreshToken.deleteMany({
        where: { familyId: record.familyId },
      });
      throw new UnauthorizedException({
        error: "Refresh token reuse detected; session revoked",
        code: "REUSE_DETECTED",
      });
    }
    if (record.expiresAt.getTime() <= Date.now()) {
      await this.prisma.refreshToken.delete({ where: { id: record.id } });
      throw new UnauthorizedException("Refresh token expired");
    }

    const [, user] = await Promise.all([
      this.prisma.refreshToken.update({
        where: { id: record.id },
        data: { used: true },
      }),
      this.prisma.user.findUnique({ where: { id: record.userId } }),
    ]);
    if (!user) throw new UnauthorizedException("User not found");

    const next = await this.issueRefreshToken(record.userId, record.familyId);
    return {
      accessToken: await this.signAccessToken(user),
      refreshToken: next.token,
    };
  }
}
