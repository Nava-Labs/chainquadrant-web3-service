import { StatusCodes } from "http-status-codes";

import { ServiceResponse } from "@/common/models/serviceResponse";
import { bundlerClient, client } from "@/common/smart-account/client";
import { logger } from "@/server";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { toCoinbaseSmartAccount } from "viem/account-abstraction";
import { erc20Abi, formatEther, isAddress, parseEther } from "viem";
import { supabaseClient } from "@/common/supabase/client";
import { CLOUD_ADDRESS } from "@/common/utils/consts";

type InteractionResponse = {
  smartAccountWallet: string;
  txHash: string;
};

export class InteractionService {
  async mintCloud(
    publicKey: string,
  ): Promise<ServiceResponse<InteractionResponse | null>> {
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

      const opReceipt = await bundlerClient.waitForUserOperationReceipt({
        hash,
      });

      const mintDetails: InteractionResponse = {
        smartAccountWallet: account.address,
        txHash: opReceipt.receipt.transactionHash,
      };

      return ServiceResponse.success<InteractionResponse>(
        "Successfully mint $CLOUD!",
        mintDetails,
      );
    } catch (ex) {
      const errorMessage = `Error finding wallet: $${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while minting $CLOUD.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async transferCloud(
    fromPublicKey: string,
    toPublicKey: string,
    amount: string,
  ): Promise<ServiceResponse<InteractionResponse | string | null>> {
    let receiverAddress;

    try {
      if (isAddress(toPublicKey)) {
        receiverAddress = toPublicKey;
      } else {
        const address = await client.getEnsAddress({ name: toPublicKey });
        receiverAddress = address;
      }

      if (!receiverAddress) {
        throw Error("Invalid toPublicKey.");
      }

      const { data: user, error } = await supabaseClient
        .from("users")
        .select()
        .eq("public_key", fromPublicKey)
        .single();

      const owner = privateKeyToAccount(user.private_key);

      const account = await toCoinbaseSmartAccount({
        client,
        owners: [owner],
      });

      const hash = await bundlerClient.sendUserOperation({
        account,
        calls: [
          {
            abi: erc20Abi,
            functionName: "transfer",
            to: CLOUD_ADDRESS,
            args: [receiverAddress as `0x${string}`, parseEther(amount, "wei")],
          },
        ],
      });

      const opReceipt = await bundlerClient.waitForUserOperationReceipt({
        hash,
      });

      const transferResponse: InteractionResponse = {
        smartAccountWallet: account.address,
        txHash: opReceipt.receipt.transactionHash,
      };

      return ServiceResponse.success<InteractionResponse>(
        "Successfully transfer $CLOUD!",
        transferResponse,
      );
    } catch (ex) {
      const errorMessage = `Error transfer $CLOUD: ${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while transferring $CLOUD.",
        errorMessage,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const interactionService = new InteractionService();
