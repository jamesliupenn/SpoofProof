import { useEffect, useRef, useState } from "react";
import L from "leaflet";

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

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

interface GpsMapProps {
  gpsData: GpsData;
  gpsStatus: GpsStatusResult;
  lastKnownLocation: { lat: number; lng: number };
  focusLocation?: GpsData | null;
}

export default function GpsMap({
  gpsData,
  gpsStatus,
  lastKnownLocation,
  focusLocation,
}: GpsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const userPinRef = useRef<L.Marker | null>(null);
  const [hasUserPin, setHasUserPin] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    mapInstanceRef.current = L.map(mapRef.current).setView(
      [40.7128, -74.006],
      16,
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(mapInstanceRef.current);

    // Add click event to drop pins
    mapInstanceRef.current.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      
      // Remove existing user pin if it exists
      if (userPinRef.current) {
        mapInstanceRef.current!.removeLayer(userPinRef.current);
        userPinRef.current = null;
      }
      
      // Create a custom red pin icon for user clicks
      const redIcon = L.icon({
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
        className: 'red-marker'
      });
      
      // Create new pin and add to map
      userPinRef.current = L.marker([lat, lng], { icon: redIcon })
        .addTo(mapInstanceRef.current!)
        .bindPopup(`📍 Pin dropped at:<br>Lat: ${lat.toFixed(6)}<br>Lng: ${lng.toFixed(6)}`)
        .openPopup();
      
      // Set flag to indicate user has dropped a pin
      setHasUserPin(true);
      
      // Refocus map to the new pin location
      mapInstanceRef.current!.setView([lat, lng], mapInstanceRef.current!.getZoom());
    });
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Only show GPS signals if user hasn't dropped a manual pin
    if (!hasUserPin) {
      // Clear existing markers and circles
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
      if (circleRef.current) {
        map.removeLayer(circleRef.current);
        circleRef.current = null;
      }

      const { lat, lng, hdop } = gpsData;

      // Use last known location if GPS is offline (0,0,0)
      const displayLat =
        lat === 0 && lng === 0 && hdop === 0 ? lastKnownLocation.lat : lat;
      const displayLng =
        lat === 0 && lng === 0 && hdop === 0 ? lastKnownLocation.lng : lng;
      const isOffline = lat === 0 && lng === 0 && hdop === 0;

      // Determine marker color based on status
      const markerColor =
        gpsStatus.status === "good-gps"
          ? "#22c55e"
          : gpsStatus.status === "poor-gps"
            ? "#eab308"
            : "#ef4444";

      // Create custom marker
      const markerIcon = L.divIcon({
        className: "custom-marker",
        html: `<div style="background-color: ${markerColor}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      // Add marker at display location
      markerRef.current = L.marker([displayLat, displayLng], {
        icon: markerIcon,
      }).addTo(map);

      // Only show accuracy circle if GPS is active
      if (!isOffline) {
        // Calculate accuracy radius
        const accuracyRadius = hdop > 10 ? hdop * 5 : Math.max(hdop * 2, 3);

        // Add accuracy circle
        circleRef.current = L.circle([displayLat, displayLng], {
          color: markerColor,
          fillColor: markerColor,
          fillOpacity: 0.1,
          radius: accuracyRadius,
        }).addTo(map);
      }

      // Add popup with details
      const popupContent = isOffline
        ? `
        <div class="p-2">
          <div class="font-semibold text-red-600">NO GPS</div>
          <div class="text-sm text-gray-600">No GPS signal</div>
          <div class="text-xs text-gray-500 mt-1">
            Last known location:<br>
            Lat: ${displayLat.toFixed(6)}<br>
            Lng: ${displayLng.toFixed(6)}
          </div>
        </div>
      `
        : `
        <div class="p-2">
          <div class="font-semibold">${gpsStatus.status.replace("-", " ").toUpperCase()}</div>
          <div class="text-sm text-gray-600">${gpsStatus.message}</div>
          <div class="text-xs text-gray-500 mt-1">
            Lat: ${lat.toFixed(6)}<br>
            Lng: ${lng.toFixed(6)}<br>
            HDOP: ${hdop}
          </div>
        </div>
      `;

      markerRef.current.bindPopup(popupContent);

      // Center map on display location only if no user pin exists
      map.setView([displayLat, displayLng], map.getZoom());
    } else {
      // If user has dropped a pin, remove GPS markers and circles
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
      if (circleRef.current) {
        map.removeLayer(circleRef.current);
        circleRef.current = null;
      }
    }
  }, [gpsData, gpsStatus, lastKnownLocation, hasUserPin]);

  // Effect to handle clearing user pins when GPS location is requested
  useEffect(() => {
    const handleClearUserPin = () => {
      if (userPinRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(userPinRef.current);
        userPinRef.current = null;
      }
      setHasUserPin(false);
    };

    window.addEventListener("clearUserPin", handleClearUserPin);
    return () => {
      window.removeEventListener("clearUserPin", handleClearUserPin);
    };
  }, []);

  // Separate effect for focus location changes
  useEffect(() => {
    if (focusLocation && mapInstanceRef.current) {
      mapInstanceRef.current.setView(
        [focusLocation.lat, focusLocation.lng],
        16,
      );
    }
  }, [focusLocation]);

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
