import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";
import { walletController } from "./walletController";

export const walletRegistry = new OpenAPIRegistry();
export const walletRouter: Router = express.Router();

walletRegistry.registerPath({
  method: "post",
  path: "/wallet/create",
  tags: ["Create Wallet"],
  responses: {},
});

walletRouter.post("/create", walletController.createWallet);

walletRegistry.registerPath({
  method: "get",
  path: "/wallet/{publicKey}",
  tags: ["Get Wallet $CQUAD Balance"],
  responses: {},
});

walletRouter.get("/:publicKey", walletController.getWallet);
