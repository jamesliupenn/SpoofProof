import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Satellite, Info } from "lucide-react";
import dimoLogo from "@assets/Logo_DIMOBuild_black_1754591736408.png";
import GpsMap from "@/components/gps-map";
import GpsControls from "@/components/gps-controls";
import GpsStatus from "@/components/gps-status";
import DimoAuth from "@/components/dimo-auth";
import UserVehicles from "@/components/user-vehicles";

interface GpsData {
  lat: number;
  lng: number;
  hdop: number;
}

interface GpsStatusResult {
  status: "no-gps" | "poor-gps" | "good-gps";
  message: string;
  showOnMap?: boolean;
}

interface TestScenario {
  lat: number;
  lng: number;
  hdop: number;
  description: string;
}

function renderGPSStatus(
  lat: number,
  lng: number,
  hdop: number,
): GpsStatusResult {
  if (lat === 0 && lng === 0 && hdop === 0) {
    return { status: "no-gps", message: "No GPS signal", showOnMap: true };
  }

  if (hdop > 10) {
    return { status: "poor-gps", message: `Low accuracy (±${hdop * 5}m)` };
  }

  return {
    status: "good-gps",
    message: `High accuracy (±${Math.max(hdop * 2, 3)}m)`,
  };
}

export default function GpsVisualizer() {
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

  const [focusLocation, setFocusLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const { data: testScenarios = [] } = useQuery<TestScenario[]>({
    queryKey: ["/api/gps/test-scenarios"],
  });

  const gpsStatus = renderGPSStatus(gpsData.lat, gpsData.lng, gpsData.hdop);

  const handleGpsDataChange = (newData: GpsData) => {
    setGpsData(newData);

    // Update last known location if we have valid GPS coordinates
    if (newData.lat !== 0 || newData.lng !== 0) {
      setLastKnownLocation({ lat: newData.lat, lng: newData.lng });
    }
  };

  // Listen for focus location events from vehicle location fetches
  useEffect(() => {
    const handleFocusLocation = (event: CustomEvent) => {
      const { lat, lng, hdop } = event.detail;

      // Update GPS data with vehicle location data
      setGpsData({ lat, lng, hdop });

      // Update last known location
      setLastKnownLocation({ lat, lng });

      // Set focus location for map centering
      setFocusLocation({ lat, lng });

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
    <div className="min-h-screen bg-slate-50" data-testid="gps-visualizer">
      {/* Header */}
      <header
        className="bg-white shadow-sm border-b border-slate-200"
        data-testid="header"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 lg:space-x-3">
              <div className="h-6 lg:h-8 flex items-center" data-testid="logo">
                <img
                  src={dimoLogo}
                  alt="DIMO Logo"
                  className="h-6 lg:h-8 w-auto object-contain"
                />
              </div>
              <div>
                <h1
                  className="text-lg lg:text-xl font-semibold text-slate-900"
                  data-testid="title"
                >
                  <span className="hidden sm:inline">
                    DIMO GPS Signal Visualizer
                  </span>
                  <span className="sm:hidden">DIMO GPS</span>
                </h1>
                <p
                  className="text-xs lg:text-sm text-slate-500 hidden sm:block"
                  data-testid="subtitle"
                >
                  Real-time GPS accuracy mapping
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 lg:space-x-4">
              <div
                className="flex items-center space-x-1 lg:space-x-2 px-2 lg:px-3 py-1 rounded-full bg-slate-100"
                data-testid="header-status"
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    gpsStatus.status === "good-gps"
                      ? "bg-green-500"
                      : gpsStatus.status === "poor-gps"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                />
                <span className="text-xs lg:text-sm font-medium text-slate-600">
                  <span className="hidden sm:inline">
                    {gpsStatus.status === "good-gps"
                      ? "Good GPS"
                      : gpsStatus.status === "poor-gps"
                        ? "Poor GPS"
                        : "No GPS"}
                  </span>
                  <span className="sm:hidden">
                    {gpsStatus.status === "good-gps"
                      ? "Good"
                      : gpsStatus.status === "poor-gps"
                        ? "Poor"
                        : "None"}
                  </span>
                </span>
              </div>
              <DimoAuth />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6 min-h-[calc(100vh-8rem)]">
          {/* Control Panel */}
          <div className="lg:col-span-1 space-y-6 order-2 lg:order-1">
            <div className="hidden lg:block">
              <GpsStatus gpsStatus={gpsStatus} gpsData={gpsData} />
            </div>
            <UserVehicles />
            <GpsControls
              gpsData={gpsData}
              onGpsDataChange={handleGpsDataChange}
              testScenarios={testScenarios}
            />
          </div>

          {/* Map Container */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-[50vh] lg:h-full overflow-hidden">
              <div className="h-12 border-b border-slate-200 flex items-center justify-between px-4 lg:px-6">
                <h3
                  className="font-semibold text-slate-900 flex items-center text-sm lg:text-base"
                  data-testid="map-title"
                >
                  <Info className="text-blue-600 mr-2" size={16} />
                  GPS Signal Visualization
                </h3>
                <div className="hidden sm:flex items-center space-x-2 lg:space-x-4 text-xs lg:text-sm">
                  <div
                    className="flex items-center space-x-1 lg:space-x-2"
                    data-testid="legend-good"
                  >
                    <div className="w-2 h-2 lg:w-3 lg:h-3 bg-green-500 rounded-full" />
                    <span className="text-slate-600 hidden lg:inline">
                      Good Signal
                    </span>
                    <span className="text-slate-600 lg:hidden">Good</span>
                  </div>
                  <div
                    className="flex items-center space-x-1 lg:space-x-2"
                    data-testid="legend-poor"
                  >
                    <div className="w-2 h-2 lg:w-3 lg:h-3 bg-yellow-500 rounded-full" />
                    <span className="text-slate-600 hidden lg:inline">
                      Poor Signal
                    </span>
                    <span className="text-slate-600 lg:hidden">Poor</span>
                  </div>
                  <div
                    className="flex items-center space-x-1 lg:space-x-2"
                    data-testid="legend-no-signal"
                  >
                    <div className="w-2 h-2 lg:w-3 lg:h-3 bg-red-500 rounded-full" />
                    <span className="text-slate-600 hidden lg:inline">
                      No Signal
                    </span>
                    <span className="text-slate-600 lg:hidden">None</span>
                  </div>
                </div>
              </div>

              <div className="w-full h-[calc(100%-3rem)]">
                <GpsMap
                  gpsData={gpsData}
                  gpsStatus={gpsStatus}
                  lastKnownLocation={lastKnownLocation}
                  focusLocation={focusLocation}
                />
              </div>
            </div>
          </div>

          {/* Mobile GPS Status - shown only on mobile */}
          <div className="lg:hidden order-3">
            <GpsStatus gpsStatus={gpsStatus} gpsData={gpsData} />
          </div>
        </div>
      </div>
    </div>
  );
}
