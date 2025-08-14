import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGpsDataSchema } from "@shared/schema";
import { z } from "zod";
import { dimoService } from "./dimo-service";
import { testSpotifyConnection, getSpotifyConfig, exchangeCodeForTokens, createUserSpotifyClient, getUserProfile } from "./spotify-service";

export async function registerRoutes(app: Express): Promise<Server> {
  // GPS data routes
  app.post("/api/gps", async (req, res) => {
    try {
      const validatedData = insertGpsDataSchema.parse(req.body);
      const savedData = await storage.saveGpsData(validatedData);
      res.json(savedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res
          .status(400)
          .json({ message: "Invalid GPS data", errors: error.errors });
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

  // DIMO API routes - require user authentication token
  app.get("/api/dimo/vehicles", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res
          .status(401)
          .json({ message: "Missing or invalid authorization token" });
        return;
      }

      const userToken = authHeader.substring(7); // Remove 'Bearer ' prefix
      const userWalletAddress = req.query.walletAddress as string;

      if (!userWalletAddress) {
        res.status(400).json({ message: "Missing walletAddress parameter" });
        return;
      }

      const clientId =
        process.env.DIMO_CLIENT_ID ||
        "0xE40AEc6f45e854b2E0cDa20624732F16AA029Ae7";

      const vehicles = await dimoService.getUserVehicles(
        userWalletAddress,
        clientId,
      );

      res.json({
        walletAddress: userWalletAddress,
        vehicles: vehicles.nodes || [],
        count: vehicles.nodes?.length || 0,
      });
    } catch (error) {
      console.error("Error fetching DIMO vehicles:", error);
      res.status(500).json({ message: "Failed to fetch vehicles from DIMO" });
    }
  });

  // Get real-time location data for a specific vehicle using DIMO data-sdk
  app.get("/api/dimo/vehicles/:vehicleId/location", async (req, res) => {
    try {
      const { vehicleId } = req.params;
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res
          .status(401)
          .json({ message: "Missing or invalid authorization token" });
        return;
      }

      const userToken = authHeader.substring(7);

      console.log("Fetching real-time location for vehicle:", vehicleId);

      // Use the real DIMO service to get vehicle location
      const locationData = await dimoService.getVehicleLocation(
        vehicleId,
        userToken,
      );

      // Automatically save to GPS storage for visualization
      const savedData = await storage.saveGpsData(locationData);

      res.json(savedData);
    } catch (error) {
      console.error("Error fetching vehicle location:", error);
      res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch vehicle location from DIMO",
      });
    }
  });

  // Get real-time location data for a specific vehicle using DIMO data-sdk
  app.get("/api/dimo/vehicles/:vehicleId/history", async (req, res) => {
    try {
      const { vehicleId } = req.params;
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res
          .status(401)
          .json({ message: "Missing or invalid authorization token" });
        return;
      }

      const userToken = authHeader.substring(7);

      console.log("Fetching weekly location for vehicle:", vehicleId);

      // Use the real DIMO service to get vehicle location
      const locationData = await dimoService.getVehicleWeeklyHistory(
        vehicleId,
        userToken,
      );
      console.log("Weekly location data:", locationData);
      // Automatically save to GPS storage for visualization
      const savedData = await storage.saveGpsData(locationData);

      res.json(savedData);
    } catch (error) {
      console.error("Error fetching vehicle location:", error);
      res.status(500).json({
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch vehicle location from DIMO",
      });
    }
  });

  app.get("/api/dimo/vehicles/:vehicleId/data", async (req, res) => {
    try {
      const { vehicleId } = req.params;
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res
          .status(401)
          .json({ message: "Missing or invalid authorization token" });
        return;
      }

      const userToken = authHeader.substring(7);
      const vehicleData = await dimoService.getVehicleData(
        vehicleId,
        userToken,
      );
      res.json(vehicleData);
    } catch (error) {
      console.error("Error fetching DIMO vehicle data:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch vehicle data from DIMO" });
    }
  });

  app.get("/api/dimo/vehicles/:vehicleId/telemetry", async (req, res) => {
    try {
      const { vehicleId } = req.params;
      const { signals } = req.query;
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res
          .status(401)
          .json({ message: "Missing or invalid authorization token" });
        return;
      }

      const requestedSignals = signals ? (signals as string).split(",") : [];
      const telemetryData = await dimoService.getVehicleTelemetry(
        vehicleId,
        requestedSignals,
      );
      res.json(telemetryData);
    } catch (error) {
      console.error("Error fetching DIMO vehicle telemetry:", error);
      res
        .status(500)
        .json({ message: "Failed to fetch vehicle telemetry from DIMO" });
    }
  });

  // Legacy route - redirects to new endpoint
  app.get("/api/dimo/shared-vehicles", async (req, res) => {
    res.status(410).json({
      message:
        "This endpoint has been deprecated. Please use /api/dimo/vehicles with proper authentication.",
    });
  });

  // Spotify PKCE endpoints
  app.get("/api/spotify/config", async (req, res) => {
    try {
      const config = getSpotifyConfig();
      res.json(config);
    } catch (error) {
      console.error("Error getting Spotify config:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get Spotify configuration",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.post("/api/spotify/auth/login", async (req, res) => {
    try {
      const { code_verifier } = req.body;
      
      if (!code_verifier) {
        res.status(400).json({ 
          success: false, 
          message: "Missing code verifier" 
        });
        return;
      }

      // Store code verifier temporarily (in a real app, use Redis or database)
      // For now, we'll handle this client-side with localStorage
      res.json({ success: true });
    } catch (error) {
      console.error("Spotify login error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to prepare Spotify login" 
      });
    }
  });

  app.get("/api/spotify/callback", async (req, res) => {
    try {
      const { code, state } = req.query;
      
      if (!code) {
        res.redirect(`/?spotify_error=${encodeURIComponent('Missing authorization code')}`);
        return;
      }

      // For this implementation, we'll pass the code to frontend and handle token exchange there
      res.redirect(`/?spotify_code=${encodeURIComponent(code as string)}`);
    } catch (error) {
      console.error("Spotify callback error:", error);
      res.redirect(`/?spotify_error=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`);
    }
  });

  app.post("/api/spotify/exchange", async (req, res) => {
    try {
      const { code, code_verifier } = req.body;
      
      if (!code || !code_verifier) {
        res.status(400).json({ 
          success: false, 
          message: "Missing authorization code or code verifier" 
        });
        return;
      }

      // Exchange code for tokens
      const tokens = await exchangeCodeForTokens(code, code_verifier);
      
      // Create user session (using a simple user ID for now)
      const userId = 'user_' + Date.now();
      createUserSpotifyClient(userId, tokens.accessToken, tokens.refreshToken);
      
      res.json({ 
        success: true, 
        userId,
        tokens: {
          access_token: tokens.accessToken,
          expires_in: tokens.expiresIn
        }
      });
    } catch (error) {
      console.error("Token exchange error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Token exchange failed",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/spotify/profile", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      
      if (!userId) {
        res.status(401).json({ 
          success: false, 
          message: "Missing userId parameter" 
        });
        return;
      }

      const profile = await getUserProfile(userId);
      res.json(profile);
    } catch (error) {
      console.error("Error getting Spotify profile:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get Spotify profile",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Legacy Spotify test endpoint
  app.get("/api/spotify/test", async (req, res) => {
    try {
      console.log("Testing Spotify API via endpoint...");
      const results = await testSpotifyConnection();

      res.json({
        success: true,
        message: "Spotify API test successful!",
        data: results,
      });
    } catch (error) {
      console.error("Spotify API test failed:", error);
      res.status(500).json({
        success: false,
        message: "Spotify API test failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
