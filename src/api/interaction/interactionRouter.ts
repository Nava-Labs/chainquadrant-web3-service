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
  tags: ["Mint $CQUAD"],
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            publicKey: {
              type: "string",
              description: "Public key for minting $CQUAD tokens",
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
  path: "/interaction/transfer-cquad",
  tags: ["Transfer $CQUAD"],
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            amount: {
              type: "number",
              description: "Amount of $CQUAD tokens to transfer",
            },
            fromPublic: {
              type: "string",
              description: "Sender's public key",
            },
            fromPrivate: {
              type: "string",
              description: "Sender's private key",
            },
            toPublicKey: {
              type: "string",
              description: "Receiver's public key",
            },
          },
          required: ["fromPublicKey", "toPublicKey", "amount"], // All fields are required
        },
      },
    },
  },
  responses: {},
});

interactionRouter.post("/transfer-cquad", interactionController.transferCquad);
