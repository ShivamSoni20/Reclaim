import { createPublicClient, getAddress, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { normalize } from "viem/ens";
const required = [
  "ARC_RPC_URL",
  "ARC_ESCROW_ADDRESS",
  "ENS_SEPOLIA_RPC_URL",
  "ENS_SYNC_SIGNER_PRIVATE_KEY",
  "ENS_RECEIPT_PARENT",
  "ENS_PARENT_REGISTRY",
  "ENS_PERMISSIONED_RESOLVER",
] as const;
const missing = required.filter((key) => !process.env[key]);
if (missing.length) throw new Error(`Missing configuration: ${missing.join(", ")}`);
const arc = createPublicClient({ transport: http(process.env.ARC_RPC_URL!) });
const ens = createPublicClient({ transport: http(process.env.ENS_SEPOLIA_RPC_URL!) });
const escrow = getAddress(process.env.ARC_ESCROW_ADDRESS!);
const registry = getAddress(process.env.ENS_PARENT_REGISTRY!);
const resolver = getAddress(process.env.ENS_PERMISSIONED_RESOLVER!);
const parent = normalize(process.env.ENS_RECEIPT_PARENT!);
const USDC = "0x3600000000000000000000000000000000000000";
const abi = parseAbi([
  "function usdc() view returns (address)",
  "function merchant() view returns (address)",
  "function productPrice(uint256) view returns (uint256)",
  "function productTransferable(uint256) view returns (bool)",
  "function cancelWindow() view returns (uint64)",
  "function refundWindow() view returns (uint64)",
]);
const [
  arcChainId,
  ensChainId,
  escrowCode,
  usdcCode,
  registryCode,
  resolverCode,
  usdc,
  merchant,
  price,
  transferable,
  cancelWindow,
  refundWindow,
] = await Promise.all([
  arc.getChainId(),
  ens.getChainId(),
  arc.getCode({ address: escrow }),
  arc.getCode({ address: USDC }),
  ens.getCode({ address: registry }),
  ens.getCode({ address: resolver }),
  arc.readContract({ address: escrow, abi, functionName: "usdc" }),
  arc.readContract({ address: escrow, abi, functionName: "merchant" }),
  arc.readContract({ address: escrow, abi, functionName: "productPrice", args: [1n] }),
  arc.readContract({ address: escrow, abi, functionName: "productTransferable", args: [1n] }),
  arc.readContract({ address: escrow, abi, functionName: "cancelWindow" }),
  arc.readContract({ address: escrow, abi, functionName: "refundWindow" }),
]);
const signer = process.env.ENS_SYNC_SIGNER_PRIVATE_KEY
  ? privateKeyToAccount(process.env.ENS_SYNC_SIGNER_PRIVATE_KEY as `0x${string}`).address
  : "NOT_CONFIGURED";
const failures = [
  arcChainId !== 5_042_002 && `Arc chain is ${arcChainId}`,
  ensChainId !== 11155111 && `ENS chain is ${ensChainId}`,
  !escrowCode && "Escrow has no bytecode",
  !usdcCode && "Arc USDC has no bytecode",
  !registryCode && "ENS registry has no bytecode",
  !resolverCode && "ENS resolver has no bytecode",
  getAddress(usdc) !== getAddress(USDC) && "Escrow USDC mismatch",
  price !== 49_000_000n && "Product 1 price mismatch",
].filter(Boolean);
console.log(
  JSON.stringify(
    {
      arc: {
        chainId: arcChainId,
        escrow,
        merchant,
        usdc,
        product1Price: price.toString(),
        product1Transferable: transferable,
        cancelWindow: cancelWindow.toString(),
        refundWindow: refundWindow.toString(),
      },
      ens: { chainId: ensChainId, parent, registry, resolver, signer },
      status: failures.length ? "FAILED" : "PASS",
      failures,
    },
    null,
    2,
  ),
);
if (failures.length) process.exitCode = 1;
