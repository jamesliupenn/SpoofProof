import {
  ShareVehiclesWithDimo,
  LogoutWithDimo,
  useDimoAuthState,
} from "@dimo-network/login-with-dimo";
import { Button } from "@/components/ui/button";
import { User, LogOut, Car } from "lucide-react";
import { useCachedDimoAuth } from "@/hooks/use-cached-auth";

export default function DimoAuth() {
  const { isAuthenticated, email, walletAddress, isFromCache } = useCachedDimoAuth();
  const dimoSdkState = useDimoAuthState();

  const handleShareSuccess = (authData: any) => {
    console.log("DIMO vehicle sharing successful:", authData);
    // In redirect mode, the redirect happens automatically
    // This callback is for handling the returned data
  };

  const handleShareError = (error: any) => {
    console.error("DIMO vehicle sharing failed:", error);
  };

  const handleLogoutSuccess = () => {
    console.log("DIMO logout successful");
    // Clear cached wallet address on logout
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dimo_cached_wallet_address');
      localStorage.removeItem('dimo_cached_email');
    }
  };

  const handleLogoutError = (error: any) => {
    console.error("DIMO logout failed:", error);
  };

  // Calculate expiration date 1 month from now
  const expirationDate = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000,
  ).toISOString();

  if (isAuthenticated) {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 text-sm">
          <User className="text-blue-600" size={16} />
          <div className="hidden sm:block">
            <div
              className="font-medium text-slate-900"
              data-testid="user-email"
            >
              {email || "DIMO User"}
            </div>
            {walletAddress && (
              <div className="text-xs text-slate-500" data-testid="user-wallet">
                {`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
                {isFromCache && <span className="ml-1 text-orange-500">(cached)</span>}
              </div>
            )}
          </div>
        </div>
        <LogoutWithDimo
          mode="redirect"
          onSuccess={handleLogoutSuccess}
          onError={handleLogoutError}
        >
          <Button
            variant="outline"
            size="sm"
            className="flex items-center space-x-1"
            data-testid="button-logout"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </LogoutWithDimo>
      </div>
    );
  }

  return (
    <ShareVehiclesWithDimo
      mode="redirect"
      permissionTemplateId={2}
      expirationDate={expirationDate}
      unAuthenticatedLabel="Show My Vehicles"
      authenticatedLabel="Manage My Vehicles"
      onSuccess={handleShareSuccess}
      onError={handleShareError}
    >
      <Button
        variant="default"
        size="sm"
        className="flex items-center space-x-2"
        data-testid="button-share-vehicles"
      >
        <Car size={14} />
        <span className="hidden sm:inline">Share Vehicles</span>
        <span className="sm:hidden">Share</span>
      </Button>
    </ShareVehiclesWithDimo>
  );
}
