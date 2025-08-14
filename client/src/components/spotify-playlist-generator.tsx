import { useState, useEffect } from "react";
import { Music, Loader2, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function SpotifyPlaylistGenerator() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { toast } = useToast();

  const generateCodeVerifier = () => {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const randomValues = crypto.getRandomValues(new Uint8Array(64));
    return randomValues.reduce((acc, x) => acc + possible[x % possible.length], '');
  };

  const generateCodeChallenge = async (verifier: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    const bytes = new Uint8Array(digest);
    return btoa(String.fromCharCode.apply(null, Array.from(bytes)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  };

  const connectToSpotify = async () => {
    try {
      setIsConnecting(true);

      // Generate PKCE parameters
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);

      // Store code verifier for later use
      localStorage.setItem('spotify_code_verifier', codeVerifier);

      // Get Spotify client ID from server
      const configResponse = await fetch('/api/spotify/config');
      const config = await configResponse.json();

      // Spotify authorization parameters
      const params = new URLSearchParams({
        client_id: config.clientId,
        response_type: 'code',
        redirect_uri: `${window.location.origin}/api/spotify/callback`,
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
        scope: 'playlist-modify-public playlist-modify-private user-read-private user-read-email'
      });

      // Redirect to Spotify authorization
      window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
    } catch (error) {
      console.error('Error connecting to Spotify:', error);
      toast({
        title: "Connection Failed",
        description: "Unable to connect to Spotify. Please try again.",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  const handleSpotifyCallback = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('spotify_code');
    const error = urlParams.get('spotify_error');

    if (error) {
      toast({
        title: "Spotify Connection Failed",
        description: error,
        variant: "destructive",
      });
      return;
    }

    if (code) {
      try {
        setIsConnecting(true);
        const codeVerifier = localStorage.getItem('spotify_code_verifier');
        
        if (!codeVerifier) {
          throw new Error('Missing code verifier');
        }

        // Exchange code for tokens
        const response = await fetch('/api/spotify/exchange', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            code_verifier: codeVerifier,
          }),
        });

        const result = await response.json();

        if (result.success) {
          // Store user ID and get profile
          localStorage.setItem('spotify_user_id', result.userId);
          localStorage.removeItem('spotify_code_verifier');
          
          // Get user profile
          const profileResponse = await fetch(`/api/spotify/profile?userId=${result.userId}`);
          const profile = await profileResponse.json();
          
          setUserProfile(profile);
          setIsConnected(true);
          
          toast({
            title: "Connected to Spotify!",
            description: `Welcome, ${profile.display_name || profile.id}`,
          });

          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          throw new Error(result.message);
        }
      } catch (error) {
        console.error('Token exchange failed:', error);
        toast({
          title: "Connection Failed",
          description: "Failed to complete Spotify authentication.",
          variant: "destructive",
        });
      } finally {
        setIsConnecting(false);
      }
    }
  };

  const checkSpotifyConnection = async () => {
    try {
      const userId = localStorage.getItem('spotify_user_id');
      if (userId) {
        const response = await fetch(`/api/spotify/profile?userId=${userId}`);
        if (response.ok) {
          const profile = await response.json();
          setUserProfile(profile);
          setIsConnected(true);
          return true;
        }
      }
    } catch (error) {
      console.log('Not connected to Spotify');
    }
    return false;
  };

  // Check connection and handle callback on component mount
  useEffect(() => {
    checkSpotifyConnection();
    handleSpotifyCallback();
  }, []);

  return (
    <Card className="w-full" data-testid="spotify-playlist-generator">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Music className="h-5 w-5 text-green-500" />
          Spotify Playlist Generator
        </CardTitle>
        <CardDescription>
          Connect your Spotify account to generate playlists based on your driving data
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isConnected ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect your Spotify account to create personalized playlists based on your driving patterns, routes, and preferences.
            </p>
            <Button
              onClick={connectToSpotify}
              disabled={isConnecting}
              className="w-full bg-green-500 hover:bg-green-600 text-white"
              data-testid="connect-spotify-button"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Music className="mr-2 h-4 w-4" />
                  Connect to Spotify
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                <Music className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-medium text-sm">Connected to Spotify</p>
                <p className="text-xs text-muted-foreground">
                  {userProfile?.display_name || userProfile?.id}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                disabled
                data-testid="generate-playlist-button"
              >
                <Music className="mr-2 h-3 w-3" />
                Generate Drive Playlist (Coming Soon)
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open('https://open.spotify.com', '_blank')}
                className="w-full text-xs"
                data-testid="open-spotify-button"
              >
                <ExternalLink className="mr-2 h-3 w-3" />
                Open Spotify
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}