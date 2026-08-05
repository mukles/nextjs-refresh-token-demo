"use client";

import { ChevronRight, Loader2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMobileStep } from "../hooks/use-mobile-step";

export function MobileStep({
  onSuccess,
}: {
  onSuccess: (mobile: string) => void;
}) {
  const { mobile, setMobile, loading, handleSubmit } = useMobileStep(onSuccess);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="mobile" className="text-sm font-medium">
          Mobile Number
        </Label>
        <div className="relative">
          <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="mobile"
            type="tel"
            placeholder="01XXXXXXXXX"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className="h-11 pl-10"
            autoComplete="tel"
            required
          />
        </div>
        <p className="text-xs text-muted-foreground">
          We&apos;ll send a 6-digit OTP to this number.
        </p>
      </div>

      <Button
        type="submit"
        className="h-11 w-full gap-2 font-semibold"
        disabled={loading || !mobile.trim()}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending OTP…
          </>
        ) : (
          <>
            Continue
            <ChevronRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}
