import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from "url";
import path from "path";
import { defineConfig } from 'vite';

export default defineConfig(() => ({
  base: "", // relative paths
  server: {
    port: 3000,
  },
  preview: {
    port: 3000,
  },
  plugins: [react()],
  test: {
    environment: "happy-dom",
  },
}));
