import { useEffect, useRef } from "react";
import L from "leaflet";

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

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

interface GpsMapProps {
  gpsData: GpsData;
  gpsStatus: GpsStatusResult;
}

export default function GpsMap({ gpsData, gpsStatus }: GpsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    mapInstanceRef.current = L.map(mapRef.current).setView([45, -82], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstanceRef.current);

  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Clear existing markers and circles
    if (markerRef.current) {
      map.removeLayer(markerRef.current);
      markerRef.current = null;
    }
    if (circleRef.current) {
      map.removeLayer(circleRef.current);
      circleRef.current = null;
    }

    // Don't show marker if GPS is offline
    if (gpsStatus.showOnMap === false) {
      return;
    }

    const { lat, lng, hdop } = gpsData;

    // Determine marker color based on status
    const markerColor = gpsStatus.status === 'good-gps' ? '#22c55e' : 
                       gpsStatus.status === 'poor-gps' ? '#eab308' : '#ef4444';

    // Create custom marker
    const markerIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${markerColor}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    // Add marker
    markerRef.current = L.marker([lat, lng], { icon: markerIcon }).addTo(map);

    // Calculate accuracy radius
    const accuracyRadius = hdop > 10 ? hdop * 5 : Math.max(hdop * 2, 3);

    // Add accuracy circle
    circleRef.current = L.circle([lat, lng], {
      color: markerColor,
      fillColor: markerColor,
      fillOpacity: 0.1,
      radius: accuracyRadius
    }).addTo(map);

    // Add popup with details
    markerRef.current.bindPopup(`
      <div class="p-2">
        <div class="font-semibold">${gpsStatus.status.replace('-', ' ').toUpperCase()}</div>
        <div class="text-sm text-gray-600">${gpsStatus.message}</div>
        <div class="text-xs text-gray-500 mt-1">
          Lat: ${lat.toFixed(6)}<br>
          Lng: ${lng.toFixed(6)}<br>
          HDOP: ${hdop}
        </div>
      </div>
    `);

    // Center map on new location
    map.setView([lat, lng], map.getZoom());

  }, [gpsData, gpsStatus]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full rounded-b-xl"
      data-testid="gps-map"
    />
  );
}
