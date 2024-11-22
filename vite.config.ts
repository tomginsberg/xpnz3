import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { resolve } from "path"
import { VitePWA } from "vite-plugin-pwa"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "robots.txt"],
      manifest: {
        name: "xpnz",
        short_name: "xpnz",
        description: "XPNZ - Group Expenses Made Easy",
        theme_color: "#ffffff",
        icons: [
          // Android icons
          {
            src: "/AppImages/android/android-launchericon-48-48.png",
            sizes: "48x48",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/AppImages/android/android-launchericon-72-72.png",
            sizes: "72x72",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/AppImages/android/android-launchericon-96-96.png",
            sizes: "96x96",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/AppImages/android/android-launchericon-144-144.png",
            sizes: "144x144",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/AppImages/android/android-launchericon-192-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/AppImages/android/android-launchericon-512-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          },
          // iOS icons
          {
            src: "/AppImages/ios/180.png",
            sizes: "180x180",
            type: "image/png"
          },
          {
            src: "/AppImages/ios/167.png",
            sizes: "167x167",
            type: "image/png"
          },
          {
            src: "/AppImages/ios/152.png",
            sizes: "152x152",
            type: "image/png"
          },
          {
            src: "/AppImages/ios/120.png",
            sizes: "120x120",
            type: "image/png"
          },
          // 256
          {
            src: "/AppImages/ios/256.png",
            sizes: "256x256",
            type: "image/png"
          },
          //512
          {
            src: "/AppImages/ios/512.png",
            sizes: "512x512",
            type: "image/png"
          },
          //1024
          {
            src: "/AppImages/ios/1024.png",
            sizes: "1024x1024",
            type: "image/png"
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src")
    }
  }
})
