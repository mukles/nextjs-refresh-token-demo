import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import { ApiBody, ApiCookieAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
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
    return this.authService.getProfile(this.readAccessToken(request));
  }

  @Patch("profile")
  @ApiCookieAuth(ACCESS_COOKIE)
  @ApiOperation({ summary: "Update the authenticated student profile" })
  @ApiBody({ schema: { example: { name: "Student Name" } } })
  updateProfile(@Req() request: Request, @Body() body: { name?: unknown }) {
    if (typeof body.name !== "string") {
      throw new BadRequestException("Name is required");
    }
    const name = body.name.trim();
    if (name.length < 2 || name.length > 80) {
      throw new BadRequestException("Name must be between 2 and 80 characters");
    }
    return this.authService.updateProfile(this.readAccessToken(request), {
      name,
    });
  }

  private readAccessToken(request: Request): string {
    const cookie = request.headers.cookie
      ?.split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${ACCESS_COOKIE}=`));
    const token = cookie
      ? decodeURIComponent(cookie.slice(ACCESS_COOKIE.length + 1))
      : undefined;
    if (!token) throw new UnauthorizedException("Access token missing");
    return token;
  }
}
