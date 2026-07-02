import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/icon.svg", "icons/icon-maskable.svg", "offline.html", "privacy.html", "terms.html"],
      manifest: {
        name: "FitRadar — Meus treinos",
        short_name: "Treinos",
        description: "App do aluno: check-in diário, streak, programas e progresso do seu criador.",
        lang: "pt-BR",
        start_url: "/student",
        scope: "/",
        display: "standalone",
        orientation: "portrait-primary",
        background_color: "#0d1117",
        theme_color: "#0d1117",
        categories: ["health", "fitness", "lifestyle"],
        icons: [
          {
            src: "/icons/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "/icons/icon-maskable.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "maskable",
          },
          {
            src: "/icons/icon.svg",
            sizes: "192x192",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "/icons/icon-maskable.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
        shortcuts: [
          {
            name: "Treino de hoje",
            short_name: "Treino",
            url: "/student",
            description: "Check-in e treino do dia",
          },
          {
            name: "Meu progresso",
            short_name: "Progresso",
            url: "/student/progress",
            description: "Aderência e streak",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,svg,webp,woff2}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/],
        importScripts: ["push-sw.js"],
        runtimeCaching: [
          {
            urlPattern: ({ request }) =>
              request.destination === "script" ||
              request.destination === "style" ||
              request.destination === "font" ||
              request.destination === "image",
            handler: "NetworkFirst",
            options: {
              cacheName: "static-assets",
              expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 * 7 },
              networkTimeoutSeconds: 3,
            },
          },
          {
            urlPattern: ({ sameOrigin, request }) =>
              sameOrigin && request.destination === "document",
            handler: "NetworkFirst",
            options: {
              cacheName: "html-cache",
              networkTimeoutSeconds: 5,
            },
          },
          {
            urlPattern: ({ url }) =>
              url.pathname.startsWith("/api/v1/my/workouts"),
            handler: "NetworkFirst",
            options: {
              cacheName: "student-workouts-api",
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 },
              networkTimeoutSeconds: 3,
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        navigateFallback: "/index.html",
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
  },
});
