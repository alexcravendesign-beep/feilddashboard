import { useEffect, useRef, useCallback, useState } from 'react';
import { api } from '../api';
import { addToLocationQueue, getUnsyncedLocations, markLocationsSynced } from '../db';
import { toast } from 'sonner';

const LOCATION_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 30000, // Accept cached positions up to 30s old
  timeout: 15000,    // Wait up to 15s for a position
};

const SYNC_INTERVAL = 60000; // Sync every 60 seconds
const MIN_DISTANCE_METERS = 10; // Minimum distance change to record a new point

function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Hook that tracks engineer location only when they have active jobs
 * (status === 'travelling' or 'in_progress').
 * 
 * Buffers locations in IndexedDB when offline and syncs when back online.
 */
export function useLocationTracking(jobs, isEnabled) {
  const watchIdRef = useRef(null);
  const syncIntervalRef = useRef(null);
  const lastPositionRef = useRef(null);
  const [isTracking, setIsTracking] = useState(false);
  const [lastLocation, setLastLocation] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('unknown');

  // Determine if engineer has active work
  const activeJobs = (jobs || []).filter(
    (job) => job.status === 'travelling' || job.status === 'in_progress'
  );
  const hasActiveWork = activeJobs.length > 0 && isEnabled;

  // Get the primary active job (prefer in_progress over travelling)
  const primaryJob =
    activeJobs.find((j) => j.status === 'in_progress') || activeJobs[0] || null;

  const syncLocations = useCallback(async () => {
    if (!navigator.onLine) return;

    try {
      const unsyncedLocations = await getUnsyncedLocations();
      if (unsyncedLocations.length === 0) return;

      const locationPayload = unsyncedLocations.map((loc) => ({
        latitude: loc.latitude,
        longitude: loc.longitude,
        accuracy: loc.accuracy,
        job_id: loc.jobId || null,
        status: loc.status || 'travelling',
        recorded_at: loc.recordedAt,
      }));

      await api.post('/locations/track', { locations: locationPayload });

      const ids = unsyncedLocations.map((loc) => loc.id);
      await markLocationsSynced(ids);
    } catch (error) {
      console.warn('Failed to sync locations:', error);
    }
  }, []);

  const handlePosition = useCallback(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;

      // Skip if position hasn't changed significantly
      if (lastPositionRef.current) {
        const distance = getDistanceMeters(
          lastPositionRef.current.latitude,
          lastPositionRef.current.longitude,
          latitude,
          longitude
        );
        if (distance < MIN_DISTANCE_METERS) return;
      }

      lastPositionRef.current = { latitude, longitude };
      const now = new Date().toISOString();

      const locationData = {
        latitude,
        longitude,
        accuracy,
        jobId: primaryJob?.id || null,
        status: primaryJob?.status || 'travelling',
        recordedAt: now,
      };

      setLastLocation({
        latitude,
        longitude,
        accuracy,
        timestamp: now,
      });

      // Store in IndexedDB queue
      addToLocationQueue(locationData).catch((err) => {
        console.warn('Failed to queue location:', err);
      });
    },
    [primaryJob]
  );

  const handleError = useCallback((error) => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        setPermissionStatus('denied');
        console.warn('Location permission denied');
        break;
      case error.POSITION_UNAVAILABLE:
        console.warn('Location unavailable');
        break;
      case error.TIMEOUT:
        console.warn('Location request timed out');
        break;
      default:
        console.warn('Location error:', error.message);
    }
  }, []);

  // Check permission status
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setPermissionStatus(result.state);
        result.onchange = () => {
          setPermissionStatus(result.state);
        };
      });
    }
  }, []);

  // Start/stop tracking based on active work
  useEffect(() => {
    if (!hasActiveWork || !('geolocation' in navigator)) {
      // Stop tracking
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        setIsTracking(false);
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
      // Final sync when stopping
      syncLocations();
      return;
    }

    // Check consent
    const consent = localStorage.getItem('location-tracking-consent');
    if (consent !== 'granted') {
      return;
    }

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      handleError,
      LOCATION_OPTIONS
    );
    setIsTracking(true);

    // Start sync interval
    syncIntervalRef.current = setInterval(syncLocations, SYNC_INTERVAL);

    // Sync on online event
    const handleOnline = () => {
      syncLocations();
    };
    window.addEventListener('online', handleOnline);

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
      window.removeEventListener('online', handleOnline);
      setIsTracking(false);
      // Sync remaining locations on cleanup
      syncLocations();
    };
  }, [hasActiveWork, handlePosition, handleError, syncLocations]);

  return {
    isTracking,
    lastLocation,
    permissionStatus,
    hasActiveWork,
    activeJobCount: activeJobs.length,
  };
}

/**
 * Hook to manage location tracking consent
 */
export function useLocationConsent() {
  const [consent, setConsentState] = useState(() => {
    return localStorage.getItem('location-tracking-consent') || 'pending';
  });

  const grantConsent = useCallback(() => {
    localStorage.setItem('location-tracking-consent', 'granted');
    setConsentState('granted');
  }, []);

  const revokeConsent = useCallback(() => {
    localStorage.setItem('location-tracking-consent', 'revoked');
    setConsentState('revoked');
  }, []);

  const resetConsent = useCallback(() => {
    localStorage.removeItem('location-tracking-consent');
    setConsentState('pending');
  }, []);

  return {
    consent,
    isGranted: consent === 'granted',
    isPending: consent === 'pending',
    isRevoked: consent === 'revoked',
    grantConsent,
    revokeConsent,
    resetConsent,
  };
}
