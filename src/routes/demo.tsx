import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { BadgeCheck, ArrowLeftRight, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/site/Header";
import { WalletButton } from "@/components/receipt/WalletButton";
import { Button } from "@/components/ui/button";
import { addLivePurchase, makeDemoPurchase } from "@/lib/receipts";
import { connectWallet, getWalletClient, useWallet } from "@/lib/wallet";
import { LIVE_ENABLED, purchaseOnArc, synchronizeEns } from "@/lib/web3";
import productImage from "@/assets/arc-one.jpg";

export const Route = createFileRoute("/demo")({
  head: () => {
    const title = "Buy Arc One with USDC — Executable Receipts";
    const description =
      "Try the demo: buy Arc One for 49 USDC on Arc and receive an executable ENSv2 receipt you can cancel, transfer or refund.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: DemoPage,
});

function DemoPage() {
  const navigate = useNavigate();
  const wallet = useWallet();
  const [buying, setBuying] = useState(false);
  const [stage, setStage] = useState("Preparing purchase");

  async function buy() {
    if (!LIVE_ENABLED) {
      const receipt = makeDemoPurchase();
      await navigate({ to: "/receipt/$name", params: { name: receipt.name } });
      return;
    }
    setBuying(true);
    try {
      setStage("Connecting wallet and switching to Arc Testnet");
      const account = wallet.address ?? (await connectWallet());
      setStage("Approving USDC and funding programmable escrow");
      const result = await purchaseOnArc(getWalletClient(), account);
      const receipt = addLivePurchase({
        ...result,
        buyer: account,
        orderId: result.orderId,
        txHash: result.hash,
      });
      setStage("Synchronizing the ENSv2 receipt");
      try {
        const sync = await synchronizeEns(receipt.order, result.hash);
        if (!sync.synced)
          toast.warning("Arc purchase confirmed", {
            description:
              "ENS sync is not configured; the receipt still points to verified Arc state.",
          });
      } catch (syncError) {
        toast.warning("Arc purchase confirmed; ENS sync is pending", {
          description:
            syncError instanceof Error
              ? syncError.message
              : "The receipt can be synchronized again.",
        });
      }
      await navigate({ to: "/receipt/$name", params: { name: receipt.name } });
    } catch (error) {
      toast.error("Purchase was not completed", {
        description:
          error instanceof Error ? error.message : "The wallet rejected the transaction.",
      });
      setBuying(false);
    }
  }

  return (
    <div className="atmosphere min-h-screen">
      <Header />

      <main className="mx-auto max-w-[1080px] px-6 pt-32 pb-28 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h1 className="text-[32px] font-semibold tracking-tight">Demo storefront</h1>
            <p className="mt-2 text-[15px] text-muted-foreground">
              A normal checkout. The difference shows up afterwards, in the receipt.
            </p>
          </div>
          <WalletButton />
        </div>

        <section className="mt-10 grid items-center gap-10 rounded-[20px] border border-border bg-card p-8 shadow-soft sm:p-10 lg:grid-cols-2">
          <div className="overflow-hidden rounded-[16px] bg-secondary">
            <img
              src={productImage}
              alt="Arc One limited edition hardware wallet case"
              width={1024}
              height={1024}
              className="h-full w-full object-cover"
            />
          </div>

          <div>
            <h2 className="text-3xl font-semibold tracking-tight">Arc One</h2>
            <p className="mt-2 text-[15px] text-muted-foreground">
              Limited Edition Hardware Wallet Case
            </p>

            <p className="mt-8 text-4xl font-semibold tracking-tight">
              49 <span className="text-lg font-medium text-muted-foreground">USDC</span>
            </p>

            <ul className="mt-7 flex flex-wrap gap-2">
              {[
                { icon: RotateCcw, label: "Refundable" },
                { icon: ArrowLeftRight, label: "Transferable Claim" },
                { icon: BadgeCheck, label: "Arc Settlement" },
              ].map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/70 px-3 py-1.5 text-xs font-medium text-muted-foreground"
                >
                  <Icon className="size-3.5" aria-hidden />
                  {label}
                </li>
              ))}
            </ul>

            <Button
              size="lg"
              className="mt-9 w-full rounded-full"
              onClick={() => void buy()}
              disabled={buying}
            >
              {buying ? stage : LIVE_ENABLED ? "Buy with 49 USDC" : "Preview demo purchase"}
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {LIVE_ENABLED
                ? "Live Arc Testnet · wallet confirmation required"
                : "Preview mode · deploy and configure the escrow to move testnet USDC"}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
