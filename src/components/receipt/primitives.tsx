import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { ReceiptState } from "@/lib/receipts";

export function UsdcAmount({
  amount,
  decimals = 2,
  className,
  symbolClassName,
}: {
  amount: number;
  decimals?: number;
  className?: string;
  symbolClassName?: string;
}) {
  return (
    <span className={cn("tabular-nums tracking-tight", className)}>
      {amount.toFixed(decimals)}
      <span className={cn("ml-1.5 font-medium text-muted-foreground", symbolClassName)}>USDC</span>
    </span>
  );
}

export function EnsName({
  name,
  copyable = false,
  className,
}: {
  name: string;
  copyable?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(name);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <span className={cn("inline-flex items-center gap-2 font-mono", className)}>
      <span className="break-all">{name}</span>
      {copyable && (
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${name}`}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {copied ? (
            <Check className="size-4 text-success" aria-hidden />
          ) : (
            <Copy className="size-4" aria-hidden />
          )}
        </button>
      )}
    </span>
  );
}

const stateStyles: Record<ReceiptState, { dot: string; wrap: string; label: string }> = {
  PAID: {
    dot: "bg-success",
    wrap: "bg-success/10 text-success border-success/20",
    label: "PAID",
  },
  REFUND_REQUESTED: {
    dot: "bg-warning",
    wrap: "bg-warning/10 text-warning border-warning/25",
    label: "REFUND REQUESTED",
  },
  CANCELLED: {
    dot: "bg-muted-foreground",
    wrap: "bg-secondary text-muted-foreground border-border",
    label: "CANCELLED",
  },
  REFUNDED: {
    dot: "bg-warning",
    wrap: "bg-warning/10 text-warning border-warning/25",
    label: "REFUNDED",
  },
  FINALIZED: {
    dot: "bg-primary",
    wrap: "bg-primary/10 text-primary border-primary/20",
    label: "FINALIZED",
  },
};

export function ReceiptStatus({
  state,
  className,
  size = "md",
}: {
  state: ReceiptState;
  className?: string;
  size?: "sm" | "md";
}) {
  const s = stateStyles[state];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border font-semibold tracking-[0.12em] uppercase",
        size === "sm" ? "px-2.5 py-1 text-[10px]" : "px-3 py-1.5 text-xs",
        s.wrap,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", s.dot)} aria-hidden />
      {s.label}
    </span>
  );
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function useCountdown(deadline: number) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (now === null) return { text: "--:--", expired: false, ready: false };
  const remaining = Math.max(0, deadline - now);
  const mins = Math.floor(remaining / 60_000);
  const secs = Math.floor((remaining % 60_000) / 1000);
  return {
    text: `${pad(mins)}:${pad(secs)}`,
    long: `${mins}m ${pad(secs)}s`,
    expired: remaining <= 0,
    ready: true,
    remaining,
  };
}

export function Countdown({
  deadline,
  format = "clock",
  className,
}: {
  deadline: number;
  format?: "clock" | "long";
  className?: string;
}) {
  const c = useCountdown(deadline);
  return (
    <span className={cn("font-mono tabular-nums", className)}>
      {c.expired ? "closed" : format === "long" ? (c.long ?? c.text) : c.text}
    </span>
  );
}

/** True only after hydration; use to gate time-derived text. */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

/** Renders time-derived text only on the client to avoid hydration drift. */
export function TimeText({ children }: { children: string }) {
  const hydrated = useHydrated();
  return <span suppressHydrationWarning>{hydrated ? children : "—"}</span>;
}
