import { Controller, Get, Req, UnauthorizedException } from "@nestjs/common";
import { ApiCookieAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { ACCESS_COOKIE, AuthService } from "../auth/auth.service";

@ApiTags("students")
@Controller("students")
export class StudentsController {
  constructor(private readonly authService: AuthService) {}

  @Get("profile")
  @ApiCookieAuth(ACCESS_COOKIE)
  @ApiOperation({ summary: "Get the authenticated student profile" })
  getProfile(@Req() request: Request) {
    const cookie = request.headers.cookie
      ?.split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${ACCESS_COOKIE}=`));
    const token = cookie
      ? decodeURIComponent(cookie.slice(ACCESS_COOKIE.length + 1))
      : undefined;
    if (!token) throw new UnauthorizedException("Access token missing");
    return this.authService.getProfile(token);
  }
}
