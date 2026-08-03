import antfu from "@antfu/eslint-config";
// @ts-check
import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt(
  antfu({
    stylistic: {
      indent: 2,
      semi: true,
      quotes: "double",
    },
    formatters: true,
    vue: true,
  }),
);
