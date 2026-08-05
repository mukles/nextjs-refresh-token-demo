"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { OTP_LENGTH } from "../constants";
import { sendOtp, verifyOtp } from "../lib/api";

export function useOtpStep(mobile: string, redirectTo: string) {
  const router = useRouter();
  const [otp, setOtp] = useState("123456");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== OTP_LENGTH) return;
    setLoading(true);
    try {
      const { ok, data } = await verifyOtp(mobile, otp);
      if (!ok) {
        toast.error(data.message ?? data.error ?? "Invalid OTP");
        return;
      }
      toast.success(data.message ?? "Authenticated!");
      router.push(redirectTo);
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResendLoading(true);
    try {
      const { ok, data } = await sendOtp(mobile);
      if (ok) {
        toast.success("OTP resent!");
        setOtp("");
      } else {
        toast.error(data.message ?? data.error ?? "Failed to resend OTP");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setResendLoading(false);
    }
  }

  return { otp, setOtp, loading, resendLoading, handleVerify, handleResend };
}
