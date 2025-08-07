import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGpsDataSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // GPS data routes
  app.post("/api/gps", async (req, res) => {
    try {
      const validatedData = insertGpsDataSchema.parse(req.body);
      const savedData = await storage.saveGpsData(validatedData);
      res.json(savedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid GPS data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to save GPS data" });
      }
    }
  });

  app.get("/api/gps/latest", async (req, res) => {
    try {
      const latestData = await storage.getLatestGpsData();
      if (!latestData) {
        res.status(404).json({ message: "No GPS data found" });
        return;
      }
      res.json(latestData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch GPS data" });
    }
  });

  app.get("/api/gps", async (req, res) => {
    try {
      const allData = await storage.getAllGpsData();
      res.json(allData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch GPS data" });
    }
  });

  // Test scenarios endpoint
  app.get("/api/gps/test-scenarios", (req, res) => {
    const testScenarios = [
      { lat: 0, lng: 0, hdop: 0, description: "Vehicle Offline" },
      { lat: 40.7538, lng: -73.9878, hdop: 15, description: "Urban Garage" },
      { lat: 40.658878, lng: -74.186740, hdop: 1.5, description: "Open Road" },
    ];
    res.json(testScenarios);
  });

  const httpServer = createServer(app);
  return httpServer;
}
