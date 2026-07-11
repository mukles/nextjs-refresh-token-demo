"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { DEFAULT_REDIRECT } from "./constants";
import type { Step } from "./types";
import { StepIndicator } from "./components/step-indicator";
import { MobileStep } from "./components/mobile-step";
import { OtpStep } from "./components/otp-step";

export function LoginStepper() {
  const params = useSearchParams();
  const redirectTo = params.get("from") ?? DEFAULT_REDIRECT;

  const [step, setStep] = useState<Step>(0);
  const [mobile, setMobile] = useState("");

  function handleMobileSuccess(mobileNumber: string) {
    setMobile(mobileNumber);
    setStep(1);
  }

  return (
    <div className="w-full max-w-sm">
      <div className="space-y-2 rounded-2xl border bg-card p-8 shadow-lg">
        <div className="mb-6 text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {step === 0 ? "Sign in" : "Enter OTP"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {step === 0
              ? "Enter your mobile number to get started."
              : "Check your phone for the 6-digit code."}
          </p>
        </div>

        <StepIndicator step={step} />

        <div className="transition-all duration-300">
          {step === 0 ? (
            <MobileStep onSuccess={handleMobileSuccess} />
          ) : (
            <OtpStep
              mobile={mobile}
              onBack={() => setStep(0)}
              redirectTo={redirectTo}
            />
          )}
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        By continuing you agree to our Terms &amp; Privacy Policy.
      </p>
    </div>
  );
}

export default LoginStepper;
