import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { api } from "../App";
import { toast } from "sonner";
import {
  MapPin,
  Navigation,
  RefreshCw,
  Clock,
  User,
  Locate,
} from "lucide-react";

const REFRESH_INTERVAL = 30000; // 30 seconds

// Default center (UK - London area)
const DEFAULT_CENTER = [51.5074, -0.1278];
const DEFAULT_ZOOM = 10;

const statusColors = {
  travelling: { bg: "#a855f7", label: "Travelling" },
  in_progress: { bg: "#06b6d4", label: "In Progress" },
};

function formatTimeAgo(dateStr) {
  if (!dateStr) return "Unknown";
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return `${Math.floor(diffHours / 24)}d ago`;
}

/**
 * Leaflet map component - loads Leaflet dynamically via CDN link tags
 * to avoid build issues with react-leaflet and CRA.
 */
function LeafletMap({ engineers, onRefresh }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  // Initialize map
  useEffect(() => {
    // Load Leaflet CSS if not already loaded
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
      link.crossOrigin = "";
      document.head.appendChild(link);
    }

    // Load Leaflet JS if not already loaded
    if (!window.L) {
      const script = document.createElement("script");
      script.id = "leaflet-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
      script.crossOrigin = "";
      script.onload = () => initMap();
      document.head.appendChild(script);
    } else {
      initMap();
    }

    function initMap() {
      if (mapInstanceRef.current || !mapRef.current || !window.L) return;

      mapInstanceRef.current = window.L.map(mapRef.current).setView(
        DEFAULT_CENTER,
        DEFAULT_ZOOM
      );

      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when engineers data changes
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (!engineers || engineers.length === 0) return;

    const bounds = [];

    engineers.forEach((eng) => {
      const color = statusColors[eng.status]?.bg || "#6b7280";
      const label = statusColors[eng.status]?.label || eng.status;

      // Create custom icon
      const icon = window.L.divIcon({
        className: "custom-engineer-marker",
        html: `
          <div style="
            background: ${color};
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 14px;
          ">
            ${eng.engineer_name?.charAt(0)?.toUpperCase() || "E"}
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20],
      });

      const marker = window.L.marker([eng.latitude, eng.longitude], { icon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div style="min-width: 180px; font-family: system-ui, sans-serif;">
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">
              ${eng.engineer_name}
            </div>
            <div style="
              display: inline-block;
              background: ${color};
              color: white;
              padding: 2px 8px;
              border-radius: 9999px;
              font-size: 11px;
              font-weight: 500;
              margin-bottom: 6px;
            ">
              ${label}
            </div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
              Updated: ${formatTimeAgo(eng.recorded_at)}
            </div>
            ${eng.accuracy ? `<div style="font-size: 11px; color: #9ca3af;">Accuracy: ~${Math.round(eng.accuracy)}m</div>` : ""}
          </div>
        `);

      markersRef.current.push(marker);
      bounds.push([eng.latitude, eng.longitude]);
    });

    // Fit bounds if we have markers
    if (bounds.length > 0) {
      if (bounds.length === 1) {
        mapInstanceRef.current.setView(bounds[0], 14);
      } else {
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [engineers]);

  return (
    <div
      ref={mapRef}
      style={{ width: "100%", height: "100%", minHeight: "500px", borderRadius: "8px" }}
    />
  );
}

export default function EngineerMap() {
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const refreshIntervalRef = useRef(null);

  const fetchLocations = useCallback(async () => {
    try {
      const response = await api.get("/locations/engineers");
      setEngineers(response.data);
      setLastRefresh(new Date());
    } catch (error) {
      // Silently handle - engineers might just not have location data yet
      console.warn("Failed to fetch engineer locations:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
    refreshIntervalRef.current = setInterval(fetchLocations, REFRESH_INTERVAL);
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchLocations]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold heading">Engineer Map</h1>
          <p className="text-sm text-muted-foreground">
            Live locations of engineers during active jobs
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-xs text-muted-foreground">
              Updated {formatTimeAgo(lastRefresh.toISOString())}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLocations}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Map */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-0 overflow-hidden rounded-lg" style={{ height: "600px" }}>
              <LeafletMap engineers={engineers} onRefresh={fetchLocations} />
            </CardContent>
          </Card>
        </div>

        {/* Engineer List Sidebar */}
        <div className="space-y-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                Active Engineers ({engineers.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {engineers.length === 0 ? (
                <div className="text-center py-6">
                  <Locate className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No active engineers with location tracking
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Engineers' locations appear here when they have active jobs
                  </p>
                </div>
              ) : (
                engineers.map((eng) => (
                  <div
                    key={eng.engineer_id}
                    className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{eng.engineer_name}</span>
                      <Badge
                        className={
                          eng.status === "travelling"
                            ? "bg-purple-500 text-white"
                            : "bg-cyan-500 text-white"
                        }
                      >
                        {statusColors[eng.status]?.label || eng.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatTimeAgo(eng.recorded_at)}</span>
                    </div>
                    {eng.accuracy && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Navigation className="h-3 w-3" />
                        <span>~{Math.round(eng.accuracy)}m accuracy</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Legend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-purple-500" />
                <span className="text-sm">Travelling</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-cyan-500" />
                <span className="text-sm">In Progress</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
