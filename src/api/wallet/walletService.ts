import { StatusCodes } from "http-status-codes";

import { ServiceResponse } from "@/common/models/serviceResponse";
import {
  bundlerClient,
  client,
  customBaseSepolia,
} from "@/common/smart-account/client";
import { logger } from "@/server";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { toCoinbaseSmartAccount } from "viem/account-abstraction";
import { erc20Abi, formatEther, isAddress, parseEther } from "viem";
import { supabaseClient } from "@/common/supabase/client";
import { CLOUD_ADDRESS } from "@/common/utils/consts";
import { convertReverseNodeToBytes } from "@/common/utils/convertReverseNodeToBytes";
import { baseSepolia } from "viem/chains";
import L2ResolverAbi from "@/abis/L2ResolverAbi";

type Wallet = {
  ownerPublicKey: string;
  smartAccountWallet: string;
  basenames: string;
  cloudBalance?: string;
};

export class WalletService {
  async createWallet(): Promise<ServiceResponse<Wallet | null>> {
    try {
      const privateKey = generatePrivateKey();
      const owner = privateKeyToAccount(privateKey);
      const account = await toCoinbaseSmartAccount({
        client,
        owners: [owner],
      });

      const { error } = await supabaseClient.from("users").insert({
        public_key: owner.address,
        private_key: privateKey,
        smart_account: account.address,
      });

      // NOTE: Mint $CLOUD after wallet creation
      const hash = await bundlerClient.sendUserOperation({
        account,
        calls: [
          {
            abi: [
              {
                type: "function",
                name: "mint",
                stateMutability: "nonpayable",
                inputs: [{ type: "address" }, { type: "uint256" }],
                outputs: [],
              },
            ],
            functionName: "mint",
            to: CLOUD_ADDRESS,
            args: [account.address, parseEther("100", "wei")],
          },
        ],
      });

      // const receipt = await bundlerClient.waitForUserOperationReceipt({ hash });

      const walletDetails: Wallet = {
        ownerPublicKey: owner.address,
        smartAccountWallet: account.address,
        basenames: "",
      };

      return ServiceResponse.success<Wallet>(
        "Successfully created wallet!",
        walletDetails,
      );
    } catch (ex) {
      const errorMessage = `Error finding wallet: $${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while creating wallet.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getSmartAccountWallet(
    publicKey: string,
  ): Promise<ServiceResponse<Wallet | null>> {
    try {
      const { data: user, error } = await supabaseClient
        .from("users")
        .select()
        .eq("public_key", publicKey)
        .single();

      const owner = privateKeyToAccount(user.private_key);

      const account = await toCoinbaseSmartAccount({
        client,
        owners: [owner],
      });

      const balance = await client.readContract({
        address: CLOUD_ADDRESS,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [account.address],
      });

      const addressReverseNode = convertReverseNodeToBytes(
        publicKey as `0x${string}`,
        // "0x461534226489954A699d3f23BcFcCAFba3B11514",
        baseSepolia.id,
      );

      const basenames = await client.readContract({
        abi: L2ResolverAbi,
        address: customBaseSepolia.contracts.ensUniversalResolver.address,
        functionName: "name",
        args: [addressReverseNode],
      });

      const walletDetails: Wallet = {
        ownerPublicKey: owner.address,
        smartAccountWallet: account.address,
        basenames,
        cloudBalance: formatEther(balance),
      };

      return ServiceResponse.success<Wallet>(
        "Successfully get smart account wallet!",
        walletDetails,
      );
    } catch (ex) {
      const errorMessage = `Error finding wallet: $${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while retrieving wallet details.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const walletService = new WalletService();
