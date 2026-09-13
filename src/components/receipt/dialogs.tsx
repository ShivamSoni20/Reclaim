import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { shortAddress, type Receipt } from "@/lib/receipts";

export function CancelDialog({
  receipt,
  open,
  onOpenChange,
  onConfirm,
}: {
  receipt: Receipt;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[18px] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl tracking-tight">Cancel this purchase?</DialogTitle>
          <DialogDescription>
            Your purchase will be cancelled and {receipt.amount} USDC will be returned to{" "}
            <span className="font-mono text-foreground">{shortAddress(receipt.buyer)}</span>.
          </DialogDescription>
        </DialogHeader>

        <dl className="space-y-3 rounded-xl border border-border bg-secondary/60 p-4 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">Amount returned</dt>
            <dd className="font-semibold">{receipt.amount} USDC</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">Receipt</dt>
            <dd className="truncate font-mono text-[13px]">{receipt.name}</dd>
          </div>
        </dl>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" className="rounded-full" onClick={() => onOpenChange(false)}>
            Keep Order
          </Button>
          <Button
            className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onConfirm}
          >
            Cancel &amp; Refund
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TransferDialog({
  receipt,
  open,
  onOpenChange,
  onConfirm,
}: {
  receipt: Receipt;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (recipient: string) => void;
}) {
  const [value, setValue] = useState("");
  const valid = value.trim().length > 3;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[18px] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl tracking-tight">Transfer purchase claim</DialogTitle>
          <DialogDescription>
            The recipient will become the new holder of the pickup and purchase claim for this
            receipt.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="recipient">Wallet address or ENS name</Label>
          <Input
            id="recipient"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="bob.eth or 0x..."
            className="rounded-xl font-mono"
            autoComplete="off"
          />
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary/60 p-4 text-sm">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Current holder</p>
            <p className="truncate font-mono text-[13px]">{shortAddress(receipt.claimOwner)}</p>
          </div>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <div className="min-w-0 text-right">
            <p className="text-xs text-muted-foreground">New holder</p>
            <p className="truncate font-mono text-[13px]">{value.trim() || "—"}</p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" className="rounded-full" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="rounded-full"
            disabled={!valid}
            onClick={() => onConfirm(value.trim())}
          >
            Transfer Claim
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
