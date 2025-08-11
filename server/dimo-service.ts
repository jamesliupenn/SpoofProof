import { DIMO } from '@dimo-network/data-sdk';

// DIMO data service using authentic SDK with ES Next Module support
export class DimoService {
  private dimo: DIMO;
  private developerJwt: string | null = null;
  private developerJwtExpires: Date | null = null;
  private vehicleJwts: Map<number, { jwt: string; expires: Date }> = new Map();

  constructor() {
    this.dimo = new DIMO('Production');
    console.log('DimoService initialized with authentic DIMO SDK');
    
    // Clean up expired JWTs every 5 minutes
    setInterval(() => this.cleanupExpiredJwts(), 5 * 60 * 1000);
  }

  private cleanupExpiredJwts() {
    const now = new Date();
    
    // Clean up expired Developer JWT
    if (this.developerJwtExpires && this.developerJwtExpires < now) {
      console.log('Cleaning up expired Developer JWT');
      this.developerJwt = null;
      this.developerJwtExpires = null;
    }

    // Clean up expired Vehicle JWTs
    const expiredTokenIds: number[] = [];
    for (const [tokenId, vehicleJwt] of this.vehicleJwts.entries()) {
      if (vehicleJwt.expires < now) {
        expiredTokenIds.push(tokenId);
      }
    }
    
    if (expiredTokenIds.length > 0) {
      console.log(`Cleaning up expired Vehicle JWTs for tokenIds: ${expiredTokenIds.join(', ')}`);
      expiredTokenIds.forEach(tokenId => this.vehicleJwts.delete(tokenId));
    }
  }

  async getUserVehicles(userWalletAddress: string, clientId: string) {
    console.log(`DIMO SDK: getUserVehicles called for wallet: ${userWalletAddress}, clientId: ${clientId}`);
    
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

      console.log('Executing GraphQL query:', query);
      const response = await this.dimo.identity.query({
        query: query
      });

      console.log('DIMO Identity API response:', response);
      return response?.data?.vehicles || { nodes: [] };
    } catch (error) {
      console.error('Error fetching DIMO vehicles:', error);
      throw error;
    }
  }

  async getVehicleData(vehicleId: string, userToken: string) {
    console.log(`DIMO SDK: getVehicleData called for vehicleId: ${vehicleId}`);
    
    try {
      const vehicleData = await this.dimo.identity.getVehicle({
        tokenId: parseInt(vehicleId)
      });
      
      console.log('DIMO vehicle data:', vehicleData);
      return vehicleData;
    } catch (error) {
      console.error('Error fetching DIMO vehicle data:', error);
      throw error;
    }
  }

  async getDeveloperJwt(): Promise<any> {
    // Check if we have a valid cached Developer JWT (expires in 14 days)
    if (this.developerJwt && this.developerJwtExpires && this.developerJwtExpires > new Date()) {
      console.log('Using cached Developer JWT (expires:', this.developerJwtExpires.toISOString(), ')');
      return { access_token: this.developerJwt };
    }

    const clientId = process.env.DIMO_CLIENT_ID;
    const redirectUri = process.env.DIMO_REDIRECT_URI;
    const privateKey = process.env.DIMO_API_KEY;

    if (!clientId || !redirectUri || !privateKey) {
      throw new Error('Missing required DIMO environment variables: DIMO_CLIENT_ID, DIMO_REDIRECT_URI, DIMO_API_KEY');
    }

    try {
      console.log('Fetching new Developer JWT with Client ID:', clientId);
      
      const developerJwt = await this.dimo.auth.getDeveloperJwt({
        client_id: clientId,
        domain: redirectUri,
        private_key: privateKey
      });

      // Cache the Developer JWT with 14-day expiration (minus 1 hour for safety)
      this.developerJwt = developerJwt.access_token;
      this.developerJwtExpires = new Date(Date.now() + (13 * 24 * 60 * 60 * 1000)); // 13 days
      
      console.log('New Developer JWT obtained and cached (expires:', this.developerJwtExpires.toISOString(), ')');
      return developerJwt;
    } catch (error) {
      console.error('Error getting Developer JWT:', error);
      // Clear cached JWT on error
      this.developerJwt = null;
      this.developerJwtExpires = null;
      throw new Error('Failed to obtain Developer JWT from DIMO. Please verify your API credentials.');
    }
  }

  async getVehicleJwt(developerJwt: any, tokenId: number): Promise<any> {
    // Check if we have a valid cached Vehicle JWT (expires in 10 minutes)
    const cachedVehicleJwt = this.vehicleJwts.get(tokenId);
    if (cachedVehicleJwt && cachedVehicleJwt.expires > new Date()) {
      console.log(`Using cached Vehicle JWT for tokenId: ${tokenId} (expires: ${cachedVehicleJwt.expires.toISOString()})`);
      return { access_token: cachedVehicleJwt.jwt };
    }

    try {
      console.log('Fetching new Vehicle JWT for tokenId:', tokenId);
      
      const vehicleJwt = await this.dimo.tokenexchange.getVehicleJwt({
        ...developerJwt,
        tokenId: tokenId
      });

      // Cache the Vehicle JWT with 10-minute expiration (minus 1 minute for safety)
      const expires = new Date(Date.now() + (9 * 60 * 1000)); // 9 minutes
      this.vehicleJwts.set(tokenId, {
        jwt: vehicleJwt.access_token,
        expires: expires
      });

      console.log(`New Vehicle JWT obtained and cached for tokenId: ${tokenId} (expires: ${expires.toISOString()})`);
      return vehicleJwt;
    } catch (error) {
      console.error('Error getting Vehicle JWT for tokenId', tokenId, ':', error);
      // Remove cached JWT on error
      this.vehicleJwts.delete(tokenId);
      throw new Error(`Failed to obtain Vehicle JWT for tokenId ${tokenId}. Vehicle may not be shared with this app.`);
    }
  }

  async getVehicleLocation(vehicleJwt: any, tokenId: number): Promise<any> {
    try {
      console.log('Querying Telemetry API for location data for tokenId:', tokenId);
      
      const query = `
        {
          signalsLatest(
            tokenId: ${tokenId}
          ) {
            lastSeen
            currentLocationLatitude {
              timestamp
              value
            }
            currentLocationLongitude {
              timestamp
              value
            }
            dimoAftermarketHDOP {
              timestamp
              value
            }
          }
        }
      `;

      const result = await this.dimo.telemetry.query({
        ...vehicleJwt,
        query: query
      });

      console.log('Telemetry API response for tokenId', tokenId, ':', JSON.stringify(result, null, 2));
      
      return (result as any)?.data?.signalsLatest || null;
    } catch (error) {
      console.error('Error fetching vehicle location for tokenId', tokenId, ':', error);
      throw new Error(`Failed to fetch vehicle location for tokenId ${tokenId}. Please verify permissions and try again.`);
    }
  }

  async getVehicleTelemetry(vehicleId: string, signals: string[] = []) {
    console.log(`DIMO SDK: getVehicleTelemetry called for vehicleId: ${vehicleId}, signals:`, signals);
    
    try {
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
      
      console.log('DIMO telemetry data:', telemetryData);
      return telemetryData;
    } catch (error) {
      console.error('Error fetching DIMO vehicle telemetry:', error);
      throw error;
    }
  }
}

export const dimoService = new DimoService();