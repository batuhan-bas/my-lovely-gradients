import vueConfig from "./eslint/vue.js";

export default [
  {
    ignores: [".nuxt/**", ".output/**", "dist/**", "node_modules/**"],
  },
  ...vueConfig,
];
