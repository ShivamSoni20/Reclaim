# Live deployment

The application has two explicit modes:

- **Preview mode** is used when `VITE_ESCROW_ADDRESS` is absent. It is safe for reviewing the UI and never claims that funds moved.
- **Live mode** is enabled by a deployed escrow address. Wallet actions then submit real Arc Testnet transactions and receipt pages read the canonical order back from Arc.

## 1. Deploy the Arc escrow

Install Foundry, copy `.env.example` to `.env`, and obtain Arc Testnet USDC plus gas from Circle's faucets. Deploy `contracts/src/ExecutableReceiptEscrow.sol` with these constructor arguments:

1. USDC: `0x3600000000000000000000000000000000000000`
2. Merchant: the wallet that may approve refund requests

Example:

```bash
forge create contracts/src/ExecutableReceiptEscrow.sol:ExecutableReceiptEscrow \
  --rpc-url "$ARC_RPC_URL" \
  --private-key "$DEPLOYER_PRIVATE_KEY" \
  --constructor-args 0x3600000000000000000000000000000000000000 "$MERCHANT_ADDRESS" \
  --broadcast
```

Never commit the deployer key. Put the resulting contract address in `VITE_ESCROW_ADDRESS`.

## 2. Configure the web application

```env
VITE_ARC_RPC_URL=https://rpc.testnet.arc.network
VITE_ESCROW_ADDRESS=0xYourDeployedEscrow
VITE_RECEIPT_PARENT=shop.receipts.eth
VITE_ENS_SYNC_URL=https://your-server.example/api/receipt-sync
```

Run `npm run dev`. The checkout now performs an ERC-20 allowance transaction when necessary, calls `purchase(1)`, waits for confirmation, and derives the order identifier from `OrderCreated`.

## 3. Connect ENSv2 synchronization

`VITE_ENS_SYNC_URL` is an authenticated server endpoint owned by the project. It receives a confirmed Arc event payload and updates the corresponding ENSv2 Sepolia Permissioned Resolver records. The signer must remain server-side.

Expected request fields include:

```json
{
  "event": "cancel",
  "receipt": "order-1.shop.receipts.eth",
  "orderId": 1,
  "state": "CANCELLED",
  "arcTxHash": "0x..."
}
```

Before writing ENS, the service must independently read the order from the configured Arc escrow and confirm that the transaction succeeded. It should then update `receipt.status`, `receipt.contract`, `receipt.orderId`, deadlines, and capability records using the merchant's restricted resolver role. Do not trust state supplied by the browser.

If the sync URL is unavailable after a successful Arc transaction, the UI reports the partial success. Money state remains correct because the escrow contract is canonical.

## 4. Verify

```bash
npm run lint
npm run build
forge test
```

The contract tests cover escrow funding and cancellation refunds plus claim ownership transfer. The frontend production build validates the wallet, Arc and SSR integrations.
