import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/navbar";
import { StoreProvider } from "@/components/store-provider";
import { AuthProvider } from "@/features/auth/auth-context";
import { PromotionalModal } from "@/components/promotional-modal";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ShobShop — Everyday favourites",
    template: "%s | ShobShop",
  },
  description: "Quality everyday products delivered across Bangladesh.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <StoreProvider>
            <Navbar />
            <PromotionalModal />
            {children}
            <footer className="mt-auto border-t border-stone-200 px-4 py-8 text-center text-sm text-stone-500">
              © 2026 ShobShop. Made for everyday Bangladesh.
            </footer>
          </StoreProvider>
        </AuthProvider>
        <Toaster richColors position="top-center" closeButton />
      </body>
    </html>
  );
}
