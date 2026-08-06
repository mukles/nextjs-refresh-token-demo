"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { MobileStep } from "./components/mobile-step";
import { OtpStep } from "./components/otp-step";
import { StepIndicator } from "./components/step-indicator";
import { DEFAULT_REDIRECT } from "./constants";
import type { Step } from "./types";

export function LoginStepper() {
  const params = useSearchParams();
  const requestedRedirect = params.get("callbackUrl") ?? params.get("from");
  const redirectTo =
    requestedRedirect?.startsWith("/") &&
    !requestedRedirect.startsWith("//") &&
    !requestedRedirect.includes("\\")
      ? requestedRedirect
      : DEFAULT_REDIRECT;
  const [step, setStep] = useState<Step>(0);
  const [mobile, setMobile] = useState("");

  function handleMobileSuccess(mobileNumber: string) {
    setMobile(mobileNumber);
    setStep(1);
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6">
          <h2 className="text-xl font-black tracking-tight text-stone-900">
            {step === 0 ? "Sign in" : "Enter OTP"}
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            {step === 0
              ? "Enter your mobile number to get started."
              : "Check your phone for the 6-digit code."}
          </p>
        </div>

        <StepIndicator step={step} />

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
      <p className="mt-5 text-center text-sm text-stone-500">
        New to ShobShop?{" "}
        <Link
          href={`/register?callbackUrl=${encodeURIComponent(redirectTo)}`}
          className="font-bold text-orange-600 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
