import { useSyncExternalStore } from "react";
import { createWalletClient, custom, type Address, type EIP1193Provider } from "viem";
import { arcTestnet, ensureArcNetwork } from "./web3";

/**
 * Demo wallet session. Mirrors the shape a wagmi `useAccount()` hook would
 * return so the UI can be wired to a real connector later without changes.
 */
export interface WalletState {
  address: Address | null;
  chain: string;
  status: "disconnected" | "connecting" | "connected";
}

let state: WalletState = { address: null, chain: "Arc Testnet", status: "disconnected" };
const listeners = new Set<() => void>();
const serverSnapshot: WalletState = { address: null, chain: "Arc Testnet", status: "disconnected" };

function injected(): EIP1193Provider | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as typeof window & { ethereum?: EIP1193Provider }).ethereum;
}

function set(next: Partial<WalletState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

export function useWallet(): WalletState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
    () => serverSnapshot,
  );
}

export async function connectWallet() {
  if (state.status === "connected" && state.address) return state.address;
  const provider = injected();
  if (!provider) throw new Error("No wallet detected. Install MetaMask to use the live Arc flow.");
  set({ status: "connecting" });
  try {
    await ensureArcNetwork(provider);
    const [address] = await getWalletClient().requestAddresses();
    if (!address) throw new Error("The wallet did not return an account.");
    set({ status: "connected", address, chain: "Arc Testnet" });
    return address;
  } catch (error) {
    set({ status: "disconnected", address: null });
    throw error;
  }
}

export function getWalletClient() {
  const provider = injected();
  if (!provider) throw new Error("No injected EVM wallet found.");
  return createWalletClient({ chain: arcTestnet, transport: custom(provider) });
}

export function disconnectWallet() {
  set({ status: "disconnected", address: null });
}

if (typeof window !== "undefined" && injected()) {
  const provider = injected()! as EIP1193Provider & {
    on?: (event: string, listener: (...args: unknown[]) => void) => void;
  };
  void provider.request({ method: "eth_accounts" }).then((accounts) => {
    const [address] = accounts as Address[];
    if (address) set({ status: "connected", address });
  });
  provider.on?.("accountsChanged", (...args) => {
    const [accounts] = args as [Address[]];
    const [address] = accounts;
    set(address ? { status: "connected", address } : { status: "disconnected", address: null });
  });
  provider.on?.("chainChanged", (...args) => {
    const [chainId] = args as [string];
    const onArc = Number.parseInt(chainId, 16) === arcTestnet.id;
    set({ chain: onArc ? "Arc Testnet" : "Wrong network" });
  });
}
