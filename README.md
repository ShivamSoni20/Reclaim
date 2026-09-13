# Reclaim

> Your receipt is also the remote control for your purchase.

Reclaim turns an Arc USDC purchase into a portable ENSv2 receipt that can expose and exercise the rights still attached to the order: cancel, request a refund, transfer the claim, and independently inspect settlement.

## Thirty-second explanation

A customer pays 49 USDC into `ExecutableReceiptEscrow` on Arc Testnet. The emitted order is synchronized to an ENSv2 Sepolia subname such as `order-7.<controlled-parent>.eth`. Its resolver stores the Arc chain, escrow and order pointer plus capability records. Opening that name resolves the pointer, verifies canonical Arc state, and presents only actions the connected claim owner may execute.

## Why it is different

Normal receipts are passive evidence locked inside merchant applications. Reclaim makes the receipt a portable capability directory. Arc enforces the money; ENSv2 makes the order human-readable, discoverable and permissioned.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Arc is canonical. The synchronization server never trusts browser-submitted financial metadata.

## Integrations

- **Arc:** chain `5042002`, USDC ERC-20 interface `0x3600000000000000000000000000000000000000` (6 decimals), conditional escrow, cancellation refund, refund request, settlement and claim transfer.
- **ENSv2 Sepolia:** hierarchical names, Universal Resolver reads, Permissioned Resolver text records and record-scoped EAC delegation for `receipt.customerNote`.

## Status

Contract address, deployment transaction, receipt parent, example ENS receipt, live application and demo transactions are **not yet available** because deployment/funded-wallet and controlled ENSv2 parent credentials have not been supplied. The repository never substitutes fake values in live mode.

## Development

```bash
npm ci
npm run dev
npm run lint
npm run build
npm run preflight
npm run ens:setup
npm run ens:sync -- --order 7
npm run ens:verify -- order-7.your-parent.eth
```

For contracts:

```bash
forge install foundry-rs/forge-std --no-commit
forge fmt --check
forge build
forge test -vvv
```

Copy `.env.example` to `.env`; see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). Preview mode is visibly labeled and moves no funds. Live mode activates only with a real escrow address.

## Security

Internally reviewed for hackathon testnet use; not externally audited. See [docs/SECURITY.md](docs/SECURITY.md).

## Sponsor tracks

ETHOnline 2026 — ENSv2 and Arc DeFi / Onchain Finance.
