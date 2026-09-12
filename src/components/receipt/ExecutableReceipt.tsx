import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowLeftRight, BadgeCheck, RotateCcw, X } from "lucide-react";
import { Countdown, EnsName, ReceiptStatus, TimeText, UsdcAmount } from "./primitives";
import { canCancel, canRefund, canTransfer, timeAgo, type Receipt } from "@/lib/receipts";
import { cn } from "@/lib/utils";

function CapabilityChip({
  icon: Icon,
  label,
  active,
}: {
  icon: typeof X;
  label: string;
  active: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-200",
        active
          ? "border-primary/20 bg-primary/5 text-primary group-hover:bg-primary/10"
          : "border-border bg-secondary text-muted-foreground line-through decoration-1",
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {label}
    </span>
  );
}

/**
 * The signature object of the product: a purchase receipt that is also a
 * control surface. Used on the landing hero and in the dashboard list.
 */
export function ExecutableReceipt({
  receipt,
  variant = "card",
  className,
}: {
  receipt: Receipt;
  variant?: "hero" | "card";
  className?: string;
}) {
  const cancellable = canCancel(receipt);
  const refundable = canRefund(receipt);
  const transferable = canTransfer(receipt);
  const dimmed = receipt.state !== "PAID";

  return (
    <motion.article
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className={cn(
        "group relative overflow-hidden rounded-[20px] border border-border bg-card shadow-soft transition-shadow duration-300 hover:shadow-lift",
        dimmed && "bg-secondary/40",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-32 opacity-70"
        style={{
          background:
            "radial-gradient(70% 100% at 50% 0%, color-mix(in oklab, var(--primary) 10%, transparent), transparent 70%)",
        }}
        aria-hidden
      />

      <div className="relative p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
              Executable Receipt
            </p>
            <h3
              className={cn(
                "mt-2 font-semibold tracking-tight",
                variant === "hero" ? "text-2xl" : "text-xl",
              )}
            >
              {receipt.product}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{receipt.description}</p>
          </div>
          <ReceiptStatus state={receipt.state} />
        </div>

        <div className="mt-6 rounded-xl border border-border bg-secondary/60 px-4 py-3">
          <EnsName name={receipt.name} className="text-[13px] text-foreground" />
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-y-5">
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Amount</dt>
            <dd className="mt-1 text-2xl font-semibold">
              <UsdcAmount amount={receipt.amount} symbolClassName="text-sm" />
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Merchant</dt>
            <dd className="mt-1 font-mono text-sm">{receipt.merchant}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">Purchased</dt>
            <dd className="mt-1 text-sm">
              <TimeText>{timeAgo(receipt.purchasedAt)}</TimeText>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground">
              {receipt.state === "PAID" ? "Refund available" : "Settlement"}
            </dt>
            <dd className="mt-1 text-sm">
              {receipt.state === "PAID" ? (
                <Countdown deadline={receipt.refundDeadline} format="long" />
              ) : receipt.state === "CANCELLED" ? (
                "Reversed"
              ) : (
                "Complete"
              )}
            </dd>
          </div>
        </dl>
      </div>

      <div className="relative">
        <div className="receipt-notch border-t border-dashed border-border" />
      </div>

      <div className="relative flex flex-wrap items-center justify-between gap-4 p-6 sm:p-7">
        {receipt.state === "PAID" ? (
          <div className="flex flex-wrap gap-2">
            <CapabilityChip icon={X} label="Cancel" active={cancellable} />
            <CapabilityChip icon={ArrowLeftRight} label="Transfer" active={transferable} />
            <CapabilityChip icon={RotateCcw} label="Refund" active={refundable} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {receipt.state === "CANCELLED"
              ? `✓ ${receipt.refundedAmount ?? receipt.amount} USDC refunded`
              : "Purchase rights closed"}
          </p>
        )}

        <Link
          to="/receipt/$name"
          params={{ name: receipt.name }}
          className="text-sm font-semibold text-primary transition-opacity hover:opacity-80"
        >
          {receipt.state === "PAID" ? "Open Receipt →" : "View Receipt →"}
        </Link>
      </div>

      <div className="relative flex items-center gap-2 border-t border-border px-6 py-3.5 text-xs text-muted-foreground sm:px-7">
        <BadgeCheck className="size-3.5 text-success" aria-hidden />
        Settlement verified on {receipt.network}
      </div>
    </motion.article>
  );
}
