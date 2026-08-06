export type Product = {
  id: string;
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
};

export type CartLine = { product: Product; quantity: number };

export type ProductComment = {
  id: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
};

export type DetailedProduct = Product & { comments: ProductComment[] };
