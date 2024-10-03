import { StatusCodes } from "http-status-codes";

import { ServiceResponse } from "@/common/models/serviceResponse";
import { bundlerClient, client } from "@/common/smart-account/client";
import { logger } from "@/server";
import { privateKeyToAccount } from "viem/accounts";
import { toCoinbaseSmartAccount } from "viem/account-abstraction";
import { erc20Abi, isAddress, parseEther } from "viem";
import { supabaseClient } from "@/common/supabase/client";
import { CQUAD_ADDRESS } from "@/common/utils/consts";

type InteractionResponse = {
  smartAccountWallet: string;
  txHash: string;
};

export class InteractionService {
  async mintCquad(
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
            to: CQUAD_ADDRESS,
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
        "Successfully mint $CQUAD!",
        mintDetails,
      );
    } catch (ex) {
      const errorMessage = `Error finding wallet: $${(ex as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        "An error occurred while minting $CQUAD.",
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async transferCquad(
    amount: string,
    fromPublic: string,
    fromPrivate: string,
    toPublic: string,
  ): Promise<any> {
    let receiverAddress;

    try {
      if (isAddress(toPublic)) {
        receiverAddress = toPublic;
      } else {
        const address = await client.getEnsAddress({ name: toPublic });
        receiverAddress = address;
      }

      if (!receiverAddress) {
        throw Error("Invalid toPublicKey.");
      }

      const owner = privateKeyToAccount(fromPrivate as `0x{string}`);

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
            to: CQUAD_ADDRESS,
            args: [
              receiverAddress as `0x${string}`,
              parseEther(parseFloat(amount).toString(), "wei"),
            ],
          },
        ],
      });

      const opReceipt = await bundlerClient.waitForUserOperationReceipt({
        hash,
      });

      const txhash = opReceipt.receipt.transactionHash;

      return {
        status: StatusCodes.OK,
        fromPublic,
        transactionId: txhash,
        transactionUrl: `https://sepolia.basescan.org/tx/${txhash}`,
      };
    } catch (ex) {
      const errorMessage = `Error transfer $CQUAD: ${(ex as Error).message}`;
      logger.error(errorMessage);

      return {
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        message: "An error occurred while transferring $CQUAD.",
      };
    }
  }
}

export const interactionService = new InteractionService();
