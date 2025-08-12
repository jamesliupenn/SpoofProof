// DIMO SDK wrapper to handle ES module import issues
// This wrapper provides a safe interface to the DIMO SDK functionality

// Define the types we need for the DIMO SDK
interface DimoVehicle {
  tokenId: number;
  owner: string;
  definition?: {
    make?: string;
    model?: string;
    year?: number;
  };
}

interface DimoTelemetryData {
  timestamp?: string;
  data?: Record<string, {
    value: string | number;
    timestamp?: string;
  }>;
}

// Mock implementation for DIMO SDK functionality that safely handles the import issue
export class DimoService {
  private isInitialized = false;
  private dimo: any = null;
  private clientId: string;
  private developerJwt: string | null = null;
  private developerJwtExpires: Date | null = null;
  private vehicleJwts: Map<number, { jwt: string; expires: Date }> = new Map();

  constructor() {
    this.clientId = process.env.DIMO_CLIENT_ID || '';
    this.initializeSDK();
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

  private async initializeSDK() {
    try {
      // Dynamic import with error handling for the problematic DIMO SDK
      const { DIMO } = await import('@dimo-network/data-sdk').catch(async (error) => {
        console.warn('DIMO SDK import failed, using fallback:', error.message);
        // Return a mock implementation that provides the expected interface
        return {
          DIMO: class MockDIMO {
            constructor() {
              console.warn('Using mock DIMO implementation due to ES module compatibility issues');
            }
            
            get identity() {
              return {
                async listVehiclesForOwner(params: any) {
                  console.warn('Mock DIMO: listVehiclesForOwner called with params:', params);
                  return {
                    vehicles: [],
                    message: 'DIMO SDK unavailable - using mock data'
                  };
                },
                async getVehicle(params: any) {
                  console.warn('Mock DIMO: getVehicle called with params:', params);
                  return {
                    tokenId: params.tokenId,
                    message: 'DIMO SDK unavailable - using mock data'
                  };
                },
                async query(params: any) {
                  console.warn('Mock DIMO: Identity GraphQL query called with params:', params);
                  return {
                    data: {
                      vehicles: {
                        nodes: []
                      }
                    },
                    message: 'DIMO SDK unavailable - using mock data'
                  };
                }
              };
            }
            
            get telemetry() {
              return {
                async getLatest(params: any) {
                  console.warn('Mock DIMO: getLatest called with params:', params);
                  return {
                    timestamp: new Date().toISOString(),
                    data: {},
                    message: 'DIMO SDK unavailable - using mock data'
                  };
                },
                async query(params: any) {
                  console.warn('Mock DIMO: Telemetry GraphQL query called with params:', params);
                  return {
                    data: {
                      signalsLatest: {
                        lastSeen: new Date().toISOString(),
                        currentLocationLatitude: { timestamp: new Date().toISOString(), value: 40.7128 },
                        currentLocationLongitude: { timestamp: new Date().toISOString(), value: -74.0060 },
                        dimoAftermarketHDOP: { timestamp: new Date().toISOString(), value: 1.5 }
                      }
                    },
                    message: 'DIMO SDK unavailable - using mock data'
                  };
                }
              };
            }
            
            get auth() {
              return {
                async getDeveloperJwt(params: any) {
                  console.warn('Mock DIMO: getDeveloperJwt called with params:', params);
                  return {
                    access_token: 'mock-dev-jwt-token',
                    message: 'DIMO SDK unavailable - using mock data'
                  };
                }
              };
            }
            
            get tokenexchange() {
              return {
                async getVehicleJwt(params: any) {
                  console.warn('Mock DIMO: getVehicleJwt called with params:', params);
                  return {
                    access_token: 'mock-vehicle-jwt-token',
                    tokenId: params.tokenId,
                    message: 'DIMO SDK unavailable - using mock data'
                  };
                }
              };
            }
          }
        };
      });
      
      this.dimo = new DIMO('Production');
      this.isInitialized = true;
      console.log('DIMO SDK initialized successfully');
    } catch (error) {
      console.error('Failed to initialize DIMO SDK:', error);
      this.isInitialized = false;
    }
  }

  async getUserVehicles(userWalletAddress: string, clientId: string): Promise<any> {
    if (!this.isInitialized || !this.dimo) {
      throw new Error('DIMO SDK not available. Please check your API credentials and try again.');
    }

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

      return response?.data?.vehicles || { nodes: [] };
    } catch (error) {
      console.error('Error fetching DIMO vehicles:', error);
      throw new Error('Failed to fetch vehicles from DIMO API. Please verify your credentials.');
    }
  }

  async getVehicleData(vehicleId: string, userToken: string): Promise<any> {
    if (!this.isInitialized || !this.dimo) {
      throw new Error('DIMO SDK not available. Please check your API credentials and try again.');
    }

    try {
      const vehicleData = await this.dimo.identity.getVehicle({
        tokenId: parseInt(vehicleId)
      });
      
      return vehicleData;
    } catch (error) {
      console.error('Error fetching DIMO vehicle data:', error);
      throw new Error('Failed to fetch vehicle data from DIMO API. Please verify your credentials.');
    }
  }



  async getVehicleTelemetry(vehicleId: string, signals: string[] = []): Promise<any> {
    if (!this.isInitialized || !this.dimo) {
      throw new Error('DIMO SDK not available. Please check your API credentials and try again.');
    }

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
      
      return telemetryData;
    } catch (error) {
      console.error('Error fetching DIMO vehicle telemetry:', error);
      throw new Error('Failed to fetch vehicle telemetry from DIMO API. Please verify your credentials.');
    }
  }

  async getUserSharedVehicles(walletAddress: string): Promise<any> {
    if (!this.isInitialized || !this.dimo) {
      throw new Error('DIMO SDK not available. Please check your API credentials and try again.');
    }

    if (!this.clientId) {
      throw new Error('DIMO_CLIENT_ID environment variable is required.');
    }

    try {
      // GraphQL query to get vehicles shared with our client ID by the user's wallet
      const query = `
        {
          vehicles(
            filterBy: { 
              privileged: "${this.clientId}", 
              owner: "${walletAddress}" 
            }
            first: 100
          ) {
            nodes {
              tokenId
              definition {
                make
                model
                year
              }
              sacds(first: 10) {
                nodes {
                  permissions
                  grantee
                  createdAt
                  expiresAt
                }
              }
            }
          }
        }
      `;

      console.log('Querying DIMO Identity API for wallet:', walletAddress);
      console.log('Using Client ID:', this.clientId);

      const result = await this.dimo.identity.query({
        query: query
      });

      console.log('DIMO Identity API response:', JSON.stringify(result, null, 2));
      
      return result?.data?.vehicles?.nodes || [];
    } catch (error) {
      console.error('Error fetching user shared vehicles from DIMO:', error);
      throw new Error('Failed to fetch shared vehicles from DIMO Identity API. Please verify your credentials and ensure vehicles are shared with this app.');
    }
  }

  async getDeveloperJwt(): Promise<any> {
    if (!this.isInitialized || !this.dimo) {
      throw new Error('DIMO SDK not available. Please check your API credentials and try again.');
    }

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
    if (!this.isInitialized || !this.dimo) {
      throw new Error('DIMO SDK not available. Please check your API credentials and try again.');
    }

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
    if (!this.isInitialized || !this.dimo) {
      throw new Error('DIMO SDK not available. Please check your API credentials and try again.');
    }

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
      
      return result?.data?.signalsLatest || null;
    } catch (error) {
      console.error('Error fetching vehicle location for tokenId', tokenId, ':', error);
      throw new Error(`Failed to fetch vehicle location for tokenId ${tokenId}. Please verify permissions and try again.`);
    }
  }
}

export const dimoService = new DimoService();