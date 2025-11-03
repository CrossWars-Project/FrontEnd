import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    globals: true,
    // Add JSX support
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    // Configure JSX transformation
    transformMode: {
      web: [/\.[jt]sx?$/],
    },
  },
  // Ensure JSX files are transformed
  esbuild: {
    jsx: 'automatic',
  },
})