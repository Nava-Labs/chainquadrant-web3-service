import type { Request, RequestHandler, Response } from "express";

import { interactionService } from "@/api/interaction/interactionService";
import { handleServiceResponse } from "@/common/utils/httpHandlers";

class InteractionController {
  public mintCloud: RequestHandler = async (req: Request, res: Response) => {
    const { publicKey } = req.body;

    if (!publicKey) {
      return res.status(400).json({ error: "publicKey is required" });
    }

    const serviceResponse = await interactionService.mintCquad(publicKey);
    return handleServiceResponse(serviceResponse, res);
  };

  public transferCquad: RequestHandler = async (
    req: Request,
    res: Response,
  ) => {
    const { amount, fromPublic, fromPrivate, toPublic } = req.body;

    if (!amount) {
      return res.status(400).json({ error: "Missing amount in request body." });
    }

    if (!fromPublic) {
      return res
        .status(400)
        .json({ error: "Missing fromPublic in request body." });
    }

    if (!fromPrivate) {
      return res
        .status(400)
        .json({ error: "Missing fromPrivate in request body." });
    }

    if (!toPublic) {
      return res
        .status(400)
        .json({ error: "Missing toPublicKey in request body." });
    }

    const serviceResponse = await interactionService.transferCquad(
      amount,
      fromPublic,
      fromPrivate,
      toPublic,
    );

    return res.status(serviceResponse.status).json(serviceResponse);
  };
}

export const interactionController = new InteractionController();
