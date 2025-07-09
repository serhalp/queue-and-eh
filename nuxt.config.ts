import netlify from '@netlify/vite-plugin'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  future: {
    compatibilityVersion: 4
  },
  experimental: {
    sharedPrerenderData: false
  },
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt'
  ],
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [
      netlify(),
    ],
  },
  nitro: {
    experimental: {
      wasm: true
    }
  }
})
