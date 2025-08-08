import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDimoAuthState } from "@dimo-network/login-with-dimo";
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

interface Vehicle {
  tokenId: number;
  definition: {
    make: string;
    model: string;
    year: number;
  };
  sacds: {
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

const fetchUserVehicles = async (
  walletAddress: string,
): Promise<SharedVehiclesResponse> => {
  const response = await fetch('/api/dimo/vehicles', {
    headers: {
      'Authorization': `Bearer ${walletAddress}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch vehicles: ${response.statusText}`);
  }

  return response.json();
};

const fetchVehicleLocation = async (tokenId: number) => {
  const response = await fetch(`/api/dimo/vehicles/${tokenId}/location`);

  if (!response.ok) {
    throw new Error(`Failed to fetch vehicle location: ${response.statusText}`);
  }

  return response.json();
};

export default function UserVehicles() {
  const { isAuthenticated, walletAddress } = useDimoAuthState();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/dimo/vehicles", walletAddress],
    queryFn: () => fetchUserVehicles(walletAddress!),
    enabled: isAuthenticated && !!walletAddress,
  });

  const locationMutation = useMutation({
    mutationFn: fetchVehicleLocation,
    onSuccess: (locationData) => {
      if (locationData.lat && locationData.lng) {
        toast({
          title: "Location Updated",
          description: `Vehicle location: ${locationData.lat.toFixed(4)}, ${locationData.lng.toFixed(4)} (HDOP: ${locationData.hdop})`,
        });
        // Invalidate GPS data to trigger a refresh of the map
        queryClient.invalidateQueries({ queryKey: ["/api/gps"] });

        // Notify parent component to focus on the new location
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("focusMapLocation", {
              detail: { lat: locationData.lat, lng: locationData.lng },
            }),
          );
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

  if (!isAuthenticated || !walletAddress) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
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
          <CardTitle className="flex items-center gap-2">
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
        <CardTitle className="flex items-center gap-2">
          <Car className="h-5 w-5" />
          My Shared Vehicles
        </CardTitle>
        <CardDescription>
          {vehicles.length > 0
            ? `${vehicles.length} vehicle${vehicles.length > 1 ? "s" : ""} shared with this app`
            : "No vehicles currently shared with this app"}
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
          <div className="space-y-4">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.tokenId}
                className="border rounded-lg p-4 space-y-3"
                data-testid={`vehicle-card-${vehicle.tokenId}`}
              >
                <div className="flex justify-between items-start">
                  <div>
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
                  <Badge
                    variant="secondary"
                    data-testid={`vehicle-status-${vehicle.tokenId}`}
                  >
                    Shared
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => locationMutation.mutate(vehicle.tokenId)}
                    disabled={locationMutation.isPending}
                    data-testid={`fetch-location-${vehicle.tokenId}`}
                  >
                    {locationMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <MapPin className="h-4 w-4 mr-2" />
                    )}
                    {locationMutation.isPending
                      ? "Fetching..."
                      : "Get Location"}
                  </Button>
                </div>

                {vehicle.sacds.nodes.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-1">
                      <Shield className="h-4 w-4" />
                      Permissions
                    </h4>
                    {vehicle.sacds.nodes.map((sacd, index) => (
                      <div
                        key={index}
                        className="bg-muted/50 rounded p-3 text-sm"
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
      </CardContent>
    </Card>
  );
}
