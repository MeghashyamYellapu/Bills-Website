import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get(api.receipts.list.path, async (req, res) => {
    const receipts = await storage.getReceipts();
    res.json(receipts);
  });

  app.get(api.receipts.get.path, async (req, res) => {
    const receipt = await storage.getReceipt(Number(req.params.id));
    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }
    res.json(receipt);
  });

  app.post(api.receipts.create.path, async (req, res) => {
    try {
      const input = api.receipts.create.input.parse(req.body);
      const receipt = await storage.createReceipt(input);
      res.status(201).json(receipt);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.receipts.delete.path, async (req, res) => {
    await storage.deleteReceipt(Number(req.params.id));
    res.status(204).send();
  });

  return httpServer;
}
