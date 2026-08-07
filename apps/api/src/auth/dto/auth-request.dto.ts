import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from "class-validator";

const trim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

export class LoginRequestDto {
  @ApiProperty({ example: "student@demo.local" })
  @IsEmail({}, { message: "Enter a valid email address" })
  email!: string;

  @ApiProperty({ example: "password123" })
  @IsString()
  @IsNotEmpty({ message: "Password is required" })
  password!: string;
}

export class SendOtpRequestDto {
  @ApiProperty({ example: "01712345678" })
  @IsString()
  @IsNotEmpty({ message: "mobileNumber is required" })
  mobileNumber!: string;
}

export class VerifyOtpRequestDto {
  @ApiProperty({ example: "01712345678" })
  @IsString()
  @IsNotEmpty({ message: "mobileNumber is required" })
  mobileNumber!: string;

  @ApiProperty({ example: "123456" })
  @IsString()
  @IsNotEmpty({ message: "otp is required" })
  otp!: string;

  @ApiPropertyOptional({
    example: "Student Name",
    description: "Only sent when registering; omit it to sign in.",
  })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(2, 80, { message: "Name must be between 2 and 80 characters" })
  name?: string;
}

export class RefreshRequestDto {
  @ApiPropertyOptional({ description: "Refresh token" })
  @IsOptional()
  @IsString()
  refresh_token?: string;
}

export class UpdateProfileRequestDto {
  @ApiProperty({ example: "Student Name" })
  @Transform(trim)
  @IsString({ message: "Name is required" })
  @Length(2, 80, { message: "Name must be between 2 and 80 characters" })
  name!: string;
}
