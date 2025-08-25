import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCachedDimoAuth } from "@/hooks/use-cached-auth";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Car,
  Calendar,
  Shield,
  AlertTriangle,
  MapPin,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AmazonLogo from "@/assets/Amazon.png";
import TargetLogo from "@/assets/Target.png";
import UberLogo from "@/assets/Uber.png";
import WalmartLogo from "@/assets/Walmart.png";

interface Vehicle {
  tokenId: number;
  owner: string;
  definition: {
    make: string;
    model: string;
    year: number;
  };
  sacds?: {
    nodes: Array<{
      permissions: string;
      grantee: string;
      createdAt: string;
      expiresAt: string;
    }>;
  };
}

interface SharedVehiclesResponse {
  walletAddress: string;
  vehicles: Vehicle[];
  count: number;
}

function getCookieValue(cookieName: string): string | null {
  const cookies = document.cookie.split("; ");
  for (let cookie of cookies) {
    const [name, value] = cookie.split("=");
    if (name === cookieName) {
      return decodeURIComponent(value);
    }
  }
  return null; // Return null if the cookie is not found
}

const fetchUserVehicles = async (
  walletAddress: string,
): Promise<SharedVehiclesResponse> => {
  const cachedToken = getCookieValue("dimo_auth_token");

  if (!cachedToken) {
    throw new Error("No cached DIMO token found. Please authenticate first.");
  }

  const response = await fetch(
    `/api/dimo/vehicles?walletAddress=${encodeURIComponent(walletAddress)}`,
    {
      headers: {
        Authorization: `Bearer ${cachedToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch vehicles: ${response.statusText}`);
  }

  return response.json();
};

const fetchCurrentVehicleLocation = async (tokenId: number) => {
  const cachedToken = getCookieValue("dimo_auth_token");

  if (!cachedToken) {
    throw new Error("No cached DIMO token found. Please authenticate first.");
  }

  const response = await fetch(`/api/dimo/vehicles/${tokenId}/location`, {
    headers: {
      Authorization: `Bearer ${cachedToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch vehicle location: ${response.statusText}`);
  }

  return response.json();
};

const fetchVehicleVin = async (tokenId: number) => {
  const cachedToken = getCookieValue("dimo_auth_token");

  if (!cachedToken) {
    throw new Error("No cached DIMO token found. Please authenticate first.");
  }

  const response = await fetch(`/api/dimo/vehicles/${tokenId}/vin`, {
    headers: {
      Authorization: `Bearer ${cachedToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch vehicle VIN: ${response.statusText}`);
  }

  return response.json();
};

export default function UserVehicles() {
  const { isAuthenticated, walletAddress, email, isFromCache } =
    useCachedDimoAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [vehicleVins, setVehicleVins] = useState<Record<number, string>>({});
  const [lastValidation, setLastValidation] = useState<{
    vin: string;
    location: [number, number];
  } | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string>("amazon");

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/dimo/vehicles", walletAddress],
    queryFn: () => {
      console.log(
        "Frontend: Making API call to fetch vehicles for wallet:",
        walletAddress,
      );
      return fetchUserVehicles(walletAddress!);
    },
    enabled: isAuthenticated && !!walletAddress,
  });

  // Log query state changes
  useEffect(() => {
    console.log("UserVehicles query state update:", {
      isAuthenticated,
      walletAddress,
      isLoading,
      error: error?.message,
      data,
      queryEnabled: isAuthenticated && !!walletAddress,
    });
  }, [isAuthenticated, walletAddress, isLoading, error, data]);

  // Also log the final authentication status for the user
  console.log("UserVehicles render - Final auth state:", {
    isAuthenticated,
    walletAddress,
    isFromCache,
    vehicleCount: data?.vehicles?.length || 0,
  });

  const locationMutation = useMutation({
    mutationFn: fetchCurrentVehicleLocation,
    onSuccess: (locationData, variables) => {
      if (locationData.lat && locationData.lng) {
        toast({
          title: "Location Updated",
          description: `Vehicle location: ${locationData.lat.toFixed(4)}, ${locationData.lng.toFixed(4)} (HDOP: ${locationData.hdop})`,
        });
        
        // Update last validation data with location
        setLastValidation(prev => ({
          vin: prev?.vin || "",
          location: [locationData.lat, locationData.lng]
        }));
        
        // Invalidate GPS data to trigger a refresh of the map
        queryClient.invalidateQueries({ queryKey: ["/api/gps"] });

        // Notify parent component to focus on the new location and update GPS data
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("focusMapLocation", {
              detail: {
                lat: locationData.lat,
                lng: locationData.lng,
                hdop: locationData.hdop || 1.0,
              },
            }),
          );

          // Also dispatch event to clear user pins and restore GPS signals
          window.dispatchEvent(new CustomEvent("clearUserPin"));
        }
      } else {
        toast({
          title: "No Location Data",
          description:
            "Vehicle location data is not available or GPS signal is poor",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Location Fetch Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to fetch vehicle location",
        variant: "destructive",
      });
    },
  });

  const vinMutation = useMutation({
    mutationFn: fetchVehicleVin,
    onSuccess: (vinData, variables) => {
      if (vinData.vin && vinData.vin !== "Unknown") {
        setVehicleVins(prev => ({ ...prev, [variables]: vinData.vin }));
        
        // Update last validation data with VIN
        setLastValidation(prev => ({
          vin: vinData.vin,
          location: prev?.location || [0, 0]
        }));
        
        toast({
          title: "VIN Retrieved",
          description: `Vehicle VIN: ${vinData.vin}`,
        });
      } else {
        toast({
          title: "No VIN Data",
          description: "VIN data is not available for this vehicle",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "VIN Fetch Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to fetch vehicle VIN",
        variant: "destructive",
      });
    },
  });

  if (!isAuthenticated || !walletAddress) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Car className="h-5 w-5" />
            My Shared Vehicles
          </CardTitle>
          <CardDescription>Sign in with DIMO to view vehicles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            Authenticate to view your vehicles
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Car className="h-5 w-5" />
            My Shared Vehicles
          </CardTitle>
          <CardDescription>
            Vehicles shared with this app from your DIMO account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            Loading your shared vehicles...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Error Loading Vehicles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-red-600">
            {error instanceof Error
              ? error.message
              : "Failed to load shared vehicles"}
          </div>
        </CardContent>
      </Card>
    );
  }

  const vehicles = data?.vehicles || [];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Car className="h-5 w-5" />
          My Shared Vehicles
        </CardTitle>
        <CardDescription>
          {vehicles.length > 0
            ? `${vehicles.length} vehicle${vehicles.length > 1 ? "s" : ""} shared`
            : "No vehicles currently shared"}
          {isFromCache && (
            <span className="text-orange-500 text-xs ml-2">
              (using cached auth)
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {vehicles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Car className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No vehicles shared yet</p>
            <p className="text-xs mt-1">
              Use the "Share Vehicles" button above to grant this app access to
              your vehicle data
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.tokenId}
                className="border rounded-lg p-3 space-y-2"
                data-testid={`vehicle-card-${vehicle.tokenId}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3
                      className="font-semibold text-lg"
                      data-testid={`vehicle-name-${vehicle.tokenId}`}
                    >
                      {vehicle.definition.year} {vehicle.definition.make}{" "}
                      {vehicle.definition.model}
                    </h3>
                    <p
                      className="text-sm text-muted-foreground"
                      data-testid={`vehicle-token-${vehicle.tokenId}`}
                    >
                      Token ID: {vehicle.tokenId}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        data-testid={`vehicle-status-${vehicle.tokenId}`}
                      >
                        Shared
                      </Badge>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => {
                          locationMutation.mutate(vehicle.tokenId);
                          vinMutation.mutate(vehicle.tokenId);
                        }}
                        disabled={locationMutation.isPending || vinMutation.isPending}
                        data-testid={`current-button-${vehicle.tokenId}`}
                        className="text-xs"
                      >
                        {(locationMutation.isPending || vinMutation.isPending) ? (
                          <>
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <MapPin className="mr-1 h-3 w-3" />
                            Validate Location & VIN
                          </>
                        )}
                      </Button>
                    </div>
                    {vehicleVins[vehicle.tokenId] && (
                      <div className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-md font-mono">
                        VIN: {vehicleVins[vehicle.tokenId]}
                      </div>
                    )}
                  </div>
                </div>

                {vehicle.sacds?.nodes && vehicle.sacds.nodes.length > 0 && (
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium flex items-center gap-1">
                      <Shield className="h-4 w-4" />
                      Permissions
                    </h4>
                    {vehicle.sacds?.nodes?.map((sacd, index) => (
                      <div
                        key={index}
                        className="bg-muted/50 rounded p-2 text-sm"
                      >
                        <div className="flex flex-wrap gap-1 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {sacd.permissions}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Created:{" "}
                            {new Date(sacd.createdAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Expires:{" "}
                            {new Date(sacd.expiresAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {lastValidation && (
          <div className="mt-6 space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              Validate
            </h3>
            
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setSelectedCompany("amazon")}
                className={`p-2 rounded-lg border-2 transition-colors ${
                  selectedCompany === "amazon"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
                data-testid="company-button-amazon"
              >
                <img
                  src={AmazonLogo}
                  alt="Amazon"
                  className="w-12 h-12 object-contain"
                />
              </button>
              
              <button
                onClick={() => setSelectedCompany("target")}
                className={`p-2 rounded-lg border-2 transition-colors ${
                  selectedCompany === "target"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
                data-testid="company-button-target"
              >
                <img
                  src={TargetLogo}
                  alt="Target"
                  className="w-12 h-12 object-contain"
                />
              </button>
              
              <button
                onClick={() => setSelectedCompany("uber")}
                className={`p-2 rounded-lg border-2 transition-colors ${
                  selectedCompany === "uber"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
                data-testid="company-button-uber"
              >
                <img
                  src={UberLogo}
                  alt="Uber"
                  className="w-12 h-12 object-contain"
                />
              </button>
              
              <button
                onClick={() => setSelectedCompany("walmart")}
                className={`p-2 rounded-lg border-2 transition-colors ${
                  selectedCompany === "walmart"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
                data-testid="company-button-walmart"
              >
                <img
                  src={WalmartLogo}
                  alt="Walmart"
                  className="w-12 h-12 object-contain"
                />
              </button>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4">
              <pre className="text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                {JSON.stringify(
                  {
                    url: `${selectedCompany}.com/flex/api/v2/driver/validate`,
                    vin: lastValidation.vin,
                    location: lastValidation.location,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
