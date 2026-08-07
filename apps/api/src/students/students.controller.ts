import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import type { AuthenticatedUser } from "../auth/auth.service";
import { AuthService } from "../auth/auth.service";
import { CurrentUser } from "../auth/current-user.decorator";
import { UpdateProfileRequestDto } from "../auth/dto/auth-request.dto";
import { StudentProfileResponseDto } from "../auth/dto/auth-response.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@ApiTags("students")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("students")
export class StudentsController {
  constructor(private readonly authService: AuthService) {}

  @Get("profile")
  @ApiOperation({ summary: "Get the authenticated student profile" })
  @ApiOkResponse({ type: StudentProfileResponseDto })
  getProfile(
    @CurrentUser() user: AuthenticatedUser,
  ): StudentProfileResponseDto {
    return user;
  }

  @Patch("profile")
  @ApiOperation({ summary: "Update the authenticated student profile" })
  @ApiOkResponse({ type: StudentProfileResponseDto })
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: UpdateProfileRequestDto,
  ): Promise<StudentProfileResponseDto> {
    return this.authService.updateProfile(user._id, { name: body.name });
  }
}
