import { useCallback, useState } from "react";

// Thin wrapper over the browser geolocation API. Stays "idle" until the
// visitor explicitly asks, so we never prompt on load.
export function useGeolocation() {
  const [coords, setCoords] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | locating | granted | denied | unsupported

  const request = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setStatus("unsupported");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus("granted");
      },
      () => setStatus("denied"),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
    );
  }, []);

  const clear = useCallback(() => {
    setCoords(null);
    setStatus("idle");
  }, []);

  return { coords, status, request, clear };
}
