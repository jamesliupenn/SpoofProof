// DIMO data service with mock implementation due to ES module compatibility issues
// The @dimo-network/data-sdk package has unresolvable directory import issues

export class DimoService {
  private mockVehicles: any[];

  constructor() {
    // Mock vehicle data for testing - represents the user's actual vehicles
    this.mockVehicles = [
      {
        tokenId: 180895,
        owner: "0xCAA591fA19a86762D1ed1B98b2057Ee233240b65",
        definition: {
          make: "Toyota",
          model: "Camry",
          year: 2025
        }
      },
      {
        tokenId: 117315,
        owner: "0xCAA591fA19a86762D1ed1B98b2057Ee233240b65",
        definition: {
          make: "Lexus",
          model: "NX",
          year: 2021
        }
      }
    ];
    console.log('DimoService initialized with mock implementation (DIMO SDK unavailable due to ES module issues)');
  }

  async getUserVehicles(userWalletAddress: string, clientId: string) {
    console.log(`Mock DIMO: getUserVehicles called for wallet: ${userWalletAddress}, clientId: ${clientId}`);
    
    // Return mock vehicles if the wallet matches the test user
    if (userWalletAddress === "0xCAA591fA19a86762D1ed1B98b2057Ee233240b65") {
      console.log('Mock DIMO: Returning user vehicles:', this.mockVehicles);
      return { nodes: this.mockVehicles };
    }
    
    console.log('Mock DIMO: No vehicles found for this wallet address');
    return { nodes: [] };
  }

  async getVehicleData(vehicleId: string, userToken: string) {
    console.log(`Mock DIMO: getVehicleData called for vehicleId: ${vehicleId}`);
    
    const tokenId = parseInt(vehicleId);
    const vehicle = this.mockVehicles.find(v => v.tokenId === tokenId);
    
    if (vehicle) {
      console.log('Mock DIMO: Returning vehicle data:', vehicle);
      return vehicle;
    }
    
    throw new Error(`Vehicle with tokenId ${tokenId} not found or not accessible`);
  }

  async getVehicleLocation(vehicleId: string, userToken: string) {
    console.log(`Mock DIMO: getVehicleLocation called for vehicleId: ${vehicleId}`);
    
    const tokenId = parseInt(vehicleId);
    const vehicle = this.mockVehicles.find(v => v.tokenId === tokenId);
    
    if (!vehicle) {
      throw new Error(`Vehicle with tokenId ${tokenId} not found or not accessible`);
    }

    // Return mock location data (New York City coordinates)
    const mockLocation = {
      lat: 40.7128 + (Math.random() - 0.5) * 0.01, // Small random variation
      lng: -74.0060 + (Math.random() - 0.5) * 0.01,
      hdop: 1.5 + Math.random() * 0.5, // HDOP between 1.5-2.0
      timestamp: new Date().toISOString()
    };
    
    console.log('Mock DIMO: Returning location data:', mockLocation);
    return mockLocation;
  }

  async getVehicleTelemetry(vehicleId: string, signals: string[] = []) {
    console.log(`Mock DIMO: getVehicleTelemetry called for vehicleId: ${vehicleId}, signals:`, signals);
    
    const tokenId = parseInt(vehicleId);
    const vehicle = this.mockVehicles.find(v => v.tokenId === tokenId);
    
    if (!vehicle) {
      throw new Error(`Vehicle with tokenId ${tokenId} not found or not accessible`);
    }

    // Return mock telemetry data
    const mockTelemetry = {
      timestamp: new Date().toISOString(),
      data: {
        'location.latitude': { value: 40.7128 + (Math.random() - 0.5) * 0.01 },
        'location.longitude': { value: -74.0060 + (Math.random() - 0.5) * 0.01 },
        'location.accuracy': { value: 1.5 + Math.random() * 0.5 },
        'speed': { value: Math.random() * 60 }, // 0-60 mph
        'odometer': { value: 50000 + Math.random() * 10000 } // 50k-60k miles
      }
    };
    
    console.log('Mock DIMO: Returning telemetry data:', mockTelemetry);
    return mockTelemetry;
  }
}

export const dimoService = new DimoService();