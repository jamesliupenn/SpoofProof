// DIMO API service for server-side data fetching
export class DimoService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.DIMO_API_KEY || '';
    this.baseUrl = 'https://api.dimo.zone'; // DIMO production API
  }

  async getUserVehicles(userToken: string) {
    try {
      const response = await fetch(`${this.baseUrl}/user/vehicles`, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`DIMO API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching DIMO vehicles:', error);
      throw error;
    }
  }

  async getVehicleData(vehicleId: string, userToken: string) {
    try {
      const response = await fetch(`${this.baseUrl}/vehicles/${vehicleId}/data`, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`DIMO API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching DIMO vehicle data:', error);
      throw error;
    }
  }

  async getVehicleLocation(vehicleId: string, userToken: string) {
    try {
      const response = await fetch(`${this.baseUrl}/vehicles/${vehicleId}/location`, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`DIMO API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Convert to GPS format for your app
      return {
        lat: data.latitude,
        lng: data.longitude,
        hdop: data.accuracy || 1.0, // Use accuracy as HDOP if available
        timestamp: data.timestamp || new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching DIMO vehicle location:', error);
      throw error;
    }
  }
}

export const dimoService = new DimoService();