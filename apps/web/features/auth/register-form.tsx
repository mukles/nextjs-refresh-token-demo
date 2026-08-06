"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { sendOtp, verifyOtp } from "@/features/auth/login/lib/api";
import {
  isValidBangladeshMobile,
  normalizeBangladeshMobile,
} from "@/lib/mobile-number";

export function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [step, setStep] = useState<"details" | "otp">("details");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const requested = params.get("callbackUrl") ?? params.get("from");
  const redirectTo =
    requested?.startsWith("/") &&
    !requested.startsWith("//") &&
    !requested.includes("\\")
      ? requested
      : "/";
  async function requestOtp(event: React.FormEvent) {
    event.preventDefault();
    const normalizedMobile = normalizeBangladeshMobile(mobile);
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = "Enter at least 2 characters.";
    if (!isValidBangladeshMobile(normalizedMobile))
      next.mobile = "Enter a valid Bangladesh mobile number.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    try {
      const result = await sendOtp(normalizedMobile);
      if (!result.ok)
        throw new Error(
          result.data.message ?? result.data.error ?? "Could not send OTP",
        );
      setMobile(normalizedMobile);
      setStep("otp");
      toast.success("OTP sent to your number");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not send OTP",
      );
    } finally {
      setLoading(false);
    }
  }
  async function register(event: React.FormEvent) {
    event.preventDefault();
    if (otp.length !== 6) return;
    setLoading(true);
    try {
      const result = await verifyOtp(
        normalizeBangladeshMobile(mobile),
        otp,
        name.trim(),
      );
      if (!result.ok)
        throw new Error(
          result.data.message ?? result.data.error ?? "Invalid OTP",
        );
      toast.success("Your ShobShop account is ready!");
      router.push(redirectTo);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Registration failed",
      );
    } finally {
      setLoading(false);
    }
  }
  const input =
    "h-12 w-full rounded-xl border border-stone-200 pl-10 pr-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100";
  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div
          className="mb-6 flex items-center gap-2"
          aria-label="Registration progress"
        >
          <span className="h-1.5 flex-1 rounded-full bg-orange-600" />
          <span
            className={`h-1.5 flex-1 rounded-full ${step === "otp" ? "bg-orange-600" : "bg-stone-200"}`}
          />
        </div>
        {step === "details" ? (
          <form onSubmit={requestOtp} noValidate>
            <h2 className="text-xl font-black text-stone-900">
              Create your account
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              A few details and you&apos;re ready to shop.
            </p>
            <div className="mt-6 space-y-4">
              <label className="block text-sm font-semibold text-stone-700">
                Full name
                <div className="relative mt-1.5">
                  <UserRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={input}
                    autoComplete="name"
                    aria-invalid={!!errors.name}
                    placeholder="Your full name"
                  />
                </div>
                {errors.name && (
                  <span className="mt-1 block text-xs text-red-600">
                    {errors.name}
                  </span>
                )}
              </label>
              <label className="block text-sm font-semibold text-stone-700">
                Mobile number
                <div className="relative mt-1.5">
                  <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
                  <input
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className={input}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    aria-invalid={!!errors.mobile}
                    placeholder="01XXXXXXXXX or +8801XXXXXXXXX"
                  />
                </div>
                {errors.mobile && (
                  <span className="mt-1 block text-xs text-red-600">
                    {errors.mobile}
                  </span>
                )}
              </label>
            </div>
            <button
              disabled={loading}
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-600 font-bold text-white hover:bg-orange-700 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Sending OTP...
                </>
              ) : (
                <>
                  Continue <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={register}>
            <button
              type="button"
              onClick={() => {
                setStep("details");
                setOtp("");
              }}
              className="mb-5 inline-flex items-center gap-1 text-sm font-semibold text-stone-500 hover:text-orange-600"
            >
              <ArrowLeft className="size-4" /> Edit details
            </button>
            <h2 className="text-xl font-black text-stone-900">
              Verify your number
            </h2>
            <p className="mt-1 text-sm leading-6 text-stone-500">
              Enter the 6-digit code sent to{" "}
              <strong className="text-stone-700">{mobile}</strong>.
            </p>
            <div className="mt-7 flex justify-center">
              <InputOTP maxLength={6} value={otp} onChange={setOtp} autoFocus>
                <InputOTPGroup>
                  {Array.from({ length: 6 }, (_, index) => (
                    <InputOTPSlot
                      key={index}
                      index={index}
                      className="h-12 w-11 text-lg"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <p className="mt-4 text-center text-xs text-stone-400">
              Demo OTP: 123456
            </p>
            <button
              disabled={loading || otp.length !== 6}
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-600 font-bold text-white hover:bg-orange-700 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Creating
                  account...
                </>
              ) : (
                <>
                  <ShieldCheck className="size-4" /> Verify & Create Account
                </>
              )}
            </button>
          </form>
        )}
      </div>
      <p className="mt-5 text-center text-sm text-stone-500">
        Already have an account?{" "}
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(redirectTo)}`}
          className="font-bold text-orange-600 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
