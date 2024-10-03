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
import { CQUAD_ADDRESS } from "@/common/utils/consts";
import { convertReverseNodeToBytes } from "@/common/utils/convertReverseNodeToBytes";
import { baseSepolia } from "viem/chains";
import L2ResolverAbi from "@/abis/L2ResolverAbi";

export class WalletService {
  async createWallet(): Promise<any> {
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

      // NOTE: Mint $CQUAD after wallet creation
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
            to: CQUAD_ADDRESS,
            args: [account.address, parseEther("100", "wei")],
          },
        ],
      });

      // const receipt = await bundlerClient.waitForUserOperationReceipt({ hash });

      return {
        status: StatusCodes.OK,
        publicKey: account.address,
        privateKey: privateKey,
      };
    } catch (ex) {
      const errorMessage = `Error create wallet: $${(ex as Error).message}`;
      logger.error(errorMessage);

      return {
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        message: "An error occurred while creating wallet.",
      };
    }
  }

  async getSmartAccountWallet(publicKey: string): Promise<any> {
    try {
      const balance = await client.readContract({
        address: CQUAD_ADDRESS,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [publicKey as `0x{string}`],
      });

      // const addressReverseNode = convertReverseNodeToBytes(
      //   publicKey as `0x${string}`,
      //   baseSepolia.id,
      // );

      // const basenames = await client.readContract({
      //   abi: L2ResolverAbi,
      //   address: customBaseSepolia.contracts.ensUniversalResolver.address,
      //   functionName: "name",
      //   args: [addressReverseNode],
      // });

      return {
        status: StatusCodes.OK,
        balance: formatEther(balance),
        walletAddress: publicKey,
      };
    } catch (ex) {
      const errorMessage = `Error finding wallet: $${(ex as Error).message}`;
      logger.error(errorMessage);

      return {
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        message: "An error occurred while retrieving wallet details.",
      };
    }
  }
}

export const walletService = new WalletService();
