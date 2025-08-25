import {
  ShareVehiclesWithDimo,
  LogoutWithDimo,
  useDimoAuthState,
} from "@dimo-network/login-with-dimo";
import { Button } from "@/components/ui/button";
import { User, LogOut, Car } from "lucide-react";
import { useCachedDimoAuth } from "@/hooks/use-cached-auth";

export default function DimoAuth() {
  const { isAuthenticated, email, walletAddress, isFromCache } =
    useCachedDimoAuth();
  const dimoSdkState = useDimoAuthState();

  // Debug: Log raw DIMO SDK state
  console.log("DimoAuth - Raw DIMO SDK state:", dimoSdkState);

  const handleShareSuccess = (authData: any) => {
    console.log("DIMO vehicle sharing successful:", authData);

    // Cache wallet address and token directly from authData
    if (authData?.walletAddress) {
      console.log(
        "Caching wallet address from authData:",
        authData.walletAddress,
      );
      localStorage.setItem(
        "dimo_cached_wallet_address",
        authData.walletAddress,
      );
    }

    if (authData?.token) {
      console.log("Caching token from authData");
      localStorage.setItem("dimo_cached_token", authData.token);
    }

    // Force re-render by triggering a storage event
    window.dispatchEvent(new Event("storage"));

    console.log("Shared vehicles:", authData?.sharedVehicles || "none");
    // In redirect mode, the redirect happens automatically
    // This callback is for handling the returned data
  };

  const handleShareError = (error: any) => {
    console.error("DIMO vehicle sharing failed:", error);
  };

  const handleLogoutSuccess = () => {
    console.log("DIMO logout successful");
    // Clear cached wallet address on logout
    if (typeof window !== "undefined") {
      localStorage.removeItem("dimo_cached_wallet_address");
      localStorage.removeItem("dimo_cached_email");
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
      <div className="flex items-center space-x-2 sm:space-x-3">
        <div className="flex items-center space-x-2 text-sm min-w-0 flex-shrink">
          <User className="text-blue-600 flex-shrink-0" size={16} />
          <div className="hidden xs:block sm:block min-w-0">
            <div
              className="font-medium text-slate-900 truncate max-w-[120px] sm:max-w-none"
              data-testid="user-email"
              title={email || "DIMO User"}
            >
              {email || "DIMO User"}
            </div>
            {walletAddress && (
              <div
                className="text-xs text-slate-500 truncate"
                data-testid="user-wallet"
              >
                <span className="hidden sm:inline">
                  {`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
                </span>
                <span className="sm:hidden">
                  {`${walletAddress.slice(0, 4)}...${walletAddress.slice(-2)}`}
                </span>
                {isFromCache && (
                  <span className="ml-1 text-orange-500 hidden sm:inline">
                    (cached)
                  </span>
                )}
              </div>
            )}
          </div>
          {/* Mobile-only user indicator */}
          <div className="xs:hidden sm:hidden flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
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
            className="flex items-center space-x-1 px-2 sm:px-3 min-w-0"
            data-testid="button-logout"
          >
            <LogOut size={14} className="flex-shrink-0" />
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
        className="flex items-center space-x-2 px-3 py-2 text-sm sm:text-base min-w-0"
        data-testid="button-share-vehicles"
      >
        <Car size={14} className="flex-shrink-0" />
        <span className="hidden sm:inline whitespace-nowrap">
          Share Vehicles
        </span>
        <span className="sm:hidden whitespace-nowrap">Share</span>
      </Button>
    </ShareVehiclesWithDimo>
  );
}
