import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import type { Request } from "express";
import { AuthService } from "./auth.service";
import {
  LoginRequestDto,
  RefreshRequestDto,
  SendOtpRequestDto,
  VerifyOtpRequestDto,
} from "./dto/auth-request.dto";
import {
  AuthTokensResponseDto,
  LoginResponseDto,
  LogoutResponseDto,
  MeResponseDto,
  RefreshResponseDto,
  SendOtpResponseDto,
  VerifyOtpResponseDto,
} from "./dto/auth-response.dto";
import { JwtAuthGuard } from "./jwt-auth.guard";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @HttpCode(200)
  @ApiOperation({ summary: "Sign in with email and password" })
  @ApiOkResponse({ type: LoginResponseDto })
  async login(@Body() body: LoginRequestDto): Promise<LoginResponseDto> {
    const result = await this.authService.login(body.email, body.password);
    return { user: result.user, ...AuthTokensResponseDto.from(result.tokens) };
  }

  @Post("send-otp")
  @HttpCode(200)
  @ApiOperation({ summary: "Send a student login OTP" })
  @ApiOkResponse({ type: SendOtpResponseDto })
  sendOtp(@Body() body: SendOtpRequestDto): SendOtpResponseDto {
    return this.authService.sendOtp(body.mobileNumber);
  }

  @Post("verify-otp")
  @HttpCode(200)
  @ApiOperation({ summary: "Verify OTP and create an authenticated session" })
  @ApiOkResponse({ type: VerifyOtpResponseDto })
  async verifyOtp(
    @Body() body: VerifyOtpRequestDto,
  ): Promise<VerifyOtpResponseDto> {
    const result = await this.authService.verifyOtp(
      body.mobileNumber,
      body.otp,
      body.name,
    );
    return {
      success: true,
      message: result.message,
      ...AuthTokensResponseDto.from(result.tokens),
    };
  }

  @Post("refresh")
  @HttpCode(200)
  @ApiOperation({ summary: "Rotate the refresh token" })
  @ApiOkResponse({ type: RefreshResponseDto })
  async refresh(@Body() body: RefreshRequestDto): Promise<RefreshResponseDto> {
    if (!body.refresh_token) {
      throw new UnauthorizedException("No refresh token");
    }
    const tokens = await this.authService.refresh(body.refresh_token);
    return { refreshed: true, ...AuthTokensResponseDto.from(tokens) };
  }

  @Post("logout")
  @HttpCode(200)
  @ApiOperation({ summary: "Revoke the current session" })
  @ApiOkResponse({ type: LogoutResponseDto })
  async logout(@Body() body: RefreshRequestDto): Promise<LogoutResponseDto> {
    await this.authService.logout(body.refresh_token);
    return { ok: true };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get the authenticated student" })
  @ApiOkResponse({ type: MeResponseDto })
  getMe(@Req() request: Request): Promise<MeResponseDto> {
    const token = request.accessToken;
    if (!token) throw new UnauthorizedException("Access token missing");
    return this.authService.getMe(token);
  }
}
