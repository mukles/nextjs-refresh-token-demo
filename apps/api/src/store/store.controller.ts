import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import { ApiCookieAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { ACCESS_COOKIE, AuthService } from "../auth/auth.service";
import { StoreService } from "./store.service";

@ApiTags("store")
@ApiCookieAuth(ACCESS_COOKIE)
@Controller("store")
export class StoreController {
  constructor(
    private readonly store: StoreService,
    private readonly auth: AuthService,
  ) {}

  @Get("products")
  @ApiOperation({ summary: "List products for an authenticated shopper" })
  async listProducts(@Req() req: Request) {
    await this.userId(req);
    return this.store.listProducts();
  }

  @Get("products/featured")
  async listFeaturedProducts(@Req() req: Request) {
    await this.userId(req);
    return this.store.listFeaturedProducts();
  }

  @Get("categories/:category")
  async listProductsByCategory(
    @Req() req: Request,
    @Param("category") category: string,
  ) {
    await this.userId(req);
    return this.store.listProductsByCategory(category);
  }

  @Get("products/:sku")
  async getProduct(@Req() req: Request, @Param("sku") sku: string) {
    await this.userId(req);
    return this.store.getProduct(sku);
  }

  @Post("products/:sku/comments")
  async addComment(
    @Req() req: Request,
    @Param("sku") sku: string,
    @Body() body: { rating?: unknown; comment?: unknown },
  ) {
    const profile = await this.userProfile(req);
    return this.store.addComment(sku, { ...body, name: profile.name });
  }

  @Get("cart") async getCart(@Req() req: Request) {
    return this.store.getCart(await this.userId(req));
  }
  @Post("cart/items") async addItem(
    @Req() req: Request,
    @Body() body: { productId: string; quantity: number },
  ) {
    return this.store.addCartItem(
      await this.userId(req),
      body.productId,
      Number(body.quantity),
    );
  }
  @Patch("cart/items/:sku") async updateItem(
    @Req() req: Request,
    @Param("sku") sku: string,
    @Body() body: { quantity: number },
  ) {
    return this.store.updateCartItem(
      await this.userId(req),
      sku,
      Number(body.quantity),
    );
  }
  @Delete("cart/items/:sku") async removeItem(
    @Req() req: Request,
    @Param("sku") sku: string,
  ) {
    return this.store.removeCartItem(await this.userId(req), sku);
  }
  @Delete("cart") async clear(@Req() req: Request) {
    return this.store.clearCart(await this.userId(req));
  }
  @Get("orders") async listOrders(@Req() req: Request) {
    return this.store.listOrders(await this.userId(req));
  }
  @Post("checkout") async checkout(
    @Req() req: Request,
    @Body()
    body: {
      customerName?: unknown;
      mobileNumber?: unknown;
      deliveryAddress?: unknown;
      paymentMethod?: unknown;
    },
  ) {
    return this.store.checkout(await this.userId(req), body);
  }

  private async userId(req: Request) {
    return (await this.userProfile(req))._id;
  }

  private async userProfile(req: Request) {
    const token = req.cookies?.[ACCESS_COOKIE] as string | undefined;
    if (!token) throw new UnauthorizedException("Access token missing");
    return this.auth.getProfile(token);
  }
}
