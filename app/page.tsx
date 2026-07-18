"use client";

import dynamic from "next/dynamic";

// The entire experience is WebGL + Web Audio, so it only runs on the client.
// ssr:false requires this importer to be a Client Component (Next 15+).
const Experience = dynamic(() => import("@/app-shell/Experience"), {
  ssr: false,
});

export default function Page() {
  return <Experience />;
}
