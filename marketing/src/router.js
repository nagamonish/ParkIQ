import { useEffect, useState } from "react";

export const ROUTES = [
  "home",
  "how-it-works",
  "technology",
  "drivers",
  "operators",
  "pricing",
  "about",
  "blog",
  "careers",
  "contact",
  "faq",
  "privacy",
];

function current() {
  const hash = window.location.hash.replace(/^#\/?/, "").split("?")[0];
  return ROUTES.includes(hash) ? hash : "home";
}

export function navigate(route) {
  window.location.hash = route === "home" ? "/" : `/${route}`;
  window.scrollTo({ top: 0, behavior: "auto" });
}

export function useHashRoute() {
  const [route, setRoute] = useState(current);
  useEffect(() => {
    const onChange = () => {
      setRoute(current());
      window.scrollTo({ top: 0, behavior: "auto" });
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}
