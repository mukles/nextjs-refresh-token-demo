import { Injectable } from "@nestjs/common";
import type { Cart, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma.service";

const byCreatedAt = { createdAt: "asc" } as const;

@Injectable()
export class StoreRepository {
  constructor(private readonly prisma: PrismaService) {}

  listProducts() {
    return this.prisma.product.findMany({ orderBy: byCreatedAt });
  }

  listFeaturedProducts() {
    return this.prisma.product.findMany({
      where: { featured: true },
      orderBy: byCreatedAt,
    });
  }

  listProductsByCategory(category: string) {
    return this.prisma.product.findMany({
      where: { category },
      orderBy: byCreatedAt,
    });
  }

  findProductBySku(sku: string) {
    return this.prisma.product.findUnique({ where: { sku } });
  }

  findProductWithComments(sku: string) {
    return this.prisma.product.findUnique({
      where: { sku },
      include: { comments: { orderBy: { createdAt: "desc" } } },
    });
  }

  createComment(data: {
    productId: string;
    name: string;
    rating: number;
    comment: string;
  }) {
    return this.prisma.productComment.create({ data });
  }

  async findOrCreateCart(userId: string): Promise<Cart> {
    const existing = await this.prisma.cart.findFirst({ where: { userId } });
    return existing ?? this.prisma.cart.create({ data: { userId } });
  }

  listCartItems(cartId: string) {
    return this.prisma.cartItem.findMany({
      where: { cartId },
      include: { product: true },
      orderBy: { id: "asc" },
    });
  }

  async upsertCartItem(cartId: string, productId: string, quantity: number) {
    await this.prisma.cartItem.upsert({
      where: { cartId_productId: { cartId, productId } },
      create: { cartId, productId, quantity },
      update: { quantity: { increment: quantity } },
    });
  }

  async setCartItemQuantity(
    cartId: string,
    productId: string,
    quantity: number,
  ): Promise<boolean> {
    return this.prisma.cartItem
      .update({
        where: { cartId_productId: { cartId, productId } },
        data: { quantity },
      })
      .then(() => true)
      .catch(() => false);
  }

  async deleteCartItem(cartId: string, productId: string) {
    await this.prisma.cartItem.deleteMany({ where: { cartId, productId } });
  }

  async clearCartItems(cartId: string) {
    await this.prisma.cartItem.deleteMany({ where: { cartId } });
  }

  listOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { items: { orderBy: { id: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
  }

  createOrder(data: Prisma.OrderCreateInput) {
    return this.prisma.order.create({ data });
  }
}
