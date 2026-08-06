import { Suspense } from "react";
import { LoginStepper } from "@/features/auth/login";
import { AuthShell } from "@/components/auth-shell";

export default function LoginPage() {
  return (
    <AuthShell
      title="Good to see you again."
      description="Sign in securely with your mobile number. No password to remember."
    >
      <Suspense
        fallback={
          <div className="h-72 animate-pulse rounded-2xl bg-stone-100" />
        }
      >
        <LoginStepper />
      </Suspense>
    </AuthShell>
  );
}
