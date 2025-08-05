import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    cors: {
      origin: [
        'https://alpha.dustproject.org',
        'https://dustproject.org',
        'http://localhost:5500',
        'http://localhost:5501',
        'http://localhost:5502',
        'http://localhost:5503'
      ],
      credentials: true
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
}); 