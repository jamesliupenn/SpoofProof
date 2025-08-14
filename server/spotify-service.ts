import { SpotifyApi } from '@spotify/web-api-ts-sdk';

class SpotifyService {
  private api: SpotifyApi | null = null;

  constructor() {
    this.initializeApi();
  }

  private async initializeApi() {
    try {
      const clientId = process.env.SPOTIFY_CLIENT_ID;
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new Error('Missing Spotify credentials. Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables.');
      }

      // Initialize the Spotify Web API with client credentials
      this.api = SpotifyApi.withClientCredentials(
        clientId,
        clientSecret
      );

      console.log('Spotify API initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Spotify API:', error);
      throw error;
    }
  }

  async searchArtist(query: string) {
    try {
      if (!this.api) {
        await this.initializeApi();
      }

      if (!this.api) {
        throw new Error('Spotify API not initialized');
      }

      const results = await this.api.search(query, ["artist"]);
      console.log('Spotify search results:', results);
      
      return results;
    } catch (error) {
      console.error('Error searching Spotify:', error);
      throw error;
    }
  }

  async testSpotifyConnection() {
    try {
      console.log('Testing Spotify API connection...');
      const items = await this.searchArtist("The Beatles");
      
      console.log('Spotify API test successful!');
      console.log('The Beatles search results:', JSON.stringify(items, null, 2));
      
      return items;
    } catch (error) {
      console.error('Spotify API test failed:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
export const spotifyService = new SpotifyService();

// Test the connection when the service is imported
spotifyService.testSpotifyConnection()
  .then(() => {
    console.log('✅ Spotify service ready');
  })
  .catch((error) => {
    console.error('❌ Spotify service initialization failed:', error);
  });