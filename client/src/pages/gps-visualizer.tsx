import { useState, useEffect } from "react";
import { Info } from "lucide-react";
import driveTunesLogo from "@assets/DriveTunes_Logo.png";
import GpsMap from "@/components/gps-map";
import DimoAuth from "@/components/dimo-auth";
import UserVehicles from "@/components/user-vehicles";
import SpotifyPlaylistGenerator from "@/components/spotify-playlist-generator";

interface GpsData {
  lat: number;
  lng: number;
  hdop: number;
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
    <div className="min-h-screen bg-slate-50" data-testid="gps-visualizer">
      {/* Header */}
      <header
        className="bg-white shadow-sm border-b border-slate-200"
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
                  src={driveTunesLogo}
                  alt="DriveTunes Logo"
                  className="h-10 sm:h-12 lg:h-16 w-auto object-contain max-w-none"
                />
              </div>
              <div>
                <h1
                  className="text-xl lg:text-2xl font-semibold text-slate-900"
                  data-testid="title"
                >
                  <span className="hidden sm:inline">DriveTunes</span>
                  <span className="sm:hidden">DriveTunes</span>
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-2 lg:space-x-4">
              <DimoAuth />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 min-h-[calc(100vh-9rem)]">
          {/* Control Panel */}
          <div className="lg:col-span-1 space-y-3 order-2 lg:order-1">
            <UserVehicles />
            <SpotifyPlaylistGenerator />
          </div>

          {/* Map Container */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-[50vh] lg:h-full overflow-hidden">
              <div className="h-12 border-b border-slate-200 flex items-center justify-between px-4 lg:px-6">
                <h3
                  className="font-semibold text-slate-900 flex items-center text-sm lg:text-base"
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
