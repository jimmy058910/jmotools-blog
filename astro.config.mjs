// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { remarkReadingTime } from './remark-reading-time.mjs';

export default defineConfig({
  site: 'https://blog.jmotools.com',
  integrations: [mdx(), sitemap()],
  markdown: {
    shikiConfig: { theme: 'night-owl', wrap: true },
    remarkPlugins: [remarkReadingTime],
  },
});
