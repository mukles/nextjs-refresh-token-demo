import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      name: "Demo User",
      passwordHash: bcrypt.hashSync("password123", 10),
    },
  });
  console.log(`Seeded user: ${user.email} (${user.id})`);

  const products = [
    {
      sku: "p101",
      name: "Everyday Canvas Backpack",
      image:
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80",
      price: 2450,
      originalPrice: 2950,
      promoLabel: "Weekend Deal",
      featured: true,
      category: "Bags",
      rating: 4.8,
      description:
        "A durable water-resistant canvas backpack with a padded laptop sleeve and thoughtfully placed pockets for daily travel.",
      inStock: true,
    },
    {
      sku: "p102",
      name: "Classic Leather Watch",
      image:
        "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=900&q=80",
      price: 3890,
      originalPrice: 4590,
      promoLabel: "Top Pick",
      featured: true,
      category: "Accessories",
      rating: 4.6,
      description:
        "A timeless minimalist watch with a genuine leather strap, brushed steel case and reliable quartz movement.",
      inStock: true,
    },
    {
      sku: "p103",
      name: "Wireless Studio Headphones",
      image:
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80",
      price: 5290,
      originalPrice: 6490,
      promoLabel: "Flash Sale",
      featured: true,
      category: "Electronics",
      rating: 4.9,
      description:
        "Immersive over-ear headphones with rich balanced audio, soft memory-foam cushions and up to 30 hours of battery life.",
      inStock: true,
    },
    {
      sku: "p104",
      name: "Ceramic Pour-over Set",
      image:
        "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80",
      price: 1850,
      originalPrice: 2200,
      promoLabel: "Limited Offer",
      featured: true,
      category: "Home",
      rating: 4.5,
      description:
        "A handcrafted ceramic dripper and cup set made for a calm, beautifully balanced morning coffee ritual.",
      inStock: true,
    },
    {
      sku: "p105",
      name: "Essential Cotton Sneakers",
      image:
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
      price: 3200,
      originalPrice: null,
      promoLabel: null,
      featured: false,
      category: "Footwear",
      rating: 4.7,
      description:
        "Lightweight everyday sneakers with breathable cotton lining, cushioned insoles and a flexible rubber sole.",
      inStock: true,
    },
    {
      sku: "p106",
      name: "Linen Table Lamp",
      image:
        "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80",
      price: 2750,
      originalPrice: null,
      promoLabel: null,
      featured: false,
      category: "Home",
      rating: 4.4,
      description:
        "A warm bedside lamp with a natural linen shade and solid wood base, designed to make any corner feel inviting.",
      inStock: false,
    },
    {
      sku: "p107",
      name: "Polarized Dayfarer Sunglasses",
      image:
        "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=900&q=80",
      price: 1650,
      originalPrice: 1950,
      promoLabel: "Hot Deal",
      featured: true,
      category: "Accessories",
      rating: 4.6,
      description:
        "Lightweight UV400 polarized sunglasses with a versatile silhouette and a protective hard-shell travel case.",
      inStock: true,
    },
    {
      sku: "p108",
      name: "Portable Bluetooth Speaker",
      image:
        "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=900&q=80",
      price: 4100,
      originalPrice: null,
      promoLabel: null,
      featured: false,
      category: "Electronics",
      rating: 4.8,
      description:
        "A compact, splash-resistant speaker with clear room-filling sound, deep bass and 18-hour playback.",
      inStock: true,
    },
  ];
  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: product,
      create: product,
    });
  }
  const backpack = await prisma.product.findUniqueOrThrow({
    where: { sku: "p101" },
  });
  const existingComments = await prisma.productComment.count({
    where: { productId: backpack.id },
  });
  if (!existingComments) {
    await prisma.productComment.createMany({
      data: [
        {
          productId: backpack.id,
          name: "Nabila Rahman",
          rating: 5,
          comment:
            "The compartments are genuinely useful and it feels sturdy without being heavy.",
          createdAt: new Date("2026-07-18"),
        },
        {
          productId: backpack.id,
          name: "Arif Hasan",
          rating: 4,
          comment:
            "Great everyday bag. The laptop sleeve fits my 14-inch device perfectly.",
          createdAt: new Date("2026-07-03"),
        },
      ],
    });
  }
  console.log(`Seeded ${products.length} store products`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
