import type { Request, RequestHandler, Response } from "express";

import { walletService } from "@/api/wallet/walletService";
import { handleServiceResponse } from "@/common/utils/httpHandlers";

class WalletController {
  public createWallet: RequestHandler = async (req: Request, res: Response) => {
    const serviceResponse = await walletService.createWallet();
    return handleServiceResponse(serviceResponse, res);
  };

  public getWallet: RequestHandler = async (req: Request, res: Response) => {
    const publicKey = req.query.publicKey as string;

    if (!publicKey) {
      return res
        .status(400)
        .json({ error: "Missing publicKey in query params." });
    }

    const serviceResponse =
      await walletService.getSmartAccountWallet(publicKey);
    return handleServiceResponse(serviceResponse, res);
  };
}

export const walletController = new WalletController();
