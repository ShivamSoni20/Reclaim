import { createServer } from "node:http";
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
import { namehash, packetToBytes } from "viem/ens";
import { sepolia } from "viem/chains";

const ARC_CHAIN_ID = 5_042_002;
const required = [
  "ARC_RPC_URL",
  "ARC_ESCROW_ADDRESS",
  "ENS_SEPOLIA_RPC_URL",
  "ENS_SYNC_SIGNER_PRIVATE_KEY",
  "ENS_RECEIPT_PARENT",
  "ENS_PARENT_REGISTRY",
  "ENS_PERMISSIONED_RESOLVER",
] as const;
for (const key of required)
  if (!process.env[key]) throw new Error(`Missing required server environment variable: ${key}`);
const escrow = getAddress(process.env.ARC_ESCROW_ADDRESS!);
const parentRegistry = getAddress(process.env.ENS_PARENT_REGISTRY!);
const resolver = getAddress(process.env.ENS_PERMISSIONED_RESOLVER!);
const parent = process.env.ENS_RECEIPT_PARENT!;
const account = privateKeyToAccount(process.env.ENS_SYNC_SIGNER_PRIVATE_KEY! as `0x${string}`);
const arc = createPublicClient({ transport: http(process.env.ARC_RPC_URL) });
const ens = createPublicClient({
  chain: sepolia,
  transport: http(process.env.ENS_SEPOLIA_RPC_URL),
});
const signer = createWalletClient({
  account,
  chain: sepolia,
  transport: http(process.env.ENS_SEPOLIA_RPC_URL),
});

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
];
const recent = new Map<string, number>();

function receiptName(orderId: bigint) {
  return `order-${orderId}.${parent}`;
}
function log(event: string, fields: Record<string, unknown>) {
  console.log(
    JSON.stringify({ timestamp: new Date().toISOString(), service: "ens-sync", event, ...fields }),
  );
}
async function ensureName(name: string, orderId: bigint) {
  const existing = await ens.getEnsResolver({ name }).catch(() => null);
  if (existing) return existing;
  const label = `order-${orderId}`;
  const expiry = BigInt(Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60);
  const hash = await signer.writeContract({
    address: parentRegistry,
    abi: registryAbi,
    functionName: "register",
    args: [
      label,
      account.address,
      "0x0000000000000000000000000000000000000000",
      resolver,
      0n,
      expiry,
    ],
  });
  await ens.waitForTransactionReceipt({ hash });
  return resolver;
}
async function syncOrder(orderId: bigint, arcTxHash?: Hash) {
  if (arcTxHash) {
    const tx = await arc.getTransactionReceipt({ hash: arcTxHash });
    if (tx.status !== "success" || tx.to?.toLowerCase() !== escrow.toLowerCase())
      throw new Error("Arc transaction is not a successful call to the configured escrow.");
  }
  const order = await arc.readContract({
    address: escrow,
    abi: escrowAbi,
    functionName: "getOrder",
    args: [orderId],
  });
  if (order.id !== orderId || order.status === 0)
    throw new Error("Order does not exist in the configured escrow.");
  const name = receiptName(orderId);
  const targetResolver = await ensureName(name, orderId);
  if (targetResolver.toLowerCase() !== resolver.toLowerCase())
    throw new Error("Receipt resolves through an unexpected resolver.");
  const currentOwner = await ens.getEnsText({ name, key: "receipt.claimOwner" }).catch(() => null);
  const now = BigInt(Math.floor(Date.now() / 1000));
  const actions = {
    cancel: order.status === 1 && now < order.cancelBefore,
    transfer: order.status === 1 && order.transferable,
    refund: order.status === 1 && now < order.refundBefore,
  };
  const records: Record<string, string> = {
    "receipt.version": "1",
    "receipt.type": "commerce",
    "receipt.status": states[order.status]!,
    "receipt.amount": formatUnits(order.amount, 6),
    "receipt.currency": "USDC",
    "receipt.chainId": String(ARC_CHAIN_ID),
    "receipt.contract": escrow,
    "receipt.orderId": orderId.toString(),
    "receipt.merchant": order.merchant,
    "receipt.claimOwner": order.claimOwner,
    "receipt.createdAt": order.createdAt.toString(),
    "receipt.cancelBefore": order.cancelBefore.toString(),
    "receipt.refundBefore": order.refundBefore.toString(),
    "receipt.transferable": String(order.transferable),
    "receipt.action.cancel": actions.cancel ? "available" : "unavailable",
    "receipt.action.transfer": actions.transfer ? "available" : "unavailable",
    "receipt.action.refund": actions.refund ? "available" : "unavailable",
  };
  const dnsName = toHex(packetToBytes(name));
  const calls = Object.entries(records).map(([key, value]) =>
    encodeFunctionData({
      abi: resolverAbi,
      functionName: "setText",
      args: [namehash(name), key, value],
    }),
  );
  if (
    currentOwner &&
    isAddress(currentOwner) &&
    currentOwner.toLowerCase() !== order.claimOwner.toLowerCase()
  )
    calls.push(
      encodeFunctionData({
        abi: resolverAbi,
        functionName: "authorizeTextRoles",
        args: [dnsName, "receipt.customerNote", currentOwner as Address, false],
      }),
    );
  calls.push(
    encodeFunctionData({
      abi: resolverAbi,
      functionName: "authorizeTextRoles",
      args: [dnsName, "receipt.customerNote", order.claimOwner, true],
    }),
  );
  const hash = await signer.writeContract({
    address: resolver,
    abi: resolverAbi,
    functionName: "multicall",
    args: [calls],
  });
  await ens.waitForTransactionReceipt({ hash });
  log("sync.complete", {
    orderId: orderId.toString(),
    receiptName: name,
    arcState: states[order.status],
    arcTxHash,
    ensTxHash: hash,
  });
  return {
    orderId: orderId.toString(),
    receiptName: name,
    arcState: states[order.status],
    ensTxHash: hash,
  };
}

createServer(async (request, response) => {
  try {
    if (request.method !== "POST" || request.url !== "/api/receipt-sync") {
      response.writeHead(404).end();
      return;
    }
    const ip = request.socket.remoteAddress ?? "unknown";
    const now = Date.now();
    if ((recent.get(ip) ?? 0) > now - 2_000) {
      response
        .writeHead(429, { "content-type": "application/json" })
        .end(JSON.stringify({ error: "Retry later" }));
      return;
    }
    recent.set(ip, now);
    let body = "";
    for await (const chunk of request) {
      body += chunk;
      if (body.length > 2048) throw new Error("Request too large");
    }
    const input = JSON.parse(body) as { orderId?: string | number; arcTxHash?: Hash };
    const orderId = BigInt(input.orderId ?? 0);
    if (orderId < 1n) throw new Error("Invalid orderId");
    const result = await syncOrder(orderId, input.arcTxHash);
    response.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(result));
  } catch (error) {
    log("sync.error", { message: error instanceof Error ? error.message : "Unknown error" });
    response.writeHead(400, { "content-type": "application/json" }).end(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Synchronization failed",
      }),
    );
  }
}).listen(Number(process.env.ENS_SYNC_PORT ?? 8788), () =>
  log("server.ready", { port: Number(process.env.ENS_SYNC_PORT ?? 8788) }),
);
