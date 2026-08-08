import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsIn, IsInt, IsString, Length, Max, Min } from "class-validator";
import { IsBangladeshMobile } from "../../common/mobile-number";

const trim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

const toInt = ({ value }: { value: unknown }) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : value;
};

export class AddCommentRequestDto {
  @ApiProperty({ minimum: 1, maximum: 5, example: 5 })
  @Transform(toInt)
  @IsInt({ message: "Rating must be from 1 to 5" })
  @Min(1, { message: "Rating must be from 1 to 5" })
  @Max(5, { message: "Rating must be from 1 to 5" })
  rating!: number;

  @ApiProperty({ example: "Arrived quickly and works well." })
  @Transform(trim)
  @IsString()
  @Length(3, 600, {
    message: "Comment must be between 3 and 600 characters",
  })
  comment!: string;
}

export class AddCartItemRequestDto {
  @ApiProperty({ description: "Product SKU", example: "SS-1001" })
  @IsString()
  productId!: string;

  @ApiProperty({ minimum: 1, maximum: 99, example: 1 })
  @Transform(toInt)
  @IsInt({ message: "Quantity must be between 1 and 99" })
  @Min(1, { message: "Quantity must be between 1 and 99" })
  @Max(99, { message: "Quantity must be between 1 and 99" })
  quantity!: number;
}

export class UpdateCartItemRequestDto {
  @ApiProperty({ minimum: 1, maximum: 99, example: 2 })
  @Transform(toInt)
  @IsInt({ message: "Quantity must be between 1 and 99" })
  @Min(1, { message: "Quantity must be between 1 and 99" })
  @Max(99, { message: "Quantity must be between 1 and 99" })
  quantity!: number;
}

export class CheckoutRequestDto {
  @ApiProperty({ example: "Student Name" })
  @Transform(trim)
  @IsString({ message: "Customer name is required" })
  @Length(2, 80, { message: "Customer name is required" })
  customerName!: string;

  @ApiProperty({ example: "01712345678" })
  @IsBangladeshMobile()
  mobileNumber!: string;

  @ApiProperty({ example: "House 1, Road 2, Dhaka" })
  @Transform(trim)
  @IsString()
  @Length(10, 400, {
    message: "Delivery address must be at least 10 characters",
  })
  deliveryAddress!: string;

  @ApiProperty({ enum: ["Cash on Delivery", "bKash"] })
  @IsIn(["Cash on Delivery", "bKash"], {
    message: "Select a valid payment method",
  })
  paymentMethod!: "Cash on Delivery" | "bKash";
}
