import {
  createPublicClient,
  defineChain,
  formatUnits,
  getAddress,
  http,
  parseAbi,
  parseEventLogs,
  parseUnits,
  type Address,
  type EIP1193Provider,
  type Hash,
} from "viem";

export const ARC_CHAIN_ID = 5_042_002;
export const ARC_USDC = "0x3600000000000000000000000000000000000000" as Address;
export const ARC_EXPLORER = "https://testnet.arcscan.app";
export const ARC_RPC = import.meta.env.VITE_ARC_RPC_URL || "https://rpc.testnet.arc.network";
export const ESCROW_ADDRESS = import.meta.env.VITE_ESCROW_ADDRESS as Address | undefined;
export const ENS_SYNC_URL = import.meta.env.VITE_ENS_SYNC_URL as string | undefined;
export const LIVE_ENABLED = Boolean(
  ESCROW_ADDRESS && ESCROW_ADDRESS !== "0x0000000000000000000000000000000000000000",
);

export const arcTestnet = defineChain({
  id: ARC_CHAIN_ID,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: [ARC_RPC] } },
  blockExplorers: { default: { name: "Arcscan", url: ARC_EXPLORER } },
  testnet: true,
});

export const escrowAbi = parseAbi([
  "function purchase(uint256 productId) returns (uint256 orderId)",
  "function cancel(uint256 orderId)",
  "function requestRefund(uint256 orderId)",
  "function transferClaim(uint256 orderId,address newOwner)",
  "function getOrder(uint256 orderId) view returns ((uint256 id,address buyer,address merchant,address claimOwner,uint256 amount,uint64 createdAt,uint64 cancelBefore,uint64 refundBefore,uint8 status,bool transferable))",
  "function getAvailableActions(uint256 orderId,address actor) view returns (uint8)",
  "event OrderCreated(uint256 indexed orderId,address indexed buyer,address indexed merchant,uint256 amount,uint64 cancelBefore,uint64 refundBefore,bool transferable)",
  "event ClaimTransferred(uint256 indexed orderId,address indexed previousOwner,address indexed newOwner)",
]);
const erc20Abi = parseAbi([
  "function allowance(address owner,address spender) view returns (uint256)",
  "function approve(address spender,uint256 amount) returns (bool)",
]);
export const publicClient = createPublicClient({ chain: arcTestnet, transport: http(ARC_RPC) });

export async function ensureArcNetwork(provider: EIP1193Provider) {
  const chainId = `0x${ARC_CHAIN_ID.toString(16)}`;
  try {
    await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId }] });
  } catch (error) {
    if ((error as { code?: number }).code !== 4902) throw error;
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId,
          chainName: "Arc Testnet",
          nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
          rpcUrls: [ARC_RPC],
          blockExplorerUrls: [ARC_EXPLORER],
        },
      ],
    });
  }
}

function requireEscrow() {
  if (!LIVE_ENABLED || !ESCROW_ADDRESS)
    throw new Error("Live mode is not configured. Set VITE_ESCROW_ADDRESS.");
  return getAddress(ESCROW_ADDRESS);
}

type WalletClient = ReturnType<typeof import("./wallet").getWalletClient>;

export async function purchaseOnArc(wallet: WalletClient, account: Address) {
  const escrow = requireEscrow();
  const price = parseUnits("49", 6);
  const allowance = await publicClient.readContract({
    address: ARC_USDC,
    abi: erc20Abi,
    functionName: "allowance",
    args: [account, escrow],
  });
  if (allowance < price) {
    const approvalHash = await wallet.writeContract({
      account,
      chain: arcTestnet,
      address: ARC_USDC,
      abi: erc20Abi,
      functionName: "approve",
      args: [escrow, price],
    });
    await publicClient.waitForTransactionReceipt({ hash: approvalHash });
  }
  const hash = await wallet.writeContract({
    account,
    chain: arcTestnet,
    address: escrow,
    abi: escrowAbi,
    functionName: "purchase",
    args: [1n],
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const [created] = parseEventLogs({
    abi: escrowAbi,
    logs: receipt.logs,
    eventName: "OrderCreated",
  });
  if (!created) throw new Error("Purchase confirmed, but OrderCreated was not found.");
  return {
    hash,
    orderId: created.args.orderId,
    amount: Number(formatUnits(created.args.amount, 6)),
    cancelBefore: Number(created.args.cancelBefore) * 1000,
    refundBefore: Number(created.args.refundBefore) * 1000,
    merchant: created.args.merchant,
    transferable: created.args.transferable,
  };
}

export async function writeOrderAction(
  wallet: WalletClient,
  account: Address,
  action: "cancel" | "requestRefund" | "transferClaim",
  orderId: number,
  recipient?: Address,
): Promise<Hash> {
  const args = action === "transferClaim" ? [BigInt(orderId), recipient!] : [BigInt(orderId)];
  const hash = await wallet.writeContract({
    account,
    chain: arcTestnet,
    address: requireEscrow(),
    abi: escrowAbi,
    functionName: action,
    args,
  } as never);
  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}

export async function readOrderOnArc(orderId: number, receiptContract?: Address) {
  const configured = requireEscrow();
  const address = receiptContract ? getAddress(receiptContract) : configured;
  if (address !== configured)
    throw new Error("This receipt points to an unsupported escrow contract.");
  const order = await publicClient.readContract({
    address: requireEscrow(),
    abi: escrowAbi,
    functionName: "getOrder",
    args: [BigInt(orderId)],
  });
  const states = [
    "NONE",
    "PAID",
    "REFUND_REQUESTED",
    "CANCELLED",
    "REFUNDED",
    "FINALIZED",
    "DISPUTED",
  ] as const;
  const state = states[order.status] ?? "NONE";
  if (state === "NONE" || state === "DISPUTED")
    throw new Error("Order does not exist or is unsupported.");
  return {
    buyer: order.buyer,
    merchant: order.merchant,
    claimOwner: order.claimOwner,
    amount: Number(formatUnits(order.amount, 6)),
    purchasedAt: Number(order.createdAt) * 1000,
    cancelDeadline: Number(order.cancelBefore) * 1000,
    refundDeadline: Number(order.refundBefore) * 1000,
    state,
    transferable: order.transferable,
  };
}

export async function discoverOrdersForAccount(account: Address) {
  const escrow = requireEscrow();
  const fromBlock = BigInt(import.meta.env.VITE_ESCROW_DEPLOY_BLOCK || "0");
  const [created, received] = await Promise.all([
    publicClient.getLogs({
      address: escrow,
      event: parseAbi([
        "event OrderCreated(uint256 indexed orderId,address indexed buyer,address indexed merchant,uint256 amount,uint64 cancelBefore,uint64 refundBefore,bool transferable)",
      ])[0],
      args: { buyer: account },
      fromBlock,
      toBlock: "latest",
    }),
    publicClient.getLogs({
      address: escrow,
      event: parseAbi([
        "event ClaimTransferred(uint256 indexed orderId,address indexed previousOwner,address indexed newOwner)",
      ])[0],
      args: { newOwner: account },
      fromBlock,
      toBlock: "latest",
    }),
  ]);
  const ids = [...new Set([...created, ...received].map((log) => log.args.orderId))];
  const orders = await Promise.all(
    ids.map(async (orderId) => ({
      orderId: Number(orderId),
      txHash: created.find((log) => log.args.orderId === orderId)?.transactionHash ?? "",
      order: await readOrderOnArc(Number(orderId)),
    })),
  );
  return orders.filter(
    ({ order }) =>
      order.buyer.toLowerCase() === account.toLowerCase() ||
      order.claimOwner.toLowerCase() === account.toLowerCase(),
  );
}
export async function synchronizeEns(orderId: number, arcTxHash?: Hash) {
  if (!ENS_SYNC_URL) return { synced: false };
  const response = await fetch(ENS_SYNC_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ orderId, arcTxHash }),
  });
  if (!response.ok)
    throw new Error(`Arc succeeded, but ENS synchronization returned ${response.status}.`);
  return { synced: true };
}

export function transactionUrl(hash?: string) {
  return hash ? `${ARC_EXPLORER}/tx/${hash}` : ARC_EXPLORER;
}
