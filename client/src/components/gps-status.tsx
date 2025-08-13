import { Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

interface GpsStatusProps {
  gpsStatus: GpsStatusResult;
  gpsData: GpsData;
}

export default function GpsStatus({ gpsStatus, gpsData }: GpsStatusProps) {
  const getStatusColor = () => {
    switch (gpsStatus.status) {
      case 'good-gps':
        return 'bg-green-500';
      case 'poor-gps':
        return 'bg-yellow-500';
      case 'no-gps':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = () => {
    switch (gpsStatus.status) {
      case 'good-gps':
        return 'Good GPS';
      case 'poor-gps':
        return 'Poor GPS';
      case 'no-gps':
        return 'No GPS';
      default:
        return 'Unknown';
    }
  };

  return (
    <Card data-testid="gps-status">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Info className="text-blue-600 mr-2" size={16} />
          GPS Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center space-x-3">
          <div className={`w-4 h-4 ${getStatusColor()} rounded-full`} data-testid="status-indicator" />
          <div>
            <div className="font-medium text-slate-900" data-testid="status-label">
              {getStatusLabel()}
            </div>
            <div className="text-sm text-slate-500" data-testid="status-message">
              {gpsStatus.message}
            </div>
          </div>
        </div>
        
        <div className="bg-slate-50 rounded-lg p-2">
          <div className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-2">
            Current Position
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Latitude:</span>
              <span className="text-sm font-mono text-slate-900" data-testid="text-lat">
                {gpsData.lat.toFixed(6)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Longitude:</span>
              <span className="text-sm font-mono text-slate-900" data-testid="text-lng">
                {gpsData.lng.toFixed(6)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">HDOP:</span>
              <span className="text-sm font-mono text-slate-900" data-testid="text-hdop">
                {gpsData.hdop}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
