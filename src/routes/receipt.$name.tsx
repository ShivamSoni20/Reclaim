import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/site/Header";
import {
  Countdown,
  EnsName,
  ReceiptStatus,
  TimeText,
  UsdcAmount,
} from "@/components/receipt/primitives";
import { ReceiptLifecycle } from "@/components/receipt/ReceiptLifecycle";
import { ReceiptActions } from "@/components/receipt/ReceiptActions";
import { ReceiptPermissions } from "@/components/receipt/ReceiptPermissions";
import { ReceiptInfrastructure } from "@/components/receipt/ReceiptInfrastructure";
import { CancelDialog, TransferDialog } from "@/components/receipt/dialogs";
import { Button } from "@/components/ui/button";
import {
  cancelReceipt,
  applyArcOrder,
  formatDeadline,
  markRefundRequested,
  shortAddress,
  transferClaim,
  useReceipt,
} from "@/lib/receipts";
import { connectWallet, getWalletClient, useWallet } from "@/lib/wallet";
import { LIVE_ENABLED, readOrderOnArc, synchronizeEns, writeOrderAction } from "@/lib/web3";
import { getAddress } from "viem";
import { recordsMatchArc, resolveReceiptName } from "@/lib/ens";

export const Route = createFileRoute("/receipt/$name")({
  head: ({ params }) => {
    const title = `${params.name} — Executable Receipt`;
    const description =
      "An executable receipt: view the purchase, its lifecycle and the rights still attached to it on Arc.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: ReceiptPage,
});

function ReceiptPage() {
  const { name } = Route.useParams();
  const receipt = useReceipt(name);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [flow, setFlow] = useState<"idle" | "cancelling" | "transferring">("idle");
  const [justCancelled, setJustCancelled] = useState(false);
  const [stage, setStage] = useState("");
  const [syncPending, setSyncPending] = useState(false);
  const wallet = useWallet();

  useEffect(() => {
    if (!LIVE_ENABLED) return;
    void resolveReceiptName(name)
      .then(async (resolved) => {
        const order = await readOrderOnArc(
          resolved.orderId,
          resolved.contract,
          wallet.address ?? undefined,
        );
        const synced = recordsMatchArc(resolved.records, order);
        applyArcOrder(resolved.name, {
          ...order,
          order: resolved.orderId,
          settlementContract: resolved.contract,
          arcVerified: true,
          ensResolved: true,
          ensSynced: synced,
          ensResolver: resolved.resolver,
        });
        setSyncPending(!synced);
      })
      .catch((error: unknown) =>
        toast.error("Could not verify Arc settlement", {
          description: error instanceof Error ? error.message : "Arc RPC request failed.",
        }),
      );
  }, [name, wallet.address]);

  async function execute(action: "cancel" | "requestRefund" | "transferClaim", recipient?: string) {
    if (!receipt) return;
    const flowName = action === "cancel" ? "cancelling" : "transferring";
    setFlow(flowName);
    try {
      if (LIVE_ENABLED) {
        setStage("Waiting for wallet confirmation on Arc Testnet");
        const account = wallet.address ?? (await connectWallet());
        const resolvedRecipient = recipient ? getAddress(recipient) : undefined;
        const hash = await writeOrderAction(
          getWalletClient(),
          account,
          action,
          receipt.order,
          resolvedRecipient,
        );
        const canonical = await readOrderOnArc(receipt.order, undefined, account);
        const expectedState =
          action === "cancel"
            ? "CANCELLED"
            : action === "requestRefund"
              ? "REFUND_REQUESTED"
              : "PAID";
        if (canonical.state !== expectedState)
          throw new Error(
            `Arc confirmed, but order state is ${canonical.state}, expected ${expectedState}.`,
          );
        if (
          action === "transferClaim" &&
          canonical.claimOwner.toLowerCase() !== recipient!.toLowerCase()
        )
          throw new Error("Arc confirmed, but the claim owner did not update.");
        applyArcOrder(receipt.name, {
          ...canonical,
          arcVerified: true,
          ...(action === "cancel" ? { refundTxHash: hash, refundedAmount: canonical.amount } : {}),
        });

        setStage("Arc confirmed. Synchronizing the ENSv2 receipt");
        try {
          await synchronizeEns(receipt.order, hash);
          const resolvedAfterSync = await resolveReceiptName(receipt.name);
          if (!recordsMatchArc(resolvedAfterSync.records, canonical))
            throw new Error("ENS transaction confirmed, but records remain stale.");
          applyArcOrder(receipt.name, {
            ensResolved: true,
            ensSynced: true,
            ensResolver: resolvedAfterSync.resolver,
          });
          setSyncPending(false);
        } catch (syncError) {
          applyArcOrder(receipt.name, { ensSynced: false });
          setSyncPending(true);
          toast.warning("Arc confirmed; ENS sync needs retry", {
            description: syncError instanceof Error ? syncError.message : "Resolver update failed.",
          });
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 700));
        if (action === "cancel") cancelReceipt(receipt.name);
        else if (action === "requestRefund") markRefundRequested(receipt.name);
        else transferClaim(receipt.name, recipient!);
      }

      if (action === "cancel") setJustCancelled(true);
      toast.success(
        action === "cancel"
          ? "Order cancelled and refunded"
          : action === "requestRefund"
            ? "Refund requested"
            : "Claim transferred",
      );
    } catch (error) {
      toast.error("Transaction was not completed", {
        description:
          error instanceof Error ? error.message : "The wallet rejected the transaction.",
      });
    } finally {
      setFlow("idle");
    }
  }

  if (!receipt) {
    return (
      <div className="min-h-screen atmosphere">
        <Header />
        <main className="mx-auto max-w-[720px] px-6 pt-40 pb-24 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Receipt not found</h1>
          <p className="mt-3 text-muted-foreground">
            No executable receipt resolves to <span className="font-mono">{name}</span>.
          </p>
          <Button asChild className="mt-8 rounded-full">
            <Link to="/dashboard">Back to your receipts</Link>
          </Button>
        </main>
      </div>
    );
  }

  if (flow !== "idle") {
    return (
      <div className="atmosphere min-h-screen">
        <Header />
        <main className="mx-auto flex max-w-[1280px] items-center justify-center px-6 pt-44 pb-24">
          <section
            aria-live="polite"
            className="w-full max-w-xl rounded-[18px] border border-border bg-card p-8 text-center shadow-soft"
          >
            <Loader2 className="mx-auto size-7 animate-spin text-primary" aria-hidden />
            <h2 className="mt-5 text-xl font-semibold">
              {flow === "cancelling" ? "Cancelling order" : "Updating receipt rights"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {stage || (LIVE_ENABLED ? "Preparing Arc transaction" : "Running preview flow")}
            </p>
          </section>
        </main>
      </div>
    );
  }

  const info: [string, React.ReactNode][] = [
    ["Merchant", <span className="font-mono">{receipt.merchant}</span>],
    ["Claim Owner", <span className="font-mono">{shortAddress(receipt.claimOwner)}</span>],
    ["Settlement Network", receipt.network],
    ["Order", `#${receipt.order}`],
    ["Refund Before", <TimeText>{formatDeadline(receipt.refundDeadline)}</TimeText>],
    ["Transferable", receipt.transferable ? "Yes" : "No"],
  ];

  return (
    <div className="atmosphere min-h-screen">
      <Header />

      <main className="mx-auto max-w-[1080px] px-6 pt-32 pb-28 lg:px-8">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Your receipts
        </Link>

        {/* Hero panel */}
        <section className="mt-6 overflow-hidden rounded-[20px] border border-border bg-card shadow-soft">
          <div className="p-8 sm:p-10">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
                  Executable Receipt
                </p>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-[32px]">
                  {receipt.product}
                </h1>
                <EnsName
                  name={receipt.name}
                  copyable
                  className="mt-3 text-[15px] text-muted-foreground"
                />
              </div>
              <ReceiptStatus state={receipt.state} />
            </div>

            <div className="mt-10 flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-5xl font-semibold tracking-tight sm:text-6xl">
                  <UsdcAmount amount={receipt.amount} symbolClassName="text-xl" />
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  {receipt.state === "PAID"
                    ? "Held in programmable settlement on Arc."
                    : receipt.state === "CANCELLED"
                      ? "Returned to the claim owner on Arc."
                      : "Settled to the merchant on Arc."}
                </p>
              </div>
              {receipt.state === "PAID" && (
                <div className="rounded-xl border border-border bg-secondary/60 px-5 py-4">
                  <p className="text-xs text-muted-foreground">Settlement in</p>
                  <p className="mt-1 text-2xl font-semibold">
                    <Countdown deadline={receipt.refundDeadline} />
                  </p>
                </div>
              )}
            </div>
          </div>

          <AnimatePresence>
            {justCancelled && receipt.state === "CANCELLED" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.3 }}
                className="border-t border-border bg-success/8 px-8 py-6 sm:px-10"
              >
                <p className="flex items-center gap-2 text-lg font-semibold text-success">
                  <CheckCircle2 className="size-5" aria-hidden />
                  {receipt.refundedAmount ?? receipt.amount} USDC returned
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  The payment has been refunded and the receipt's purchase rights are now closed.
                </p>
                <div className="mt-4 flex flex-wrap gap-5 text-sm font-medium text-primary">
                  <a
                    href="https://explorer.arc.network"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 hover:opacity-80"
                  >
                    View Arc transaction <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                  <a
                    href="https://app.ens.domains"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 hover:opacity-80"
                  >
                    Inspect updated ENS receipt <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <div className="mt-6 space-y-6">
          <ReceiptLifecycle receipt={receipt} />

          {/* Receipt information */}
          <section className="rounded-[18px] border border-border bg-card p-6 shadow-soft sm:p-7">
            <h2 className="text-sm font-semibold tracking-tight">Receipt information</h2>
            <dl className="mt-6 grid gap-x-10 gap-y-5 sm:grid-cols-2">
              {info.map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-baseline justify-between gap-4 border-b border-border pb-4 last:border-0"
                >
                  <dt className="text-sm text-muted-foreground">{k}</dt>
                  <dd className="text-sm font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <div className="pt-6">
            <ReceiptActions
              receipt={receipt}
              onCancel={() => setCancelOpen(true)}
              onTransfer={() => setTransferOpen(true)}
              onRefund={() => void execute("requestRefund")}
            />
          </div>

          <ReceiptPermissions receipt={receipt} />
          {syncPending && LIVE_ENABLED && (
            <section className="rounded-[18px] border border-warning/30 bg-warning/5 p-6">
              <h2 className="text-sm font-semibold">Arc is confirmed; ENS is pending</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                The financial transaction succeeded. Retry the derived ENS receipt records safely.
              </p>
              <Button
                variant="outline"
                className="mt-4 rounded-full"
                onClick={() => {
                  void synchronizeEns(receipt.order)
                    .then(async () => {
                      const [canonical, resolved] = await Promise.all([
                        readOrderOnArc(receipt.order, undefined, wallet.address ?? undefined),
                        resolveReceiptName(receipt.name),
                      ]);
                      if (!recordsMatchArc(resolved.records, canonical))
                        throw new Error("ENS transaction confirmed, but records remain stale.");
                      applyArcOrder(receipt.name, {
                        ...canonical,
                        arcVerified: true,
                        ensResolved: true,
                        ensSynced: true,
                        ensResolver: resolved.resolver,
                      });
                      setSyncPending(false);
                      toast.success("ENS receipt synchronized");
                    })
                    .catch((error: unknown) =>
                      toast.error("ENS sync still pending", {
                        description:
                          error instanceof Error ? error.message : "Resolver update failed.",
                      }),
                    );
                }}
              >
                Retry ENS Sync
              </Button>
            </section>
          )}

          <ReceiptInfrastructure receipt={receipt} />
        </div>
      </main>

      <CancelDialog
        receipt={receipt}
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        onConfirm={() => {
          setCancelOpen(false);
          void execute("cancel");
        }}
      />
      <TransferDialog
        receipt={receipt}
        open={transferOpen}
        onOpenChange={setTransferOpen}
        onConfirm={(recipient) => {
          setTransferOpen(false);
          void execute("transferClaim", recipient);
        }}
      />
    </div>
  );
}
