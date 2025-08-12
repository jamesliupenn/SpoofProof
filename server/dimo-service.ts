import { DIMO } from '@dimo-network/data-sdk';

// DIMO data service using official SDK
export class DimoService {
  private dimo: DIMO;

  constructor() {
    this.dimo = new DIMO('Production'); // Use Production environment
  }

  async getUserVehicles(userWalletAddress: string, clientId: string) {
    try {
      // Query vehicles that the user owns and are privileged to the client ID
      const query = `{
        vehicles(
          filterBy: { privileged: "${clientId}", owner: "${userWalletAddress}" }
          first: 100
        ) {
          nodes {
            owner
            tokenId
            definition {
              make
              model
              year
            }
          }
        }
      }`;

      const response = await this.dimo.identity.query({
        query: query
      });

      return response.data?.vehicles || { nodes: [] };
    } catch (error) {
      console.error('Error fetching DIMO vehicles:', error);
      throw error;
    }
  }

  async getVehicleData(vehicleId: string, userToken: string) {
    try {
      // Get vehicle information using the data SDK
      const vehicleData = await this.dimo.identity.getVehicle({
        tokenId: parseInt(vehicleId)
      });
      
      return vehicleData;
    } catch (error) {
      console.error('Error fetching DIMO vehicle data:', error);
      throw error;
    }
  }

  async getVehicleLocation(vehicleId: string, userToken: string) {
    try {
      // Get latest telemetry data for the vehicle
      const telemetryData = await this.dimo.telemetry.getLatest({
        tokenId: parseInt(vehicleId),
        signals: ['location.latitude', 'location.longitude', 'location.accuracy']
      });

      // Extract location data
      const latitude = telemetryData.data?.['location.latitude']?.value;
      const longitude = telemetryData.data?.['location.longitude']?.value;
      const accuracy = telemetryData.data?.['location.accuracy']?.value;

      if (!latitude || !longitude) {
        throw new Error('No location data available for this vehicle');
      }

      // Convert to GPS format for your app
      return {
        lat: parseFloat(latitude),
        lng: parseFloat(longitude),
        hdop: accuracy ? parseFloat(accuracy) : 1.0, // Use accuracy as HDOP if available
        timestamp: telemetryData.timestamp || new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching DIMO vehicle location:', error);
      throw error;
    }
  }

  async getVehicleTelemetry(vehicleId: string, signals: string[] = []) {
    try {
      // Get telemetry data for specified signals
      const defaultSignals = [
        'location.latitude',
        'location.longitude', 
        'location.accuracy',
        'speed',
        'odometer'
      ];
      
      const requestedSignals = signals.length > 0 ? signals : defaultSignals;
      
      const telemetryData = await this.dimo.telemetry.getLatest({
        tokenId: parseInt(vehicleId),
        signals: requestedSignals
      });
      
      return telemetryData;
    } catch (error) {
      console.error('Error fetching DIMO vehicle telemetry:', error);
      throw error;
    }
  }
}

export const dimoService = new DimoService();