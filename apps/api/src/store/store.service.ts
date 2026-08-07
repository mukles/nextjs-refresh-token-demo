import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomBytes } from "node:crypto";
import {
  isValidBangladeshMobile,
  normalizeBangladeshMobile,
} from "../common/mobile-number";
import { PrismaService } from "../prisma.service";

@Injectable()
export class StoreService {
  constructor(private readonly prisma: PrismaService) {}

  async listProducts() {
    return (
      await this.prisma.product.findMany({ orderBy: { createdAt: "asc" } })
    ).map((product) => this.productDto(product));
  }

  async listFeaturedProducts() {
    return (
      await this.prisma.product.findMany({
        where: { featured: true },
        orderBy: { createdAt: "asc" },
      })
    ).map((product) => this.productDto(product));
  }

  async listProductsByCategory(category: string) {
    const normalized = category
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(" ");
    const products = await this.prisma.product.findMany({
      where: { category: normalized },
      orderBy: { createdAt: "asc" },
    });
    if (!products.length) throw new NotFoundException("Category not found");
    return products.map((product) => this.productDto(product));
  }

  async getProduct(sku: string) {
    const product = await this.prisma.product.findUnique({
      where: { sku },
      include: { comments: { orderBy: { createdAt: "desc" } } },
    });
    if (!product) throw new NotFoundException("Product not found");
    return {
      ...this.productDto(product),
      comments: product.comments.map((item) => ({
        id: item.id,
        name: item.name,
        rating: item.rating,
        comment: item.comment,
        date: item.createdAt.toISOString(),
      })),
    };
  }

  async addComment(
    sku: string,
    body: { name?: unknown; rating?: unknown; comment?: unknown },
  ) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const comment = typeof body.comment === "string" ? body.comment.trim() : "";
    const rating = Number(body.rating);
    if (name.length < 2 || name.length > 80)
      throw new BadRequestException("Name must be between 2 and 80 characters");
    if (!Number.isInteger(rating) || rating < 1 || rating > 5)
      throw new BadRequestException("Rating must be from 1 to 5");
    if (comment.length < 3 || comment.length > 600)
      throw new BadRequestException(
        "Comment must be between 3 and 600 characters",
      );
    const product = await this.prisma.product.findUnique({ where: { sku } });
    if (!product) throw new NotFoundException("Product not found");
    return this.prisma.productComment.create({
      data: { productId: product.id, name, rating, comment },
    });
  }

  private async cart(userId: string) {
    const existing = await this.prisma.cart.findFirst({ where: { userId } });
    return existing ?? this.prisma.cart.create({ data: { userId } });
  }

  async getCart(userId: string) {
    const cart = await this.cart(userId);
    const items = await this.prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: { product: true },
      orderBy: { id: "asc" },
    });
    return items.map((item) => ({
      product: this.productDto(item.product),
      quantity: item.quantity,
    }));
  }

  async addCartItem(userId: string, sku: string, quantity: number) {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99)
      throw new BadRequestException("Quantity must be between 1 and 99");
    const [cart, product] = await Promise.all([
      this.cart(userId),
      this.prisma.product.findUnique({ where: { sku } }),
    ]);
    if (!product) throw new NotFoundException("Product not found");
    if (!product.inStock)
      throw new BadRequestException("Product is out of stock");
    await this.prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId: product.id } },
      create: { cartId: cart.id, productId: product.id, quantity },
      update: { quantity: { increment: quantity } },
    });
    return this.getCart(userId);
  }

  async updateCartItem(userId: string, sku: string, quantity: number) {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99)
      throw new BadRequestException("Quantity must be between 1 and 99");
    const cart = await this.cart(userId);
    const product = await this.prisma.product.findUnique({ where: { sku } });
    if (!product) throw new NotFoundException("Product not found");
    await this.prisma.cartItem
      .update({
        where: { cartId_productId: { cartId: cart.id, productId: product.id } },
        data: { quantity },
      })
      .catch(() => {
        throw new NotFoundException("Cart item not found");
      });
    return this.getCart(userId);
  }

  async removeCartItem(userId: string, sku: string) {
    const cart = await this.cart(userId);
    const product = await this.prisma.product.findUnique({ where: { sku } });
    if (product)
      await this.prisma.cartItem.deleteMany({
        where: { cartId: cart.id, productId: product.id },
      });
    return this.getCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.cart(userId);
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return [];
  }

  async listOrders(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: { items: { orderBy: { id: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
    return orders.map((order) => ({
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      deliveryAddress: order.deliveryAddress,
      paymentMethod: order.paymentMethod,
      total: order.total,
      createdAt: order.createdAt.toISOString(),
      items: order.items.map((item) => ({
        name: item.name,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
      })),
    }));
  }

  async checkout(
    userId: string,
    body: {
      customerName?: unknown;
      mobileNumber?: unknown;
      deliveryAddress?: unknown;
      paymentMethod?: unknown;
    },
  ) {
    const customerName =
      typeof body.customerName === "string" ? body.customerName.trim() : "";
    const mobileNumber = normalizeBangladeshMobile(
      typeof body.mobileNumber === "string" ? body.mobileNumber : "",
    );
    const deliveryAddress =
      typeof body.deliveryAddress === "string"
        ? body.deliveryAddress.trim()
        : "";
    const paymentMethod = body.paymentMethod;
    if (customerName.length < 2)
      throw new BadRequestException("Customer name is required");
    if (!isValidBangladeshMobile(mobileNumber))
      throw new BadRequestException("Enter a valid Bangladesh mobile number");
    if (deliveryAddress.length < 10)
      throw new BadRequestException(
        "Delivery address must be at least 10 characters",
      );
    if (paymentMethod !== "Cash on Delivery" && paymentMethod !== "bKash")
      throw new BadRequestException("Select a valid payment method");
    const cart = await this.cart(userId);
    const items = await this.prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: { product: true },
    });
    if (!items.length) throw new BadRequestException("Your cart is empty");
    const total = items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );
    const orderNumber = `SS-${Date.now().toString(36).toUpperCase()}-${randomBytes(2).toString("hex").toUpperCase()}`;
    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        customerName,
        mobileNumber,
        deliveryAddress,
        paymentMethod,
        total,
        userId,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            name: item.product.name,
            unitPrice: item.product.price,
            quantity: item.quantity,
          })),
        },
      },
    });
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    return { orderNumber: order.orderNumber, total: order.total };
  }

  private productDto(product: {
    sku: string;
    name: string;
    image: string;
    price: number;
    originalPrice: number | null;
    promoLabel: string | null;
    featured: boolean;
    category: string;
    rating: number;
    description: string;
    inStock: boolean;
  }) {
    return {
      id: product.sku,
      name: product.name,
      image: product.image,
      price: product.price,
      originalPrice: product.originalPrice,
      promoLabel: product.promoLabel,
      featured: product.featured,
      category: product.category,
      rating: product.rating,
      description: product.description,
      inStock: product.inStock,
    };
  }
}
