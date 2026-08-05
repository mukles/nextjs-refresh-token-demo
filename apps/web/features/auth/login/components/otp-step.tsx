"use client";

import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { OTP_LENGTH } from "../constants";
import { useOtpStep } from "../hooks/use-otp-step";

export function OtpStep({
  mobile,
  onBack,
  redirectTo,
}: {
  mobile: string;
  onBack: () => void;
  redirectTo: string;
}) {
  const { otp, setOtp, loading, resendLoading, handleVerify, handleResend } =
    useOtpStep(mobile, redirectTo);

  return (
    <form onSubmit={handleVerify} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-1 text-center">
          <p className="text-sm text-muted-foreground">OTP sent to</p>
          <p className="font-semibold text-foreground">{mobile}</p>
        </div>

        <div className="flex justify-center">
          <InputOTP
            maxLength={OTP_LENGTH}
            value={otp}
            onChange={setOtp}
            autoFocus
          >
            <InputOTPGroup>
              {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                <InputOTPSlot key={i} index={i} className="h-12 w-11 text-lg" />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Didn&apos;t receive it?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={resendLoading}
            className="font-medium text-primary underline-offset-4 hover:underline disabled:opacity-50"
          >
            {resendLoading ? "Resending…" : "Resend OTP"}
          </button>
        </p>
      </div>

      <div className="space-y-3">
        <Button
          type="submit"
          className="h-11 w-full gap-2 font-semibold"
          disabled={loading || otp.length !== OTP_LENGTH}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying…
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" />
              Verify & Sign in
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="h-10 w-full text-muted-foreground"
          onClick={onBack}
        >
          ← Change number
        </Button>
      </div>
    </form>
  );
}
