"use client";

import { useEffect } from "react";

// Registers the service worker for offline/PWA support (Blueprint §16). Skips
// registration in development and during automated (?debug) runs to avoid stale
// caching while iterating.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator))
      return;
    if (new URLSearchParams(window.location.search).has("debug")) return;
    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* SW is a progressive enhancement; ignore failures */
      });
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);
  return null;
}
