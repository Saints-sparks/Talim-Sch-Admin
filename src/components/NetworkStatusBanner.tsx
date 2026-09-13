"use client";

import { useEffect, useRef, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { apiClient } from "@/lib/apiClient";

type Status = "online" | "offline" | "reconnected";

/**
 * One banner for connectivity, so no page has to handle it. Shows while the
 * browser reports offline or the API client hits an unreachable server, and
 * flashes "Back online" for a moment after recovery.
 */
export default function NetworkStatusBanner() {
  const [status, setStatus] = useState<Status>("online");
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const goOffline = () => setStatus("offline");
    const goOnline = () => {
      setStatus((prev) => (prev === "offline" ? "reconnected" : prev));
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setStatus("online"), 3000);
    };

    if (typeof navigator !== "undefined" && navigator.onLine === false) goOffline();
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    const unsubscribe = apiClient.onError((error) => {
      if (error.code === "NETWORK_OFFLINE") goOffline();
    });

    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
      unsubscribe();
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  if (status === "online") return null;

  const offline = status === "offline";
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-x-0 top-0 z-[100] flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium shadow-md ${
        offline ? "bg-amber-500 text-amber-950" : "bg-emerald-600 text-white"
      }`}
    >
      {offline ? <WifiOff className="h-4 w-4" aria-hidden /> : <Wifi className="h-4 w-4" aria-hidden />}
      {offline ? "You're offline. Changes can't be saved until your connection is back." : "Back online."}
    </div>
  );
}
