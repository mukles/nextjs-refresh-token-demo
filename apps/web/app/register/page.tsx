import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth-shell";
import { RegisterForm } from "@/features/auth/register-form";

export const metadata: Metadata = { title: "Create account" };
export default function RegisterPage() {
  return (
    <AuthShell
      title="Join ShobShop today."
      description="Create your account to save your cart, review products and checkout securely."
    >
      <Suspense
        fallback={
          <div className="h-80 animate-pulse rounded-2xl bg-stone-100" />
        }
      >
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
