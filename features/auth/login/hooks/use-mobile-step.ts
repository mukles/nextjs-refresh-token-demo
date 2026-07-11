"use client";

import { useState } from "react";
import { toast } from "sonner";
import { sendOtp } from "../lib/api";

export function useMobileStep(onSuccess: (mobile: string) => void) {
  const [mobile, setMobile] = useState("01641146789");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mobile.trim()) return;
    setLoading(true);
    try {
      const { ok, data } = await sendOtp(mobile);
      if (!ok) {
        toast.error(data.error ?? "Failed to send OTP");
        return;
      }
      toast.success("OTP sent to your number!");
      onSuccess(mobile);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return { mobile, setMobile, loading, handleSubmit };
}
