import { defineNuxtConfig } from "nuxt/config";
import { fileURLToPath } from "node:url";

const cssFiles = [
  fileURLToPath(new URL("./assets/css/tailwind.css", import.meta.url)),
  fileURLToPath(new URL("./assets/css/globals.css", import.meta.url)),
];

export default defineNuxtConfig({
  modules: ["@pinia/nuxt", "@nuxtjs/tailwindcss", "@nuxtjs/supabase", "@nuxtjs/i18n"],
  css: cssFiles,
  devtools: { enabled: true },
  compatibilityDate: "2025-09-15",

  supabase: {
    redirectOptions: {
      login: "/login",
      callback: "/confirm",
      exclude: ["/", "/register"],
    },
  },

  i18n: {
    locales: [
      { code: "tr", name: "Türkçe", file: "tr.json", dir: "ltr" },
      { code: "en", name: "English", file: "en.json", dir: "ltr" },
      { code: "ar", name: "العربية", file: "ar.json", dir: "rtl" },
    ],
    defaultLocale: "tr",
    lazy: true,
    langDir: "locales",
    strategy: "no_prefix",
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: "i18n_redirected",
      fallbackLocale: "tr",
      alwaysRedirect: false,
      redirectOn: "root",
    },
  },
});
