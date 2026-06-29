export default defineNuxtConfig({
  // Get all the pages, components, composables and plugins from the parent theme
  extends: ['./woonuxt_base'],

  components: [{ path: './components', pathPrefix: false }],

  i18n: {
    locales: [
      { code: 'en', language: 'en-US', file: 'en-US.json', name: 'English', dir: 'ltr' },
      { code: 'zh', language: 'zh-CN', file: 'zh-CN.json', name: 'Chinese', dir: 'ltr' },
      { code: 'es', language: 'es-ES', file: 'es-ES.json', name: 'Spanish', dir: 'ltr' },
      { code: 'ar', language: 'ar', file: 'ar.json', name: 'Arabic', dir: 'rtl' },
    ],
    langDir: 'locales',
    defaultLocale: 'en',
    strategy: 'no_prefix',
  },

  /**
   * Depending on your servers capabilities, you may need to adjust the following settings.
   * It will affect the build time but also increase the reliability of the build process.
   * If you have a server with a lot of memory and CPU, you can remove the following settings.
   * @property {number} concurrency - How many pages to prerender at once
   * @property {number} interval - How long to wait between prerendering pages
   * @property {boolean} failOnError - This stops the build from failing but the page will not be statically generated
   */
  nitro: {
    prerender: {
      concurrency: 10,
      interval: 1000,
      failOnError: false,
    },
    routeRules: {
      // Cookie-based locale selection with no_prefix routing must stay dynamic,
      // otherwise one locale's cached HTML can leak into other locales.
      '/product/**': { prerender: false },
      '/product-category/**': { prerender: false },
      '/products': { prerender: false },
      '/products/**': { prerender: false },
    },
  },
});
