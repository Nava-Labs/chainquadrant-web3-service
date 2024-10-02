import type { Request, RequestHandler, Response } from "express";

import { interactionService } from "@/api/interaction/interactionService";
import { handleServiceResponse } from "@/common/utils/httpHandlers";

class InteractionController {
  public mintCloud: RequestHandler = async (req: Request, res: Response) => {
    const { publicKey } = req.body;

    if (!publicKey) {
      return res.status(400).json({ error: "publicKey is required" });
    }

    const serviceResponse = await interactionService.mintCloud(publicKey);
    return handleServiceResponse(serviceResponse, res);
  };

  public transferCloud: RequestHandler = async (
    req: Request,
    res: Response,
  ) => {
    const { fromPublicKey, toPublicKey, amount } = req.body;

    if (!fromPublicKey) {
      return res.status(400).json({ error: "Missing fromPublicKey." });
    }

    if (!toPublicKey) {
      return res.status(400).json({ error: "Missing toPublicKey." });
    }

    if (!amount) {
      return res.status(400).json({ error: "Missing amount." });
    }

    const serviceResponse = await interactionService.transferCloud(
      fromPublicKey,
      toPublicKey,
      amount,
    );
    return handleServiceResponse(serviceResponse, res);
  };
}

export const interactionController = new InteractionController();
