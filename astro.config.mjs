// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import { remarkReadingTime } from './remark-reading-time.mjs';

export default defineConfig({
  site: 'https://blog.jmotools.com',
  integrations: [mdx(), sitemap()],
  markdown: {
    shikiConfig: { theme: 'night-owl', wrap: true },
    // Astro 7: Sätteri is the default processor and ignores remark plugins; markdown.remarkPlugins is
    // deprecated (only auto-folded into unified() while @astrojs/markdown-remark is installed).
    // .mdx inherits this processor via @astrojs/mdx (extendMarkdownConfig).
    processor: unified({ remarkPlugins: [remarkReadingTime] }),
  },
});
