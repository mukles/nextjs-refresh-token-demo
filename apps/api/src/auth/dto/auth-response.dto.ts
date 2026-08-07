import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class AuthTokensResponseDto {
  @ApiProperty({ example: "Bearer" }) token_type!: string;
  @ApiProperty() access_token!: string;
  @ApiProperty() refresh_token!: string;
  @ApiProperty({ example: 60, description: "Access token lifetime in seconds" })
  expires_in!: number;
}

export class UserSummaryDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional() email?: string;
  @ApiPropertyOptional() mobile?: string;
}

export class LoginResponseDto extends AuthTokensResponseDto {
  @ApiProperty({ type: UserSummaryDto }) user!: UserSummaryDto;
}

export class VerifyOtpResponseDto extends AuthTokensResponseDto {
  @ApiProperty({ example: true }) success!: boolean;
  @ApiProperty({ example: "OTP verified successfully" }) message!: string;
}

export class RefreshResponseDto extends AuthTokensResponseDto {
  @ApiProperty({ example: true }) refreshed!: boolean;
}

export class SendOtpResponseDto {
  @ApiProperty({ example: "OTP sent to 01712345678" }) message!: string;
  @ApiPropertyOptional({
    example: "123456",
    description: "Only present outside production.",
  })
  demoOtp?: string;
}

export class LogoutResponseDto {
  @ApiProperty({ example: true }) ok!: boolean;
}

export class MeResponseDto {
  @ApiProperty({ type: UserSummaryDto }) user!: UserSummaryDto;
  @ApiProperty({ type: String, nullable: true })
  accessTokenExpiresAt!: string | null;
}

export class StudentProfileResponseDto {
  @ApiProperty() _id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() mobileNumber!: string;
  @ApiProperty() mobileVerified!: boolean;
  @ApiProperty({ type: String, nullable: true }) image!: string | null;
  @ApiProperty() profileCompleted!: boolean;
  @ApiProperty() isActive!: boolean;
  @ApiProperty() gender!: string;
  @ApiProperty({ type: Object }) address!: Record<string, unknown>;
  @ApiProperty({ type: String, nullable: true }) institution!: string | null;
  @ApiProperty({ type: String, nullable: true }) activeClass!: string | null;
  @ApiProperty({ type: [String] }) class!: string[];
  @ApiProperty({ type: String, nullable: true }) trial!: string | null;
}
