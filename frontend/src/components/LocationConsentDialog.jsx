import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { MapPin, Shield, Battery, Wifi } from "lucide-react";

export default function LocationConsentDialog({ open, onConsent, onDecline }) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onDecline(); }}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="heading flex items-center gap-2">
            <MapPin className="h-5 w-5 text-cyan-400" />
            Location Tracking
          </DialogTitle>
          <DialogDescription className="text-slate-300">
            Enable location sharing to help the office track your position during active jobs.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-slate-700/50 rounded-lg">
              <Shield className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Privacy First</p>
                <p className="text-xs text-slate-400">
                  Your location is only tracked when you have an active job (travelling or in progress). Tracking stops automatically when you're not working.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-700/50 rounded-lg">
              <Battery className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Battery Friendly</p>
                <p className="text-xs text-slate-400">
                  Location updates only happen during active work hours. No background tracking when you're off the clock.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-700/50 rounded-lg">
              <Wifi className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Works Offline</p>
                <p className="text-xs text-slate-400">
                  Location data is stored locally when offline and syncs automatically when your connection is restored.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 border-slate-600"
              onClick={onDecline}
            >
              Not Now
            </Button>
            <Button
              className="flex-1 bg-cyan-600 hover:bg-cyan-700"
              onClick={onConsent}
            >
              <MapPin className="h-4 w-4 mr-2" />
              Enable Tracking
            </Button>
          </div>

          <p className="text-xs text-slate-500 text-center">
            You can change this setting at any time from your profile.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
