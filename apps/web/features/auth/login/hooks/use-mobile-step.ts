"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  isValidBangladeshMobile,
  normalizeBangladeshMobile,
} from "@/lib/mobile-number";
import { sendOtp } from "../lib/api";

export function useMobileStep(onSuccess: (mobile: string) => void) {
  const [mobile, setMobile] = useState("01641146789");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const normalizedMobile = normalizeBangladeshMobile(mobile);
    if (!isValidBangladeshMobile(normalizedMobile)) {
      toast.error("Enter a valid Bangladesh mobile number.");
      return;
    }
    setLoading(true);
    try {
      const { ok, data } = await sendOtp(normalizedMobile);
      if (!ok) {
        toast.error(data.message ?? data.error ?? "Failed to send OTP");
        return;
      }
      toast.success("OTP sent to your number!");
      setMobile(normalizedMobile);
      onSuccess(normalizedMobile);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return { mobile, setMobile, loading, handleSubmit };
}
