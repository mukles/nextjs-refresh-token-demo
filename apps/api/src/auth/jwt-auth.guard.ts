import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { AuthService } from "./auth.service";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers.authorization;
    if (!header?.toLowerCase().startsWith("bearer ")) {
      throw new UnauthorizedException("Access token missing");
    }

    const token = header.slice(7).trim();
    request.user = await this.authService.getProfile(token);
    request.accessToken = token;
    return true;
  }
}
