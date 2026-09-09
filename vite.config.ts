/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// `base: './'` keeps every asset path relative so the same build works both at
// the custom domain root (https://impact-ia.quickscale.ai/) and at the GitHub
// Pages project path (https://quickscale-ai.github.io/llm-cost-lab/).
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
