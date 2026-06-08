import { useEffect, useState } from "react";

export const ROUTES = ["dashboard", "cameras", "spaces", "analytics", "settings"];

function current() {
  const hash = window.location.hash.replace(/^#\/?/, "").split("?")[0];
  return ROUTES.includes(hash) ? hash : "dashboard";
}

export function navigate(route) {
  window.location.hash = `/${route}`;
}

// Minimal dependency-free hash router.
export function useHashRoute() {
  const [route, setRoute] = useState(current);
  useEffect(() => {
    const onChange = () => setRoute(current());
    window.addEventListener("hashchange", onChange);
    if (!window.location.hash) window.location.hash = "/dashboard";
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}
