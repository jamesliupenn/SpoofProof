import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Satellite, Info } from "lucide-react";
import GpsMap from "@/components/gps-map";
import GpsControls from "@/components/gps-controls";
import GpsStatus from "@/components/gps-status";

interface GpsData {
  lat: number;
  lng: number;
  hdop: number;
}

interface GpsStatusResult {
  status: 'no-gps' | 'poor-gps' | 'good-gps';
  message: string;
  showOnMap?: boolean;
}

interface TestScenario {
  lat: number;
  lng: number;
  hdop: number;
  description: string;
}

function renderGPSStatus(lat: number, lng: number, hdop: number): GpsStatusResult {
  if (lat === 0 && lng === 0 && hdop === 0) {
    return { status: 'no-gps', message: 'No GPS signal', showOnMap: false };
  }

  if (hdop > 10) {
    return { status: 'poor-gps', message: `Low accuracy (±${hdop * 5}m)` };
  }

  return { status: 'good-gps', message: `High accuracy (±${Math.max(hdop * 2, 3)}m)` };
}

export default function GpsVisualizer() {
  const [gpsData, setGpsData] = useState<GpsData>({
    lat: 45,
    lng: -82,
    hdop: 1.2
  });

  const { data: testScenarios = [] } = useQuery<TestScenario[]>({
    queryKey: ['/api/gps/test-scenarios'],
  });

  const gpsStatus = renderGPSStatus(gpsData.lat, gpsData.lng, gpsData.hdop);

  const handleGpsDataChange = (newData: GpsData) => {
    setGpsData(newData);
  };

  return (
    <div className="min-h-screen bg-slate-50" data-testid="gps-visualizer">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200" data-testid="header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center" data-testid="logo">
                <Satellite className="text-white" size={16} />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900" data-testid="title">
                  GPS Signal Visualizer
                </h1>
                <p className="text-sm text-slate-500" data-testid="subtitle">
                  Real-time GPS accuracy mapping
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-100" data-testid="header-status">
                <div className={`w-2 h-2 rounded-full ${
                  gpsStatus.status === 'good-gps' ? 'bg-green-500' :
                  gpsStatus.status === 'poor-gps' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className="text-sm font-medium text-slate-600">
                  {gpsStatus.status === 'good-gps' ? 'Good GPS' :
                   gpsStatus.status === 'poor-gps' ? 'Poor GPS' : 'No GPS'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-8rem)]">
          
          {/* Control Panel */}
          <div className="lg:col-span-1 space-y-6">
            <GpsControls 
              gpsData={gpsData}
              onGpsDataChange={handleGpsDataChange}
              testScenarios={testScenarios}
            />
            <GpsStatus 
              gpsStatus={gpsStatus}
              gpsData={gpsData}
            />
          </div>

          {/* Map Container */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-full overflow-hidden">
              <div className="h-12 border-b border-slate-200 flex items-center justify-between px-6">
                <h3 className="font-semibold text-slate-900 flex items-center" data-testid="map-title">
                  <Info className="text-blue-600 mr-2" size={16} />
                  GPS Signal Visualization
                </h3>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-2" data-testid="legend-good">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <span className="text-slate-600">Good Signal</span>
                  </div>
                  <div className="flex items-center space-x-2" data-testid="legend-poor">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                    <span className="text-slate-600">Poor Signal</span>
                  </div>
                  <div className="flex items-center space-x-2" data-testid="legend-no-signal">
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                    <span className="text-slate-600">No Signal</span>
                  </div>
                </div>
              </div>
              
              <div className="w-full h-[calc(100%-3rem)]">
                <GpsMap 
                  gpsData={gpsData}
                  gpsStatus={gpsStatus}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
