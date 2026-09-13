import {
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  formatUnits,
  getAddress,
  http,
  isAddress,
  parseAbi,
  toHex,
  type Address,
  type Hash,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { namehash, normalize, packetToBytes } from "viem/ens";
import { sepolia } from "viem/chains";

export const ARC_CHAIN_ID = 5_042_002;
export const RECEIPT_KEYS = [
  "receipt.version",
  "receipt.type",
  "receipt.status",
  "receipt.amount",
  "receipt.currency",
  "receipt.chainId",
  "receipt.contract",
  "receipt.orderId",
  "receipt.merchant",
  "receipt.claimOwner",
  "receipt.createdAt",
  "receipt.cancelBefore",
  "receipt.refundBefore",
  "receipt.transferable",
  "receipt.action.cancel",
  "receipt.action.transfer",
  "receipt.action.refund",
] as const;
const REQUIRED = [
  "ARC_RPC_URL",
  "ARC_ESCROW_ADDRESS",
  "ENS_SEPOLIA_RPC_URL",
  "ENS_SYNC_SIGNER_PRIVATE_KEY",
  "ENS_RECEIPT_PARENT",
  "ENS_PARENT_REGISTRY",
  "ENS_PERMISSIONED_RESOLVER",
] as const;
const escrowAbi = parseAbi([
  "function getOrder(uint256) view returns ((uint256 id,address buyer,address merchant,address claimOwner,uint256 amount,uint64 createdAt,uint64 cancelBefore,uint64 refundBefore,uint8 status,bool transferable))",
]);
const registryAbi = parseAbi([
  "function register(string label,address owner,address registry,address resolver,uint256 roleBitmap,uint64 expiry) returns (uint256)",
]);
const resolverAbi = parseAbi([
  "function setText(bytes32 node,string key,string value)",
  "function multicall(bytes[] data) returns (bytes[])",
  "function authorizeTextRoles(bytes toName,string key,address account,bool grant)",
]);
const states = [
  "NONE",
  "PAID",
  "REFUND_REQUESTED",
  "CANCELLED",
  "REFUNDED",
  "FINALIZED",
  "DISPUTED",
] as const;

export function loadConfig() {
  for (const key of REQUIRED)
    if (!process.env[key]) throw new Error(`Missing required server environment variable: ${key}`);
  let parent: string;
  try {
    parent = normalize(process.env.ENS_RECEIPT_PARENT!);
  } catch {
    throw new Error("ENS_RECEIPT_PARENT is not a valid normalized ENS name.");
  }
  if (parent.startsWith("order-"))
    throw new Error("ENS_RECEIPT_PARENT must be a parent namespace, not a receipt name.");
  return {
    arcRpc: process.env.ARC_RPC_URL!,
    escrow: getAddress(process.env.ARC_ESCROW_ADDRESS!),
    ensRpc: process.env.ENS_SEPOLIA_RPC_URL!,
    signerKey: process.env.ENS_SYNC_SIGNER_PRIVATE_KEY! as `0x${string}`,
    parent,
    parentRegistry: getAddress(process.env.ENS_PARENT_REGISTRY!),
    resolver: getAddress(process.env.ENS_PERMISSIONED_RESOLVER!),
  };
}

export function createContext() {
  const config = loadConfig();
  const account = privateKeyToAccount(config.signerKey);
  return {
    config,
    account,
    arc: createPublicClient({ transport: http(config.arcRpc) }),
    ens: createPublicClient({ chain: sepolia, transport: http(config.ensRpc) }),
    signer: createWalletClient({ account, chain: sepolia, transport: http(config.ensRpc) }),
  };
}

export type SyncContext = ReturnType<typeof createContext>;
export function receiptName(orderId: bigint, parent = loadConfig().parent) {
  return normalize(`order-${orderId}.${parent}`);
}
export async function readCanonicalOrder(context: SyncContext, orderId: bigint) {
  const order = await context.arc.readContract({
    address: context.config.escrow,
    abi: escrowAbi,
    functionName: "getOrder",
    args: [orderId],
  });
  if (order.id !== orderId || order.status === 0)
    throw new Error("Order does not exist in the configured escrow.");
  return order;
}
export function deriveRecords(
  context: SyncContext,
  orderId: bigint,
  order: Awaited<ReturnType<typeof readCanonicalOrder>>,
) {
  const now = BigInt(Math.floor(Date.now() / 1000));
  return {
    "receipt.version": "1",
    "receipt.type": "commerce",
    "receipt.status": states[order.status]!,
    "receipt.amount": formatUnits(order.amount, 6),
    "receipt.currency": "USDC",
    "receipt.chainId": String(ARC_CHAIN_ID),
    "receipt.contract": context.config.escrow,
    "receipt.orderId": orderId.toString(),
    "receipt.merchant": order.merchant,
    "receipt.claimOwner": order.claimOwner,
    "receipt.createdAt": order.createdAt.toString(),
    "receipt.cancelBefore": order.cancelBefore.toString(),
    "receipt.refundBefore": order.refundBefore.toString(),
    "receipt.transferable": String(order.transferable),
    "receipt.action.cancel":
      order.status === 1 && now < order.cancelBefore ? "available" : "unavailable",
    "receipt.action.transfer":
      order.status === 1 && order.transferable ? "available" : "unavailable",
    "receipt.action.refund":
      order.status === 1 && now < order.refundBefore ? "available" : "unavailable",
  } satisfies Record<(typeof RECEIPT_KEYS)[number], string>;
}
async function ensureName(context: SyncContext, name: string, orderId: bigint) {
  const existing = await context.ens.getEnsResolver({ name }).catch(() => null);
  if (existing) return { resolver: existing, registrationTxHash: undefined };
  const hash = await context.signer.writeContract({
    address: context.config.parentRegistry,
    abi: registryAbi,
    functionName: "register",
    args: [
      `order-${orderId}`,
      context.account.address,
      "0x0000000000000000000000000000000000000000",
      context.config.resolver,
      0n,
      BigInt(Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60),
    ],
  });
  await context.ens.waitForTransactionReceipt({ hash });
  return { resolver: context.config.resolver, registrationTxHash: hash };
}
export async function readReceiptRecords(context: SyncContext, name: string) {
  const values = await Promise.all(
    RECEIPT_KEYS.map((key) => context.ens.getEnsText({ name, key }).catch(() => null)),
  );
  return Object.fromEntries(RECEIPT_KEYS.map((key, index) => [key, values[index] ?? ""])) as Record<
    (typeof RECEIPT_KEYS)[number],
    string
  >;
}
export async function syncOrder(orderId: bigint, arcTxHash?: Hash, context = createContext()) {
  if (arcTxHash) {
    const tx = await context.arc.getTransactionReceipt({ hash: arcTxHash });
    if (tx.status !== "success" || tx.to?.toLowerCase() !== context.config.escrow.toLowerCase())
      throw new Error("Arc transaction is not a successful call to the configured escrow.");
  }
  const order = await readCanonicalOrder(context, orderId);
  const name = receiptName(orderId, context.config.parent);
  const ensured = await ensureName(context, name, orderId);
  if (ensured.resolver.toLowerCase() !== context.config.resolver.toLowerCase())
    throw new Error("Receipt resolves through an unexpected resolver.");
  const current = await readReceiptRecords(context, name);
  const desired = deriveRecords(context, orderId, order);
  const changed = RECEIPT_KEYS.filter((key) => current[key] !== desired[key]);
  const previousOwner = current["receipt.claimOwner"];
  if (changed.length === 0 && previousOwner.toLowerCase() === order.claimOwner.toLowerCase())
    return {
      orderId: orderId.toString(),
      receiptName: name,
      arcState: states[order.status],
      alreadySynced: true,
      registrationTxHash: ensured.registrationTxHash,
    };
  const dnsName = toHex(packetToBytes(name));
  const calls = changed.map((key) =>
    encodeFunctionData({
      abi: resolverAbi,
      functionName: "setText",
      args: [namehash(name), key, desired[key]],
    }),
  );
  if (
    previousOwner &&
    isAddress(previousOwner) &&
    previousOwner.toLowerCase() !== order.claimOwner.toLowerCase()
  )
    calls.push(
      encodeFunctionData({
        abi: resolverAbi,
        functionName: "authorizeTextRoles",
        args: [dnsName, "receipt.customerNote", previousOwner as Address, false],
      }),
    );
  calls.push(
    encodeFunctionData({
      abi: resolverAbi,
      functionName: "authorizeTextRoles",
      args: [dnsName, "receipt.customerNote", order.claimOwner, true],
    }),
  );
  const hash = await context.signer.writeContract({
    address: context.config.resolver,
    abi: resolverAbi,
    functionName: "multicall",
    args: [calls],
  });
  await context.ens.waitForTransactionReceipt({ hash });
  const verified = await readReceiptRecords(context, name);
  if (RECEIPT_KEYS.some((key) => verified[key] !== desired[key]))
    throw new Error("ENS transaction confirmed, but receipt records do not match Arc state.");
  return {
    orderId: orderId.toString(),
    receiptName: name,
    arcState: states[order.status],
    alreadySynced: false,
    changedKeys: changed,
    registrationTxHash: ensured.registrationTxHash,
    ensTxHash: hash,
  };
}
