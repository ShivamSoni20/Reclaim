import { Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { shortAddress } from "@/lib/receipts";
import { connectWallet, useWallet } from "@/lib/wallet";
import { cn } from "@/lib/utils";

export function WalletButton({ className }: { className?: string }) {
  const wallet = useWallet();

  if (wallet.status === "connected" && wallet.address) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium">
          <span className="size-1.5 rounded-full bg-success" aria-hidden />
          <span className="font-mono">{shortAddress(wallet.address)}</span>
        </span>
        <span className="hidden rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground sm:inline-flex">
          {wallet.chain}
        </span>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      className={cn("rounded-full", className)}
      onClick={() => void connectWallet()}
      disabled={wallet.status === "connecting"}
    >
      {wallet.status === "connecting" ? (
        <Loader2 className="size-4 animate-spin" aria-hidden />
      ) : (
        <Wallet className="size-4" aria-hidden />
      )}
      {wallet.status === "connecting" ? "Connecting wallet" : "Connect wallet"}
    </Button>
  );
}
