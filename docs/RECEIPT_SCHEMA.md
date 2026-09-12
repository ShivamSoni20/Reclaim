# Receipt record schema

All keys are ENS text records on ENSv2 Sepolia. `receipt.version=1` and `receipt.type=commerce` identify the schema. Canonical pointers are `receipt.chainId`, `receipt.contract`, and `receipt.orderId`. Financial mirrors are `receipt.status`, `receipt.amount`, `receipt.currency`, `receipt.merchant`, `receipt.claimOwner`, `receipt.createdAt`, `receipt.cancelBefore`, and `receipt.refundBefore`. Capabilities are `receipt.action.cancel`, `receipt.action.transfer`, and `receipt.action.refund`, each `available` or `unavailable`.

`receipt.customerNote` is the only customer-delegated record. The Permissioned Resolver grants its exact text-key role to the current claim owner. Financial records remain controlled by the synchronization signer. On transfer, the old note permission is revoked and the new owner is granted it.
