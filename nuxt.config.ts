// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-05-15",
  devtools: { enabled: true },
  experimental: {
    sharedPrerenderData: false,
  },
  modules: ["@nuxtjs/tailwindcss", "@pinia/nuxt", "@netlify/nuxt"],
  css: ["~/assets/css/main.css"],
  nitro: {
    experimental: {
      wasm: true,
    },
  },
});