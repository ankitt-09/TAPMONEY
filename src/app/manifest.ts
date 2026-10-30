import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TapMoney",
    short_name: "TapMoney",
    description: "Log spending in one tap.",
    start_url: "/add",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b0d0c",
    theme_color: "#0b0d0c",
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
