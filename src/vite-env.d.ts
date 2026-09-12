/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_ARC_RPC_URL?: string;
  readonly VITE_ESCROW_ADDRESS?: `0x${string}`;
  readonly VITE_ENS_SYNC_URL?: string;
  readonly VITE_ENS_SEPOLIA_RPC_URL?: string;
  readonly VITE_ESCROW_DEPLOY_BLOCK?: string;
  readonly VITE_RECEIPT_PARENT?: string;
}
