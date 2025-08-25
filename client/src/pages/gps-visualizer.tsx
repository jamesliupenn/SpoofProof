import { useState, useEffect } from "react";
import { Info } from "lucide-react";
import logoBlack from "@/assets/SpoofProof_Black.png";
import logoWhite from "@/assets/SpoofProof_White.png";
import GpsMap from "@/components/gps-map";
import DimoAuth from "@/components/dimo-auth";
import UserVehicles from "@/components/user-vehicles";
import ThemeToggle from "@/components/theme-toggle";
import { useTheme } from "@/components/theme-provider";
import GitHubButton from "react-github-btn";

interface GpsData {
  lat: number;
  lng: number;
  hdop: number;
}

export default function GpsVisualizer() {
  const { theme } = useTheme();
  const [gpsData, setGpsData] = useState<GpsData>({
    lat: 40.7128,
    lng: -74.006,
    hdop: 1.2,
  });

  const [lastKnownLocation, setLastKnownLocation] = useState<{
    lat: number;
    lng: number;
  }>({
    lat: 40.7128,
    lng: -74.006,
  });

  const [focusLocation, setFocusLocation] = useState<GpsData | null>(null);

  // Listen for focus location events from vehicle location fetches
  useEffect(() => {
    const handleFocusLocation = (event: CustomEvent) => {
      const { lat, lng, hdop } = event.detail;

      // Update GPS data with vehicle location data
      setGpsData({ lat, lng, hdop });

      // Update last known location
      setLastKnownLocation({ lat, lng });

      // Set focus location for map centering
      setFocusLocation({ lat, lng, hdop });

      // Clear focus location after a short delay to allow map to center
      setTimeout(() => setFocusLocation(null), 100);
    };

    window.addEventListener(
      "focusMapLocation",
      handleFocusLocation as EventListener,
    );
    return () => {
      window.removeEventListener(
        "focusMapLocation",
        handleFocusLocation as EventListener,
      );
    };
  }, []);

  return (
    <div className="min-h-screen bg-background" data-testid="gps-visualizer">
      {/* Header */}
      <header
        className="bg-card shadow-sm border-b border-border"
        data-testid="header"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-2 lg:space-x-3">
              <div
                className="h-10 sm:h-12 lg:h-16 flex items-center"
                data-testid="logo"
              >
                <img
                  src={theme === "dark" ? logoWhite : logoBlack}
                  alt="DIMO Build Logo"
                  className="h-10 sm:h-12 lg:h-16 w-auto object-contain max-w-none"
                />
              </div>
              <div>
                <h2
                  className="text-l lg:text-l font-semibold text-foreground"
                  data-testid="title"
                >
                  <span className="hidden sm:inline">
                    Validate VIN with location for Gig Drivers
                  </span>
                  <span className="sm:hidden">VIN Validator</span>
                </h2>
              </div>
            </div>
            <div className="flex items-center space-x-2 lg:space-x-4">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* DimoAuth - shows first on mobile, last on desktop */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <div className="lg:pb-4">
              <DimoAuth />
            </div>
          </div>

          {/* GitHub Buttons - shows second on mobile, first on desktop */}
          <div className="order-2 lg:order-1 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 lg:space-x-2 justify-center lg:justify-start items-center lg:items-start">
            <GitHubButton
              href="https://github.com/dimo-network/data-sdk"
              data-color-scheme="no-preference: light; light: light; dark: dark;"
              data-icon="octicon-star"
              data-size="large"
              data-show-count="true"
              aria-label="Star dimo-network/data-sdk on GitHub"
            >
              DIMO Data SDK
            </GitHubButton>
            <GitHubButton
              href="https://github.com/dimo-network/login-with-dimo"
              data-color-scheme="no-preference: light; light: light; dark: dark;"
              data-icon="octicon-star"
              data-size="large"
              data-show-count="true"
              aria-label="Star dimo-network/login-with-dimo on GitHub"
            >
              Login with DIMO
            </GitHubButton>
          </div>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 min-h-[calc(100vh-9rem)]">
          {/* Rest of your layout remains the same */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="lg:col-span-1 space-y-3 order-2 lg:order-1">
              <UserVehicles />
            </div>
          </div>
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="bg-card rounded-xl shadow-sm border border-border h-[50vh] lg:h-full overflow-hidden">
              <div className="h-12 border-b border-border flex items-center justify-between px-4 lg:px-6">
                <h3
                  className="font-semibold text-foreground flex items-center text-sm lg:text-base"
                  data-testid="map-title"
                >
                  <Info className="text-blue-600 mr-2" size={16} />
                  Vehicle Map
                </h3>
              </div>

              <div className="w-full h-[calc(100%-3rem)]">
                <GpsMap
                  gpsData={gpsData}
                  gpsStatus={{
                    status: "good-gps",
                    message: "Ready",
                    showOnMap: true,
                  }}
                  lastKnownLocation={lastKnownLocation}
                  focusLocation={focusLocation}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
