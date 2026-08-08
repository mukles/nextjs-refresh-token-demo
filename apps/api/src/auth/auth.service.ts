import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import type { RefreshToken, User } from "@prisma/client";
import bcrypt from "bcryptjs";
import { decodeJwt, jwtVerify, SignJWT } from "jose";
import type {
  MeResponseDto,
  SendOtpResponseDto,
  StudentProfileResponseDto,
  UserSummaryDto,
} from "./dto/auth-response.dto";
import { RefreshTokenRepository } from "./repositories/refresh-token.repository";
import { SessionRepository } from "./repositories/session.repository";
import { UserRepository } from "./repositories/user.repository";
import {
  accessTokenTtlSeconds,
  refreshTokenTtlSeconds,
  type TokenPair,
} from "./token-config";

/** What {@link JwtAuthGuard} attaches to `request.user`. */
export type AuthenticatedUser = StudentProfileResponseDto;

/** How long a just-rotated token keeps answering concurrent refreshes. */
const REFRESH_GRACE_MS = 10_000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UserRepository,
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly sessions: SessionRepository,
  ) {}

  sendOtp(mobileNumber: string): SendOtpResponseDto {
    return {
      message: `OTP sent to ${mobileNumber}`,
      ...(process.env.NODE_ENV === "production" ? {} : { demoOtp: "123456" }),
    };
  }

  async verifyOtp(
    mobileNumber: string,
    otp: string,
    requestedName?: string,
  ): Promise<{ message: string; tokens: TokenPair }> {
    if (otp !== "123456") {
      throw new UnauthorizedException("Invalid OTP");
    }

    const email = `student-${mobileNumber}@demo.local`;
    const name = requestedName?.trim();
    const existing = await this.users.findByEmail(email);
    if (!existing && !name) {
      throw new UnauthorizedException(
        "Account not found. Please create an account first.",
      );
    }
    if (existing && name) {
      throw new BadRequestException(
        "An account already exists for this number. Please sign in.",
      );
    }
    const user = existing
      ? await this.users.update(existing.id, {
          mobileNumber,
          ...(name ? { name } : {}),
        })
      : await this.users.create({
          email,
          mobileNumber,
          name: name ?? `Customer ${mobileNumber.slice(-4)}`,
          passwordHash: await bcrypt.hash(crypto.randomUUID(), 10),
        });

    return {
      message: "OTP verified successfully",
      tokens: await this.createExclusiveSession(user),
    };
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ user: UserSummaryDto; tokens: TokenPair }> {
    const user = await this.users.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException("Invalid email or password");
    }

    return {
      user: { id: user.id, email: user.email, name: user.name },
      tokens: await this.createExclusiveSession(user),
    };
  }

  async refresh(presentedToken: string): Promise<TokenPair> {
    const record = await this.refreshTokens.findByToken(presentedToken);
    if (!record) throw new UnauthorizedException("Invalid refresh token");
    return this.rotateRefreshToken(record);
  }

  async logout(refreshToken?: string): Promise<void> {
    if (!refreshToken) return;
    const record = await this.refreshTokens.findByToken(refreshToken);
    if (record) {
      await this.sessions.revokeSession(record.userId, record.familyId);
    }
  }

  async getProfile(accessToken: string): Promise<StudentProfileResponseDto> {
    const { subject, sessionId } = await this.verifyAccessToken(accessToken);

    const user = await this.users.findById(subject);
    if (!user) throw new UnauthorizedException("User not found");
    if (user.sessionId !== sessionId) {
      throw new UnauthorizedException({
        error: "This session was replaced by a login on another device",
        code: "SESSION_REPLACED",
      });
    }

    return this.toProfile(user);
  }

  async getMe(accessToken: string): Promise<MeResponseDto> {
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

  async updateProfile(
    userId: string,
    input: { name: string },
  ): Promise<StudentProfileResponseDto> {
    return this.toProfile(await this.users.updateName(userId, input.name));
  }

  private toProfile(user: User): StudentProfileResponseDto {
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

  private async verifyAccessToken(accessToken: string) {
    let subject: string | undefined;
    let sessionId: string | undefined;
    try {
      const { payload } = await jwtVerify(accessToken, this.jwtSecret());
      subject = payload.sub;
      sessionId = typeof payload.sid === "string" ? payload.sid : undefined;
    } catch {
      throw new UnauthorizedException("Access token missing or expired");
    }
    if (!subject || !sessionId) {
      throw new UnauthorizedException("Invalid access token session");
    }
    return { subject, sessionId };
  }

  private async signAccessToken(user: User, sessionId: string) {
    const expiresInSeconds = accessTokenTtlSeconds();
    const token = await new SignJWT({
      email: user.email,
      name: user.name,
      mobile: user.mobileNumber,
      sid: sessionId,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(user.id)
      .setIssuedAt()
      .setExpirationTime(`${expiresInSeconds}s`)
      .sign(this.jwtSecret());
    this.logger.log(`Access token issued; expiresIn=${expiresInSeconds}s`);
    return token;
  }

  private jwtSecret() {
    return new TextEncoder().encode(
      process.env.JWT_SECRET ?? "dev-only-insecure-secret-change-me",
    );
  }

  private async createExclusiveSession(user: User): Promise<TokenPair> {
    const familyId = crypto.randomUUID();
    const refresh = await this.sessions.startExclusiveSession(
      user.id,
      familyId,
      refreshTokenTtlSeconds(),
    );
    return {
      accessToken: await this.signAccessToken(user, refresh.familyId),
      refreshToken: refresh.token,
    };
  }

  private async rotateRefreshToken(record: RefreshToken): Promise<TokenPair> {
    if (record.used) {
      return this.resolveUsedRefreshToken(record);
    }
    if (record.expiresAt.getTime() <= Date.now()) {
      await this.sessions.revokeSession(record.userId, record.familyId);
      throw new UnauthorizedException("Refresh token expired");
    }

    // Create first so a process crash after claiming can never leave concurrent
    // requests pointing at a replacement that does not exist.
    const candidate = await this.refreshTokens.issue(
      record.userId,
      record.familyId,
      refreshTokenTtlSeconds(),
    );
    const claimed = await this.refreshTokens.claim(record.id, candidate.token);
    if (!claimed) {
      // Logout or a newer login may already have deleted the candidate.
      await this.refreshTokens.deleteById(candidate.id);
      const claimedRecord = await this.refreshTokens.findById(record.id);
      if (!claimedRecord) {
        throw new UnauthorizedException("Session is no longer active");
      }
      return this.resolveUsedRefreshToken(claimedRecord);
    }

    const user = await this.users.findById(record.userId);
    if (!user || user.sessionId !== record.familyId) {
      await this.sessions.revokeSession(record.userId, record.familyId);
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
    const withinGrace =
      record.usedAt !== null &&
      Date.now() - record.usedAt.getTime() <= REFRESH_GRACE_MS;

    if (withinGrace && record.replacedByToken) {
      const [replacement, user] = await Promise.all([
        this.refreshTokens.findByToken(record.replacedByToken),
        this.users.findById(record.userId),
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

    await this.sessions.revokeSession(record.userId, record.familyId);
    throw new UnauthorizedException({
      error: "Refresh token reuse detected; session revoked",
      code: "REUSE_DETECTED",
    });
  }
}
