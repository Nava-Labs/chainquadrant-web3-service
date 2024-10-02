import { createPublicClient, http } from "viem";
import {
  createBundlerClient,
  createPaymasterClient,
} from "viem/account-abstraction";
import { baseSepolia } from "viem/chains";
import { env } from "@/common/utils/envConfig";

export const customBaseSepolia = {
  ...baseSepolia,
  // SEE: https://github.com/base-org/basenames?tab=readme-ov-file#contract-addresses
  contracts: {
    ...baseSepolia.contracts,
    ensRegistry: {
      address: "0x1493b2567056c2181630115660963E13A8E32735" as `0x{string}`,
    },
    ensUniversalResolver: {
      address: "0x6533C94869D28fAA8dF77cc63f9e2b2D6Cf77eBA" as `0x{string}`,
      blockCreated: 13_041_171,
    },
  },
};

export const client = createPublicClient({
  chain: customBaseSepolia,
  transport: http(),
});

export const paymasterClient = createPaymasterClient({
  transport: http(env.PAYMASTER_CLIENT_URL),
});

export const bundlerClient = createBundlerClient({
  client,
  paymaster: paymasterClient,
  transport: http(env.BUNDLER_CLIENT_URL),
});
