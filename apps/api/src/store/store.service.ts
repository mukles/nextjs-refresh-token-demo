import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Product } from "@prisma/client";
import { randomBytes } from "node:crypto";
import {
  isValidBangladeshMobile,
  normalizeBangladeshMobile,
} from "../common/mobile-number";
import type {
  AddCartItemRequestDto,
  AddCommentRequestDto,
  CheckoutRequestDto,
} from "./dto/store-request.dto";
import type {
  CartItemResponseDto,
  CheckoutResponseDto,
  OrderResponseDto,
  ProductDetailResponseDto,
  ProductResponseDto,
} from "./dto/store-response.dto";
import { StoreRepository } from "./store.repository";

/** "home-and-kitchen" -> "Home And Kitchen" */
function toCategoryName(slug: string) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

@Injectable()
export class StoreService {
  constructor(private readonly store: StoreRepository) {}

  async listProducts(): Promise<ProductResponseDto[]> {
    return (await this.store.listProducts()).map(toProductDto);
  }

  async listFeaturedProducts(): Promise<ProductResponseDto[]> {
    return (await this.store.listFeaturedProducts()).map(toProductDto);
  }

  async listProductsByCategory(
    category: string,
  ): Promise<ProductResponseDto[]> {
    const products = await this.store.listProductsByCategory(
      toCategoryName(category),
    );
    if (!products.length) throw new NotFoundException("Category not found");
    return products.map(toProductDto);
  }

  async getProduct(sku: string): Promise<ProductDetailResponseDto> {
    const product = await this.store.findProductWithComments(sku);
    if (!product) throw new NotFoundException("Product not found");
    return {
      ...toProductDto(product),
      comments: product.comments.map((item) => ({
        id: item.id,
        name: item.name,
        rating: item.rating,
        comment: item.comment,
        date: item.createdAt.toISOString(),
      })),
    };
  }

  async addComment(sku: string, body: AddCommentRequestDto & { name: string }) {
    const product = await this.requireProduct(sku);
    return this.store.createComment({
      productId: product.id,
      name: body.name,
      rating: body.rating,
      comment: body.comment,
    });
  }

  async getCart(userId: string): Promise<CartItemResponseDto[]> {
    const cart = await this.store.findOrCreateCart(userId);
    const items = await this.store.listCartItems(cart.id);
    return items.map((item) => ({
      product: toProductDto(item.product),
      quantity: item.quantity,
    }));
  }

  async addCartItem(userId: string, body: AddCartItemRequestDto) {
    const [cart, product] = await Promise.all([
      this.store.findOrCreateCart(userId),
      this.store.findProductBySku(body.productId),
    ]);
    if (!product) throw new NotFoundException("Product not found");
    if (!product.inStock)
      throw new BadRequestException("Product is out of stock");
    await this.store.upsertCartItem(cart.id, product.id, body.quantity);
    return this.getCart(userId);
  }

  async updateCartItem(userId: string, sku: string, quantity: number) {
    const cart = await this.store.findOrCreateCart(userId);
    const product = await this.requireProduct(sku);
    const updated = await this.store.setCartItemQuantity(
      cart.id,
      product.id,
      quantity,
    );
    if (!updated) throw new NotFoundException("Cart item not found");
    return this.getCart(userId);
  }

  async removeCartItem(userId: string, sku: string) {
    const cart = await this.store.findOrCreateCart(userId);
    const product = await this.store.findProductBySku(sku);
    if (product) await this.store.deleteCartItem(cart.id, product.id);
    return this.getCart(userId);
  }

  async clearCart(userId: string): Promise<CartItemResponseDto[]> {
    const cart = await this.store.findOrCreateCart(userId);
    await this.store.clearCartItems(cart.id);
    return [];
  }

  async listOrders(userId: string): Promise<OrderResponseDto[]> {
    const orders = await this.store.listOrders(userId);
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
    body: CheckoutRequestDto,
  ): Promise<CheckoutResponseDto> {
    const mobileNumber = normalizeBangladeshMobile(body.mobileNumber);
    if (!isValidBangladeshMobile(mobileNumber))
      throw new BadRequestException("Enter a valid Bangladesh mobile number");

    const cart = await this.store.findOrCreateCart(userId);
    const items = await this.store.listCartItems(cart.id);
    if (!items.length) throw new BadRequestException("Your cart is empty");

    const total = items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    );
    const order = await this.store.createOrder({
      orderNumber: `SS-${Date.now().toString(36).toUpperCase()}-${randomBytes(2)
        .toString("hex")
        .toUpperCase()}`,
      customerName: body.customerName,
      mobileNumber,
      deliveryAddress: body.deliveryAddress,
      paymentMethod: body.paymentMethod,
      total,
      user: { connect: { id: userId } },
      items: {
        create: items.map((item) => ({
          productId: item.productId,
          name: item.product.name,
          unitPrice: item.product.price,
          quantity: item.quantity,
        })),
      },
    });
    await this.store.clearCartItems(cart.id);
    return { orderNumber: order.orderNumber, total: order.total };
  }

  private async requireProduct(sku: string): Promise<Product> {
    const product = await this.store.findProductBySku(sku);
    if (!product) throw new NotFoundException("Product not found");
    return product;
  }
}

function toProductDto(product: Product): ProductResponseDto {
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
