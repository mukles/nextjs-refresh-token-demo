import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import type { AuthenticatedUser } from "../auth/auth.service";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import {
  AddCartItemRequestDto,
  AddCommentRequestDto,
  CheckoutRequestDto,
  UpdateCartItemRequestDto,
} from "./dto/store-request.dto";
import {
  CartItemResponseDto,
  CheckoutResponseDto,
  OrderResponseDto,
  ProductDetailResponseDto,
  ProductResponseDto,
} from "./dto/store-response.dto";
import { StoreService } from "./store.service";

@ApiTags("store")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("store")
export class StoreController {
  constructor(private readonly store: StoreService) {}

  @Get("products")
  @ApiOperation({ summary: "List products for an authenticated shopper" })
  @ApiOkResponse({ type: [ProductResponseDto] })
  listProducts() {
    return this.store.listProducts();
  }

  @Get("products/featured")
  @ApiOkResponse({ type: [ProductResponseDto] })
  listFeaturedProducts() {
    return this.store.listFeaturedProducts();
  }

  @Get("categories/:category")
  @ApiOkResponse({ type: [ProductResponseDto] })
  listProductsByCategory(@Param("category") category: string) {
    return this.store.listProductsByCategory(category);
  }

  @Get("products/:sku")
  @ApiOkResponse({ type: ProductDetailResponseDto })
  getProduct(@Param("sku") sku: string) {
    return this.store.getProduct(sku);
  }

  @Post("products/:sku/comments")
  addComment(
    @CurrentUser() user: AuthenticatedUser,
    @Param("sku") sku: string,
    @Body() body: AddCommentRequestDto,
  ) {
    return this.store.addComment(sku, { ...body, name: user.name });
  }

  @Get("cart")
  @ApiOkResponse({ type: [CartItemResponseDto] })
  getCart(@CurrentUser() user: AuthenticatedUser) {
    return this.store.getCart(user._id);
  }

  @Post("cart/items")
  @ApiOkResponse({ type: [CartItemResponseDto] })
  addItem(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: AddCartItemRequestDto,
  ) {
    return this.store.addCartItem(user._id, body);
  }

  @Patch("cart/items/:sku")
  @ApiOkResponse({ type: [CartItemResponseDto] })
  updateItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param("sku") sku: string,
    @Body() body: UpdateCartItemRequestDto,
  ) {
    return this.store.updateCartItem(user._id, sku, body.quantity);
  }

  @Delete("cart/items/:sku")
  @ApiOkResponse({ type: [CartItemResponseDto] })
  removeItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param("sku") sku: string,
  ) {
    return this.store.removeCartItem(user._id, sku);
  }

  @Delete("cart")
  @ApiOkResponse({ type: [CartItemResponseDto] })
  clear(@CurrentUser() user: AuthenticatedUser) {
    return this.store.clearCart(user._id);
  }

  @Get("orders")
  @ApiOkResponse({ type: [OrderResponseDto] })
  listOrders(@CurrentUser() user: AuthenticatedUser) {
    return this.store.listOrders(user._id);
  }

  @Post("checkout")
  @ApiOkResponse({ type: CheckoutResponseDto })
  checkout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CheckoutRequestDto,
  ) {
    return this.store.checkout(user._id, body);
  }
}
