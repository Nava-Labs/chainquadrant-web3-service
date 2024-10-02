import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";
import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { walletController } from "./walletController";

export const walletRegistry = new OpenAPIRegistry();
export const walletRouter: Router = express.Router();

walletRegistry.registerPath({
  method: "post",
  path: "/create",
  tags: ["Create Wallet"],
  responses: createApiResponse(z.null(), "Success"),
});

walletRouter.post("/create", walletController.createWallet);

walletRegistry.registerPath({
  method: "get",
  path: "/wallet",
  tags: ["Get Wallet Details"],
  parameters: [
    {
      name: "publicKey",
      in: "query",
      required: true,
      schema: {
        type: "string",
      },
      description: "Public key to fetch wallet details",
    },
  ],
  responses: createApiResponse(z.null(), "Success"),
});

walletRouter.get("/", walletController.getWallet);
