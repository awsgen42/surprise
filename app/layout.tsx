import type { Metadata, Viewport } from "next";
import "./globals.css";
import ServiceWorkerRegister from "@/app-shell/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "Sea of Stars — for Mubarra",
  description:
    "A magical ocean of glowing stars, awakened for one special person. Made with love.",
  applicationName: "Sea of Stars",
  authors: [{ name: "Awais" }],
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#03050f",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
