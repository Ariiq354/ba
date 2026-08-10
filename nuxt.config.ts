// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: false },

  modules: [
    "@nuxt/eslint",
    "nuxt-security",
    "@nuxt/ui",
    "@nuxt/image",
    "nuxt-charts",
  ],

  css: ["~/assets/css/main.css"],

  eslint: {
    config: {
      standalone: false,
    },
  },

  ui: {
    colorMode: false,
  },

  imports: {
    scan: false,
  },

  components: {
    dirs: [],
  },

  security: {
    sri: false,
    headers: {
      crossOriginResourcePolicy: "same-site",
      contentSecurityPolicy: {
        "img-src": [
          "'self'",
          "data:",
          "blob:",
          "https://pub-d903c762cae0445d8dce45d854b69f88.r2.dev",
        ],
      },
    },
  },

  runtimeConfig: {
    public: {
      imageUrl: "https://pub-d903c762cae0445d8dce45d854b69f88.r2.dev",
    },
  },

  icon: {
    clientBundle: {
      scan: true,
      icons: [
        "tabler:arrow-down",
        "tabler:arrow-left",
        "tabler:arrow-right",
        "tabler:arrow-up",
        "tabler:alert-square-rounded",
        "tabler:check",
        "tabler:chevrons-left",
        "tabler:chevrons-right",
        "tabler:chevron-down",
        "tabler:chevron-left",
        "tabler:chevron-right",
        "tabler:chevron-up",
        "tabler:x",
        "tabler:copy",
        "tabler:copy-check",
        "tabler:moon",
        "tabler:grip-vertical",
        "tabler:dots",
        "tabler:square-rounded-x",
        "tabler:external-link",
        "tabler:eye",
        "tabler:eye-off",
        "tabler:file",
        "tabler:folder",
        "tabler:folder-open",
        "tabler:hash",
        "tabler:info-square-rounded",
        "tabler:sun",
        "tabler:loader-2",
        "tabler:menu",
        "tabler:minus",
        "tabler:layout-sidebar-left-collapse",
        "tabler:layout-sidebar-left-expand",
        "tabler:plus",
        "tabler:reload",
        "tabler:search",
        "tabler:player-stop",
        "tabler:star",
        "tabler:square-rounded-check",
        "tabler:device-desktop",
        "tabler:bulb",
        "tabler:upload",
        "tabler:alert-triangle",
      ],
    },
  },
});
