import { LoginWithDimo, LogoutWithDimo, useDimoAuthState } from "@dimo-network/login-with-dimo";
import { Button } from "@/components/ui/button";
import { User, LogOut } from "lucide-react";

export default function DimoAuth() {
  const { isAuthenticated, email, walletAddress } = useDimoAuthState();

  const handleLoginSuccess = (authData: any) => {
    console.log("DIMO login successful:", authData);
  };

  const handleLoginError = (error: any) => {
    console.error("DIMO login failed:", error);
  };

  if (isAuthenticated) {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 text-sm">
          <User className="text-blue-600" size={16} />
          <div className="hidden sm:block">
            <div className="font-medium text-slate-900" data-testid="user-email">
              {email || "DIMO User"}
            </div>
            {walletAddress && (
              <div className="text-xs text-slate-500" data-testid="user-wallet">
                {`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
              </div>
            )}
          </div>
        </div>
        <LogoutWithDimo>
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
    <LoginWithDimo
      mode="popup"
      onSuccess={handleLoginSuccess}
      onError={handleLoginError}
    >
      <Button 
        variant="default" 
        size="sm" 
        className="flex items-center space-x-2"
        data-testid="button-login"
      >
        <User size={14} />
        <span>Login with DIMO</span>
      </Button>
    </LoginWithDimo>
  );
}