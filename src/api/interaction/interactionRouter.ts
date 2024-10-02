import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { interactionController } from "./interactionController";

export const interactionRegistry = new OpenAPIRegistry();
export const interactionRouter: Router = express.Router();

interactionRegistry.registerPath({
  method: "post",
  path: "/interaction/mint",
  tags: ["Mint $CLOUD"],
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            publicKey: {
              type: "string",
              description: "Public key for minting $CLOUD tokens",
            },
          },
          required: ["publicKey"], // Specify required fields
        },
      },
    },
  },
  responses: createApiResponse(z.null(), "Success"),
});

interactionRouter.post("/mint", interactionController.mintCloud);

interactionRegistry.registerPath({
  method: "post",
  path: "/interaction/transfer-cloud",
  tags: ["Transfer $CLOUD"],
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            fromPublicKey: {
              type: "string",
              description: "Sender's public key",
            },
            toPublicKey: {
              type: "string",
              description: "Receiver's public key",
            },
            amount: {
              type: "number",
              description: "Amount of $CLOUD tokens to transfer",
            },
          },
          required: ["fromPublicKey", "toPublicKey", "amount"], // All fields are required
        },
      },
    },
  },
  responses: createApiResponse(z.null(), "Success"),
});

interactionRouter.post("/transfer-cloud", interactionController.transferCloud);
