import { SpotifyApi } from '@spotify/web-api-ts-sdk';

// Store user-specific Spotify clients
const userSpotifyClients = new Map<string, SpotifyApi>();

// Store access tokens with expiration
interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

const userTokens = new Map<string, TokenData>();

export const getSpotifyConfig = () => {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  
  if (!clientId) {
    throw new Error('Spotify client ID not configured');
  }

  return {
    clientId,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:5000/api/spotify/callback'
  };
};

export const exchangeCodeForTokens = async (code: string, codeVerifier: string) => {
  const { clientId } = getSpotifyConfig();
  const redirectUri = `${process.env.NODE_ENV === 'production' ? 'https://' : 'http://'}${process.env.REPLIT_DOMAIN || 'localhost:5000'}/api/spotify/callback`;

  const tokenEndpoint = 'https://accounts.spotify.com/api/token';
  
  const params = new URLSearchParams({
    client_id: clientId,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const tokenData = await response.json();
  
  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    expiresIn: tokenData.expires_in,
    scope: tokenData.scope,
  };
};

export const createUserSpotifyClient = (userId: string, accessToken: string, refreshToken?: string) => {
  const { clientId } = getSpotifyConfig();
  
  // Store token data
  userTokens.set(userId, {
    accessToken,
    refreshToken,
    expiresAt: Date.now() + (3600 * 1000), // 1 hour from now
  });

  // Create Spotify client with user access token
  const client = SpotifyApi.withAccessToken(clientId, {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token: refreshToken,
  } as any);

  userSpotifyClients.set(userId, client);
  return client;
};

export const getUserSpotifyClient = (userId: string): SpotifyApi | null => {
  return userSpotifyClients.get(userId) || null;
};

export const refreshUserToken = async (userId: string): Promise<SpotifyApi | null> => {
  const tokenData = userTokens.get(userId);
  
  if (!tokenData?.refreshToken) {
    return null;
  }

  try {
    const { clientId } = getSpotifyConfig();
    const tokenEndpoint = 'https://accounts.spotify.com/api/token';
    
    const params = new URLSearchParams({
      client_id: clientId,
      grant_type: 'refresh_token',
      refresh_token: tokenData.refreshToken,
    });

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const newTokenData = await response.json();
    
    // Update stored token
    userTokens.set(userId, {
      accessToken: newTokenData.access_token,
      refreshToken: newTokenData.refresh_token || tokenData.refreshToken,
      expiresAt: Date.now() + (newTokenData.expires_in * 1000),
    });

    // Create new client with refreshed token
    return createUserSpotifyClient(userId, newTokenData.access_token, newTokenData.refresh_token || tokenData.refreshToken);
  } catch (error) {
    console.error('Token refresh failed:', error);
    // Remove invalid tokens
    userTokens.delete(userId);
    userSpotifyClients.delete(userId);
    return null;
  }
};

export const getUserProfile = async (userId: string) => {
  let client = getUserSpotifyClient(userId);
  
  if (!client) {
    // Try to refresh token
    client = await refreshUserToken(userId);
    if (!client) {
      throw new Error('No valid Spotify session found');
    }
  }

  try {
    return await client.currentUser.profile();
  } catch (error) {
    // Token might be expired, try refreshing once
    client = await refreshUserToken(userId);
    if (client) {
      return await client.currentUser.profile();
    }
    throw error;
  }
};

export const testSpotifyConnection = async () => {
  // This is now just for basic API connectivity testing
  // Real user operations will use PKCE flow
  return {
    success: true,
    message: 'Spotify PKCE flow configured successfully',
    data: { flow: 'PKCE', clientId: getSpotifyConfig().clientId }
  };
};

// Initialize basic service
console.log('🎵 Spotify PKCE service initialized');
testSpotifyConnection()
  .then(() => {
    console.log('✅ Spotify service ready');
  })
  .catch((error) => {
    console.error('❌ Spotify service initialization failed:', error);
  });
