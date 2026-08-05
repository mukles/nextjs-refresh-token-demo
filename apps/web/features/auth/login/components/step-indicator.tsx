import { Phone, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Step } from "../types";

const STEPS = [
  { icon: Phone, label: "Mobile" },
  { icon: ShieldCheck, label: "Verify" },
] as const;

export function StepIndicator({ step }: { step: Step }) {
  return (
    <div className="mb-8 flex items-center justify-center gap-0">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        const isActive = i === step;
        const isDone = i < step;

        return (
          <div key={s.label} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                  isDone && "border-primary bg-primary text-primary-foreground",
                  isDone &&
                    isActive &&
                    "border-primary bg-primary/10 text-primary",
                  !isDone &&
                    !isActive &&
                    "border-border bg-background text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span
                className={cn(
                  "text-xs font-medium transition-colors",
                  isActive || isDone ? "text-primary" : "text-muted-foreground",
                )}
              >
                {s.label}
              </span>
            </div>

            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-2 mb-5 h-0.5 w-16 rounded-full transition-all duration-500",
                  isDone ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
