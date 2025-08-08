import { useState, useEffect } from 'react';
import { useDimoAuthState } from '@dimo-network/login-with-dimo';

const CACHED_WALLET_KEY = 'dimo_cached_wallet_address';
const CACHED_EMAIL_KEY = 'dimo_cached_email';

interface CachedAuthState {
  isAuthenticated: boolean;
  walletAddress: string | null;
  email: string | null;
  isFromCache: boolean;
}

export function useCachedDimoAuth(): CachedAuthState {
  // Get DIMO SDK state with fallback for SSR
  let dimoState;
  try {
    dimoState = useDimoAuthState();
  } catch (error) {
    dimoState = { isAuthenticated: false, walletAddress: null, email: null };
  }
  
  const { isAuthenticated, walletAddress, email } = dimoState;
  
  const [cachedWalletAddress, setCachedWalletAddress] = useState<string | null>(null);
  const [cachedEmail, setCachedEmail] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load cached data on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(CACHED_WALLET_KEY);
      const cachedEmailData = localStorage.getItem(CACHED_EMAIL_KEY);
      setCachedWalletAddress(cached);
      setCachedEmail(cachedEmailData);
      setIsInitialized(true);
    }
  }, []);

  // When DIMO SDK reports authenticated, cache the wallet address
  useEffect(() => {
    if (isAuthenticated && walletAddress && email) {
      localStorage.setItem(CACHED_WALLET_KEY, walletAddress);
      localStorage.setItem(CACHED_EMAIL_KEY, email);
      setCachedWalletAddress(walletAddress);
      setCachedEmail(email);
    }
  }, [isAuthenticated, walletAddress, email]);

  // When DIMO SDK reports not authenticated, clear cache
  useEffect(() => {
    if (isInitialized && !isAuthenticated && !walletAddress) {
      localStorage.removeItem(CACHED_WALLET_KEY);
      localStorage.removeItem(CACHED_EMAIL_KEY);
      setCachedWalletAddress(null);
      setCachedEmail(null);
    }
  }, [isAuthenticated, walletAddress, isInitialized]);

  // Return authenticated state if DIMO SDK is authenticated, otherwise use cached state
  if (isAuthenticated && walletAddress) {
    return {
      isAuthenticated: true,
      walletAddress,
      email,
      isFromCache: false
    };
  }

  // If we have cached wallet address but DIMO SDK isn't authenticated, use cache
  if (cachedWalletAddress) {
    return {
      isAuthenticated: true,
      walletAddress: cachedWalletAddress,
      email: cachedEmail,
      isFromCache: true
    };
  }

  // Not authenticated and no cache
  return {
    isAuthenticated: false,
    walletAddress: null,
    email: null,
    isFromCache: false
  };
}