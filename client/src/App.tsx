import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DimoAuthProvider, initializeDimoSDK } from "@dimo-network/login-with-dimo";
import NotFound from "@/pages/not-found";
import GpsVisualizer from "@/pages/gps-visualizer";

// Initialize DIMO SDK
initializeDimoSDK({
  clientId: import.meta.env.VITE_DIMO_CLIENT_ID,
  redirectUri: import.meta.env.VITE_DIMO_REDIRECT_URI,
  environment: "production"
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={GpsVisualizer} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DimoAuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </DimoAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
