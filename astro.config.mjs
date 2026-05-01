import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://blog.jmotools.com',
  output: 'static',
  markdown: {
    shikiConfig: {
      theme: 'one-dark-pro',
      wrap: true,
    },
  },
});
