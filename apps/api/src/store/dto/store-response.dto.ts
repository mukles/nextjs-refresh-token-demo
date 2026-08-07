import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ProductResponseDto {
  @ApiProperty({ description: "Product SKU", example: "SS-1001" })
  id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() image!: string;
  @ApiProperty() price!: number;
  @ApiPropertyOptional({ type: Number, nullable: true })
  originalPrice!: number | null;
  @ApiPropertyOptional({ type: String, nullable: true })
  promoLabel!: string | null;
  @ApiProperty() featured!: boolean;
  @ApiProperty() category!: string;
  @ApiProperty() rating!: number;
  @ApiProperty() description!: string;
  @ApiProperty() inStock!: boolean;
}

export class ProductCommentResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ minimum: 1, maximum: 5 }) rating!: number;
  @ApiProperty() comment!: string;
  @ApiProperty({ description: "ISO timestamp" }) date!: string;
}

export class ProductDetailResponseDto extends ProductResponseDto {
  @ApiProperty({ type: [ProductCommentResponseDto] })
  comments!: ProductCommentResponseDto[];
}

export class CartItemResponseDto {
  @ApiProperty({ type: ProductResponseDto }) product!: ProductResponseDto;
  @ApiProperty() quantity!: number;
}

export class OrderItemResponseDto {
  @ApiProperty() name!: string;
  @ApiProperty() unitPrice!: number;
  @ApiProperty() quantity!: number;
}

export class OrderResponseDto {
  @ApiProperty() orderNumber!: string;
  @ApiProperty() customerName!: string;
  @ApiProperty() deliveryAddress!: string;
  @ApiProperty() paymentMethod!: string;
  @ApiProperty() total!: number;
  @ApiProperty({ description: "ISO timestamp" }) createdAt!: string;
  @ApiProperty({ type: [OrderItemResponseDto] })
  items!: OrderItemResponseDto[];
}

export class CheckoutResponseDto {
  @ApiProperty() orderNumber!: string;
  @ApiProperty() total!: number;
}
