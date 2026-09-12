# Architecture

```mermaid
flowchart LR
 W[Customer wallet] -->|49 USDC| A[Arc Testnet\nExecutableReceiptEscrow]
 A -->|canonical order events/state| S[ENS sync server]
 S -->|verified Arc read| E[ENSv2 Sepolia\nPermissioned Registry + Resolver + EAC]
 E -->|portable discovery| U[Executable receipt UI]
 U -->|financial actions| A
```

Arc is the canonical financial state. ENSv2 is the portable receipt identity, metadata, discovery and permission layer. The browser sends only an order identifier to synchronization; the server re-reads Arc and derives every record.
