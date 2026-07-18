import type { MetadataRoute } from "next";

// PWA manifest (Blueprint §16) — an installable, full-screen, app-like gift.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sea of Stars — for Mubarra",
    short_name: "Sea of Stars",
    description:
      "A magical ocean of glowing stars, awakened for one special person.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#03050f",
    theme_color: "#03050f",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
