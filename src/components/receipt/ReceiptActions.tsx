import { ArrowLeftRight, RotateCcw, X } from "lucide-react";
import { motion } from "motion/react";
import { Countdown } from "./primitives";
import { Button } from "@/components/ui/button";
import { canCancel, canRefund, canTransfer, type Receipt } from "@/lib/receipts";
import { cn } from "@/lib/utils";

function ActionCard({
  icon: Icon,
  title,
  description,
  secondary,
  cta,
  tone = "neutral",
  disabled,
  onClick,
}: {
  icon: typeof X;
  title: string;
  description: React.ReactNode;
  secondary?: React.ReactNode;
  cta: string;
  tone?: "neutral" | "danger";
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <motion.div
      whileHover={{ y: disabled ? 0 : -2 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group flex flex-col gap-5 rounded-[16px] border border-border bg-card p-6 shadow-soft transition-colors sm:flex-row sm:items-center sm:gap-6",
        disabled && "opacity-55",
        !disabled && tone === "danger" && "hover:border-destructive/30",
        !disabled && tone === "neutral" && "hover:border-primary/30",
      )}
    >
      <span
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-full border transition-colors",
          tone === "danger"
            ? "border-border bg-secondary text-muted-foreground group-hover:border-destructive/30 group-hover:bg-destructive/10 group-hover:text-destructive"
            : "border-primary/15 bg-primary/8 text-primary",
        )}
      >
        <Icon className="size-5" aria-hidden />
      </span>

      <div className="min-w-0 flex-1">
        <h3 className="text-base font-semibold tracking-tight">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        {secondary && <p className="mt-1.5 text-xs text-muted-foreground">{secondary}</p>}
      </div>

      <Button
        variant={tone === "danger" ? "outline" : "default"}
        disabled={disabled}
        onClick={onClick}
        className={cn(
          "w-full rounded-full sm:w-auto",
          tone === "danger" &&
            "hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive",
        )}
      >
        {cta}
      </Button>
    </motion.div>
  );
}

export function ReceiptActions({
  receipt,
  onCancel,
  onTransfer,
  onRefund,
}: {
  receipt: Receipt;
  onCancel: () => void;
  onTransfer: () => void;
  onRefund: () => void;
}) {
  const hasAny = receipt.state === "PAID";

  return (
    <section aria-labelledby="available-actions">
      <h2 id="available-actions" className="text-2xl font-semibold tracking-tight">
        Available actions
      </h2>
      <p className="mt-2 max-w-xl text-[15px] text-muted-foreground">
        These rights are attached to this receipt and change automatically with its lifecycle.
      </p>

      {hasAny ? (
        <div className="mt-6 space-y-4">
          <ActionCard
            icon={X}
            tone="danger"
            title="Cancel Order"
            description={`Cancel before settlement and receive your full ${receipt.amount} USDC.`}
            secondary={
              <>
                Available for <Countdown deadline={receipt.refundDeadline} format="long" />.
              </>
            }
            cta="Cancel Order"
            disabled={!canCancel(receipt)}
            onClick={onCancel}
          />
          <ActionCard
            icon={ArrowLeftRight}
            title="Transfer Claim"
            description="Give another wallet the right to collect or receive this purchase."
            cta="Transfer Claim"
            disabled={!canTransfer(receipt)}
            onClick={onTransfer}
          />
          <ActionCard
            icon={RotateCcw}
            title="Request Refund"
            description="Create an onchain request to return the purchase amount."
            cta="Request Refund"
            disabled={!canRefund(receipt)}
            onClick={onRefund}
          />
        </div>
      ) : (
        <div className="mt-6 rounded-[16px] border border-dashed border-border bg-secondary/40 px-6 py-10 text-center">
          <p className="text-sm font-medium">No actions available</p>
          <p className="mt-1 text-sm text-muted-foreground">
            This receipt's purchase rights are now closed.
          </p>
        </div>
      )}
    </section>
  );
}
