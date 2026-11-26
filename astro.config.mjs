// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import { remarkReadingTime } from './remark-reading-time.mjs';

export default defineConfig({
  site: 'https://blog.jmotools.com',
  // Astro 7 defaults this to 'jsx', which strips whitespace between inline elements by JSX
  // rules and changes rendered copy. This upgrade is a security fix, so the Astro 6 behaviour
  // is pinned. Changing it is a separate, deliberate decision.
  compressHTML: true,
  // Vite 8 moved its default browser target from Safari 16 to 16.4, so Lightning CSS emits
  // range media queries (width<=720px) that Safari below 16.4 ignores, dropping the site's
  // breakpoints. This is Vite 7's own default list, restoring the targets the site already
  // shipped. Vite changes this default on each major release, so recheck it on upgrade.
  // Same pin, with the measured reasoning, as four-wheels' astro.config.mjs (FW-01).
  vite: { build: { cssTarget: ['chrome107', 'edge107', 'firefox104', 'safari16'] } },
  integrations: [mdx(), sitemap()],
  markdown: {
    shikiConfig: { theme: 'night-owl', wrap: true },
    // Astro 7: Sätteri is the default processor and ignores remark plugins; markdown.remarkPlugins is
    // deprecated (only auto-folded into unified() while @astrojs/markdown-remark is installed).
    // .mdx inherits this processor via @astrojs/mdx (extendMarkdownConfig).
    processor: unified({ remarkPlugins: [remarkReadingTime] }),
  },
});
