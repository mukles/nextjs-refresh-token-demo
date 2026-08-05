import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import {
  ApiBody,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import type { Request, Response } from "express";
import {
  ACCESS_COOKIE,
  accessTokenTtlSeconds,
  AuthService,
  REFRESH_COOKIE,
  refreshTokenTtlSeconds,
} from "./auth.service";

type Credentials = { email?: string; password?: string };
type OtpRequest = { mobileNumber?: string; otp?: string };

function readCookie(request: Request, name: string): string | undefined {
  const cookie = request.headers.cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : undefined;
}

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @HttpCode(200)
  @ApiOperation({ summary: "Sign in with email and password" })
  async login(
    @Body() body: Credentials,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!body.email || !body.password) {
      throw new BadRequestException("Email and password are required");
    }
    const result = await this.authService.login(body.email, body.password);
    this.setAuthCookies(response, result.tokens);
    return result.body;
  }

  @Post("send-otp")
  @HttpCode(200)
  @ApiOperation({ summary: "Send a student login OTP" })
  @ApiBody({ schema: { example: { mobileNumber: "01XXXXXXXXX" } } })
  sendOtp(@Body() body: OtpRequest) {
    if (!body.mobileNumber) {
      throw new BadRequestException("mobileNumber is required");
    }
    return this.authService.sendOtp(body.mobileNumber);
  }

  @Post("verify-otp")
  @HttpCode(200)
  @ApiOperation({ summary: "Verify OTP and create an authenticated session" })
  async verifyOtp(
    @Body() body: OtpRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!body.mobileNumber || !body.otp) {
      throw new BadRequestException("mobileNumber and otp are required");
    }
    const result = await this.authService.verifyOtp(
      body.mobileNumber,
      body.otp,
    );
    this.setAuthCookies(response, result.tokens);
    return { success: true, message: result.body.message };
  }

  @Post("refresh")
  @HttpCode(200)
  @ApiCookieAuth(REFRESH_COOKIE)
  @ApiOperation({ summary: "Rotate the refresh token" })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = readCookie(request, REFRESH_COOKIE);
    if (!refreshToken) {
      this.clearAuthCookies(response);
      throw new UnauthorizedException("No refresh token");
    }
    try {
      const tokens = await this.authService.refresh(refreshToken);
      this.setAuthCookies(response, tokens);
      return { refreshed: true };
    } catch (error) {
      this.clearAuthCookies(response);
      throw error;
    }
  }

  @Post("logout")
  @HttpCode(200)
  @ApiOperation({ summary: "Revoke and clear the current session" })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.authService.logout(readCookie(request, REFRESH_COOKIE));
    this.clearAuthCookies(response);
    return { ok: true };
  }

  @Get("session")
  @ApiOkResponse({
    schema: {
      example: { hasAccessToken: true, hasRefreshToken: true },
    },
  })
  session(@Req() request: Request) {
    return {
      hasAccessToken: Boolean(readCookie(request, ACCESS_COOKIE)),
      hasRefreshToken: Boolean(readCookie(request, REFRESH_COOKIE)),
    };
  }

  @Get("me")
  @ApiCookieAuth(ACCESS_COOKIE)
  @ApiOperation({ summary: "Get the authenticated student" })
  getMe(@Req() request: Request) {
    const token = readCookie(request, ACCESS_COOKIE);
    if (!token) throw new UnauthorizedException("Access token missing");
    return this.authService.getMe(token);
  }

  private setAuthCookies(
    response: Response,
    tokens: {
      accessToken: string;
      refreshToken: string;
    },
  ) {
    const secure = process.env.NODE_ENV === "production";
    response.cookie(ACCESS_COOKIE, tokens.accessToken, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: accessTokenTtlSeconds() * 1000,
    });
    response.cookie(REFRESH_COOKIE, tokens.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: refreshTokenTtlSeconds() * 1000,
    });
  }

  private clearAuthCookies(response: Response) {
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
    };
    response.clearCookie(ACCESS_COOKIE, options);
    response.clearCookie(REFRESH_COOKIE, options);
  }
}
