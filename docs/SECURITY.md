# Security

Internally reviewed for hackathon testnet use; not externally audited.

## Trust model

Arc escrow state alone authorizes money movement. ENS records are discovery metadata and are never trusted by the escrow. The ENS signer is server-only and must independently read the configured escrow before writing records.

## Controls

- claim owner exclusively controls cancel, refund request and transfer rights;
- refunds always return to the original payer, preventing claim-transfer redirection;
- checks-effects-interactions and a reentrancy lock protect releases;
- safe optional-return ERC-20 calls support Arc USDC;
- `cancelWindow <= refundWindow`, one-way lifecycle transitions and `totalEscrowed` prevent contradictory or double releases;
- live clients accept only the configured chain and escrow contract;
- private keys are never browser variables.

## Limitations

ENSv2 is a Sepolia beta and interfaces may change. Cross-chain synchronization is operationally trusted and temporarily stale records are possible; the UI must prefer Arc and expose sync-pending state. This code is for testnet demonstration, not production custody.
