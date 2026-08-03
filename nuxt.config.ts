// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: false },

  modules: ["@nuxt/eslint"],

  eslint: {
    config: {
      standalone: false,
    },
  },

  imports: {
    scan: false,
  },

  components: {
    dirs: [],
  },
});
