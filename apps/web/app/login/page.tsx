import { Suspense } from "react";
import { LoginStepper } from "@/features/auth/login";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Suspense fallback={null}>
        <LoginStepper />
      </Suspense>
    </main>
  );
}
