import { getAddress } from "viem";
import { createContext } from "../../services/ens-sync/src/core.ts";
const context = createContext();
const [chainId, registryCode, resolverCode, parentResolver] = await Promise.all([
  context.ens.getChainId(),
  context.ens.getCode({ address: context.config.parentRegistry }),
  context.ens.getCode({ address: context.config.resolver }),
  context.ens.getEnsResolver({ name: context.config.parent }).catch(() => null),
]);
if (chainId !== 11155111)
  throw new Error(`ENS RPC returned chain ${chainId}; expected Sepolia 11155111.`);
if (!registryCode) throw new Error("ENS_PARENT_REGISTRY has no bytecode on Sepolia.");
if (!resolverCode) throw new Error("ENS_PERMISSIONED_RESOLVER has no bytecode on Sepolia.");
if (!parentResolver)
  throw new Error(
    `Parent ${context.config.parent} does not resolve. Configure it in ENSv2 and authorize signer ${context.account.address}.`,
  );
console.log(
  JSON.stringify(
    {
      status: "PARENT_PREFLIGHT_OK",
      parent: context.config.parent,
      parentResolver: getAddress(parentResolver),
      configuredRegistry: context.config.parentRegistry,
      configuredReceiptResolver: context.config.resolver,
      signer: context.account.address,
      nextAction: `If registration fails, grant ${context.account.address} subname-registration permission on ${context.config.parentRegistry}.`,
    },
    null,
    2,
  ),
);
