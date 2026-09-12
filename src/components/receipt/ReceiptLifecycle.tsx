import { Check } from "lucide-react";
import { Countdown } from "./primitives";
import type { Receipt } from "@/lib/receipts";
import { cn } from "@/lib/utils";

export function ReceiptLifecycle({ receipt }: { receipt: Receipt }) {
  const cancelled = receipt.state === "CANCELLED" || receipt.state === "REFUNDED";
  const finalized = receipt.state === "FINALIZED";

  const steps = [
    { label: "Purchase", caption: "Paid in USDC", done: true },
    {
      label: cancelled ? "Cancelled" : "Escrow",
      caption: cancelled ? "Funds returned" : "Held on Arc",
      done: true,
      current: !finalized,
    },
    {
      label: cancelled ? "Closed" : "Settlement",
      caption: cancelled ? "Rights closed" : finalized ? "Released to merchant" : "Pending",
      done: cancelled || finalized,
    },
  ];

  return (
    <section className="rounded-[18px] border border-border bg-card p-6 shadow-soft sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-tight">Receipt lifecycle</h2>
        {receipt.state === "PAID" && (
          <p className="text-sm text-muted-foreground">
            Settlement in{" "}
            <Countdown deadline={receipt.refundDeadline} className="text-foreground" />
          </p>
        )}
      </div>

      <ol className="mt-7 flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-0">
        {steps.map((step, i) => (
          <li key={step.label} className="relative flex flex-1 gap-4 sm:block">
            <div className="flex items-center sm:w-full">
              <span
                className={cn(
                  "relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  step.done
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card",
                  step.current && !cancelled && "ring-4 ring-primary/15",
                )}
              >
                {step.done ? <Check className="size-3.5" aria-hidden /> : null}
              </span>
              {i < steps.length - 1 && (
                <span
                  className={cn(
                    "mx-2 hidden h-px flex-1 sm:block",
                    steps[i + 1]?.done ? "bg-primary/40" : "bg-border",
                  )}
                  aria-hidden
                />
              )}
            </div>
            <div className="sm:mt-3 sm:pr-6">
              <p className="text-sm font-semibold">{step.label}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{step.caption}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
