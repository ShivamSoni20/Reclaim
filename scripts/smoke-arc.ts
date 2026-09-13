import { readFile } from "node:fs/promises";
import {
  createPublicClient,
  createWalletClient,
  defineChain,
  erc20Abi,
  formatUnits,
  getAddress,
  http,
  parseEventLogs,
  type Abi,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
const CHAIN = 5042002,
  USDC = getAddress("0x3600000000000000000000000000000000000000"),
  EXPECTED = getAddress("0x65cf0a527a6ac533ae4473d361ae182494da1537"),
  MERCHANT = getAddress("0x620f495e239298490bE0117B4d0e836F71536B2b"),
  PRICE = 49000000n;
for (const k of ["ARC_RPC_URL", "BUYER_PRIVATE_KEY", "ARC_ESCROW_ADDRESS"] as const)
  if (!process.env[k]) throw new Error(`Missing smoke-test configuration: ${k}`);
const escrow = getAddress(process.env.ARC_ESCROW_ADDRESS!);
if (escrow !== EXPECTED) throw new Error(`Unexpected Arc escrow: ${escrow}`);
const buyer = privateKeyToAccount(process.env.BUYER_PRIVATE_KEY! as Hex),
  rpc = process.env.ARC_RPC_URL!;
const chain = defineChain({
  id: CHAIN,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: [rpc] } },
  blockExplorers: { default: { name: "ArcScan", url: "https://testnet.arcscan.app" } },
  testnet: true,
});
const transport = http(rpc, { timeout: 120000, retryCount: 0 }),
  pub = createPublicClient({ chain, transport }),
  wallet = createWalletClient({ account: buyer, chain, transport });
const artifact = JSON.parse(
  await readFile("contracts/out/ExecutableReceiptEscrow.sol/ExecutableReceiptEscrow.json", "utf8"),
) as { abi: Abi };
if ((await pub.getChainId()) !== CHAIN) throw new Error("Wrong Arc chain ID");
const code = await pub.getCode({ address: escrow });
if (!code || code === "0x") throw new Error("Escrow has no bytecode");
const [merchant, usdc, price, transferable, cw, rw] = await Promise.all([
  pub.readContract({ address: escrow, abi: artifact.abi, functionName: "merchant" }),
  pub.readContract({ address: escrow, abi: artifact.abi, functionName: "usdc" }),
  pub.readContract({
    address: escrow,
    abi: artifact.abi,
    functionName: "productPrice",
    args: [1n],
  }),
  pub.readContract({
    address: escrow,
    abi: artifact.abi,
    functionName: "productTransferable",
    args: [1n],
  }),
  pub.readContract({ address: escrow, abi: artifact.abi, functionName: "cancelWindow" }),
  pub.readContract({ address: escrow, abi: artifact.abi, functionName: "refundWindow" }),
]);
if (
  getAddress(merchant as string) !== MERCHANT ||
  getAddress(usdc as string) !== USDC ||
  price !== PRICE ||
  transferable !== true ||
  cw !== 900n ||
  rw !== 900n
)
  throw new Error("Deployed escrow configuration mismatch");
const balances = () =>
  Promise.all([
    pub.getBalance({ address: buyer.address }),
    pub.readContract({
      address: USDC,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [buyer.address],
    }),
    pub.readContract({ address: USDC, abi: erc20Abi, functionName: "balanceOf", args: [escrow] }),
  ]);
const [gas, before, escrowBefore] = await balances(),
  allowance = await pub.readContract({
    address: USDC,
    abi: erc20Abi,
    functionName: "allowance",
    args: [buyer.address, escrow],
  });
console.log(
  JSON.stringify({
    phase: "preflight",
    chainId: CHAIN,
    escrow,
    buyer: buyer.address,
    gasBalance: gas.toString(),
    usdcBalance: before.toString(),
    allowance: allowance.toString(),
  }),
);
if (before < PRICE || gas === 0n) {
  console.log(
    JSON.stringify({
      status: "LIFECYCLE TEST: BLOCKED ON BUYER FUNDING",
      buyer: buyer.address,
      usdcRequired: "49 USDC",
      currentUsdcBalance: `${formatUnits(before, 6)} USDC`,
      gasBalance: gas.toString(),
      transactionBroadcast: false,
    }),
  );
  process.exit(2);
}
let approvalTransaction: Hex | null = null;
if (allowance < PRICE) {
  approvalTransaction = await wallet.writeContract({
    address: USDC,
    abi: erc20Abi,
    functionName: "approve",
    args: [escrow, PRICE],
  });
  if ((await pub.waitForTransactionReceipt({ hash: approvalTransaction })).status !== "success")
    throw new Error("Approval failed");
}
const purchaseTransaction = await wallet.writeContract({
  address: escrow,
  abi: artifact.abi,
  functionName: "purchase",
  args: [1n],
});
const pr = await pub.waitForTransactionReceipt({ hash: purchaseTransaction });
if (pr.status !== "success") throw new Error("Purchase failed");
const [created] = parseEventLogs({ abi: artifact.abi, eventName: "OrderCreated", logs: pr.logs });
if (!created || !("orderId" in created.args)) throw new Error("OrderCreated missing");
const orderId = created.args.orderId as bigint;
const [paid, actions, afterPurchase, escrowAfterPurchase] = await Promise.all([
  pub.readContract({
    address: escrow,
    abi: artifact.abi,
    functionName: "getOrder",
    args: [orderId],
  }),
  pub.readContract({
    address: escrow,
    abi: artifact.abi,
    functionName: "getAvailableActions",
    args: [orderId, buyer.address],
  }),
  pub.readContract({
    address: USDC,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [buyer.address],
  }),
  pub.readContract({ address: USDC, abi: erc20Abi, functionName: "balanceOf", args: [escrow] }),
]);
const p = paid as { buyer: string; claimOwner: string; amount: bigint; status: number };
if (
  p.status !== 1 ||
  getAddress(p.buyer) !== buyer.address ||
  getAddress(p.claimOwner) !== buyer.address ||
  p.amount !== PRICE ||
  ((actions as number) & 1) === 0
)
  throw new Error("Purchase state mismatch");
const cancelTransaction = await wallet.writeContract({
  address: escrow,
  abi: artifact.abi,
  functionName: "cancel",
  args: [orderId],
});
if ((await pub.waitForTransactionReceipt({ hash: cancelTransaction })).status !== "success")
  throw new Error("Cancel failed");
const [cancelled, noActions, afterCancel, escrowAfterCancel] = await Promise.all([
  pub.readContract({
    address: escrow,
    abi: artifact.abi,
    functionName: "getOrder",
    args: [orderId],
  }),
  pub.readContract({
    address: escrow,
    abi: artifact.abi,
    functionName: "getAvailableActions",
    args: [orderId, buyer.address],
  }),
  pub.readContract({
    address: USDC,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [buyer.address],
  }),
  pub.readContract({ address: USDC, abi: erc20Abi, functionName: "balanceOf", args: [escrow] }),
]);
const c = cancelled as { status: number; claimOwner: string };
if (
  c.status !== 3 ||
  ((noActions as number) & 1) !== 0 ||
  afterCancel !== before ||
  escrowAfterCancel !== escrowAfterPurchase - PRICE
)
  throw new Error("Cancellation/refund state mismatch");
console.log(
  JSON.stringify({
    status: "LIFECYCLE TEST: PASS",
    chainId: CHAIN,
    escrow,
    buyer: buyer.address,
    product: "49 USDC",
    approvalTransaction,
    purchaseTransaction,
    orderId: orderId.toString(),
    cancelTransaction,
    statusAfterPurchase: "PAID",
    statusAfterCancel: "CANCELLED",
    claimOwner: c.claimOwner,
    buyerBalanceBefore: before.toString(),
    buyerBalanceAfterPurchase: afterPurchase.toString(),
    buyerBalanceAfterCancel: afterCancel.toString(),
    escrowBalanceBefore: escrowBefore.toString(),
    escrowBalanceAfterPurchase: escrowAfterPurchase.toString(),
    escrowBalanceAfterCancel: escrowAfterCancel.toString(),
    purchaseExplorer: `https://testnet.arcscan.app/tx/${purchaseTransaction}`,
    cancelExplorer: `https://testnet.arcscan.app/tx/${cancelTransaction}`,
  }),
);
