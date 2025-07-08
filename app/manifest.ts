import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Atec Ponto - Sistema de Controle de Ponto",
    short_name: "Ponto Digital",
    description: "Sistema completo de controle de ponto e gestão de funcionários",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#09893E",
    orientation: "portrait",
    icons: [
      {
        src: "/pwa-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/pwa-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    categories: ["business", "productivity"],
    lang: "pt-BR",
  }
}
