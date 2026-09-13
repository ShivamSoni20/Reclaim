# Demo script (60–90 seconds)

1. “Receipts today only prove that you paid. Reclaim turns the receipt into the remote control for the purchase.”
2. Connect the wallet and buy Arc One for 49 USDC. Open the real Arcscan transaction.
3. Open the generated `order-{id}.<parent>` receipt and expand infrastructure and permissions.
4. Show Arc escrow state, ENSv2 resolver records and the scoped `receipt.customerNote` permission.
5. Cancel. Narrate only confirmed stages: Arc submitted, refund confirmed, ENS synchronized.
6. Show `CANCELLED`, the returned USDC and no remaining actions.
7. Close: “The receipt isn't just evidence of what you bought. It's the interface to what you bought.”

## Recorded Arc proof

Use order `1` when showing the completed Arc-only proof: [purchase](https://testnet.arcscan.app/tx/0x573690792e4b2245047e0105d184e61d792462b177031cb97076172af39200f7) followed by [cancel](https://testnet.arcscan.app/tx/0x35e97f6888d76b65fcc17b752825b8b30cac88f55a447bf232570a7f89b2de9). The confirmed lifecycle is `PAID → CANCELLED`, and the escrow balance returned from `49000000` to `0` USDC base units. Do not present order `1` as an ENS receipt until the controlled ENSv2 parent and real receipt sync are complete.
