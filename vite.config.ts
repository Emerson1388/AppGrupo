import os from "node:os"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { corridasApiPlugin } from "./vite-plugin-corridas"

function lanIP() {
  const nets = os.networkInterfaces()
  for (const addrs of Object.values(nets)) {
    for (const a of addrs ?? []) {
      if (a.family === "IPv4" && !a.internal) return a.address
    }
  }
  return "localhost"
}

const lanOrigin = `http://${lanIP()}:5173`

export default defineConfig({
  plugins: [react(), tailwindcss(), corridasApiPlugin()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: true,
    port: 5173,
  },
  define: {
    __LAN_ORIGIN__: JSON.stringify(lanOrigin),
  },
  appType: "spa",
})
