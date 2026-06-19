# blog.jmotools.com Astro Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Hashnode-hosted `blog.jmotools.com` with a self-hosted, brand-matched Astro blog deployed on Cloudflare Pages, launching with 3 posts.

**Architecture:** Static Astro site (official `blog` template as the base) using the v5 Content Layer (`glob()` loader + Zod schema). Posts are MDX in `src/content/blog/`. Brand styling is the apex site's CSS custom properties ported verbatim. Output is static `dist/`, deployed to a new Cloudflare Pages project via GitHub Actions; `blog.jmotools.com` DNS is cut over from Hashnode last.

**Tech Stack:** Astro 5+, `@astrojs/mdx`, `@astrojs/rss`, `@astrojs/sitemap`, `@fontsource/inter`, `@fontsource/jetbrains-mono`, `remark-reading-time` (local plugin), Shiki (built-in), Vitest (one unit-tested module), Cloudflare Pages + `wrangler-action`.

## Global Constraints

- **Astro version:** 5.x or newer (Content Layer API: `src/content.config.ts`, `glob()` loader, `render(entry)`, `post.id` as slug). Never use the v4 `src/content/config.ts` / `entry.render()` / `entry.slug` API.
- **Output:** static (`output: 'static'`, the default). No SSR adapter.
- **Site URL:** `https://blog.jmotools.com` (set as `site` in `astro.config.mjs`; required for RSS + sitemap + canonical URLs).
- **Brand tokens:** copied **verbatim** from `C:\Projects\jmotools\styles.css` lines 10–54 (the `:root` block). Primary `#00D9FF`, secondary `#7C3AED`, bg `#0A0E27`, fonts Inter + JetBrains Mono. Do not invent colors.
- **Newsletter endpoint:** `https://api.jmotools.com/api/subscribe`, JSON `{ email, source: 'blog' }`, with honeypot field `website`. Reuse — do not build a backend.
- **Commits:** Conventional Commits (`feat:`, `chore:`, `docs:`, `test:`). **No AI-attribution markers** in commit messages, branches, or PR bodies.
- **Out of scope:** client-side search, comments, Hashnode import tooling, SSR.
- **Posts:** MDX (`.mdx`), not `.md`.

---

### Task 1: Scaffold Astro blog project + config

**Files:**
- Create: the full Astro `blog` template tree under `C:\Projects\jmotools-blog\` (via CLI)
- Modify: `astro.config.mjs`
- Create: `.gitignore` (template provides one — verify it ignores `node_modules`, `dist`, `.astro`)

**Interfaces:**
- Produces: a building Astro project; `npm run build` → `dist/`; `npm run dev` serves locally.

- [ ] **Step 1: Scaffold the template into the existing repo**

The repo already exists (with `docs/`). Scaffold into a temp dir, then move files in (the CLI refuses a non-empty dir).

```bash
cd C:/Projects
npm create astro@latest jmotools-blog-tmp -- --template blog --typescript strict --no-install --no-git
# Move everything except the tmp's .git (there is none) into the real repo:
cp -r jmotools-blog-tmp/* jmotools-blog/
cp jmotools-blog-tmp/.gitignore jmotools-blog/.gitignore
cp -r jmotools-blog-tmp/.vscode jmotools-blog/ 2>/dev/null || true
rm -rf jmotools-blog-tmp
cd jmotools-blog
npm install
```

- [ ] **Step 2: Add MDX + sitemap integrations and config**

Install:
```bash
npm install @astrojs/mdx @astrojs/sitemap @fontsource/inter @fontsource/jetbrains-mono
```

Replace `astro.config.mjs` with:
```js
// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://blog.jmotools.com',
  integrations: [mdx(), sitemap()],
  markdown: {
    shikiConfig: { theme: 'night-owl', wrap: true },
  },
});
```

- [ ] **Step 3: Build to verify the baseline**

Run: `npm run build`
Expected: build succeeds, prints "Complete!" and writes `dist/` (template ships sample posts that build cleanly).

- [ ] **Step 4: Run the type/content check**

Run: `npx astro check`
Expected: `0 errors` (template is clean).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: scaffold Astro blog template with mdx + sitemap"
```

---

### Task 2: Port brand design tokens + fonts + Shiki theme

**Files:**
- Create: `src/styles/global.css`
- Modify: `src/components/BaseHead.astro` (import global.css + fonts) — created by template
- Reference: `C:\Projects\jmotools\styles.css:10-54` (token source)

**Interfaces:**
- Produces: CSS custom properties (`--primary-color`, `--bg-primary`, `--font-primary`, etc.) and base `body` styles available site-wide; Inter + JetBrains Mono loaded.

- [ ] **Step 1: Create `src/styles/global.css`**

Copy the `:root { ... }` block from `C:\Projects\jmotools\styles.css` lines 10–54 **verbatim** as the top of this file, then append base element styles:

```css
/* :root { ... } block copied verbatim from C:\Projects\jmotools\styles.css:10-54 */

*, *::before, *::after { box-sizing: border-box; }
body {
  margin: 0;
  font-family: var(--font-primary);
  background-color: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.6;
}
a { color: var(--primary-color); }
code, pre { font-family: var(--font-mono); }
.container { max-width: var(--container-max); margin: 0 auto; padding: 0 20px; }
```

- [ ] **Step 2: Wire fonts + global.css into `BaseHead.astro`**

At the top of `src/components/BaseHead.astro` frontmatter add:
```js
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/800.css';
import '@fontsource/jetbrains-mono/400.css';
import '../styles/global.css';
```
Remove the template's default `<style is:global>` font/color rules in `src/styles/global.css` (the template ships its own); our token file replaces them.

- [ ] **Step 3: Build to verify styling applies**

Run: `npm run build`
Expected: build succeeds. Then `npm run dev` and confirm in the browser the page background is `#0A0E27`, body text is light, links are cyan `#00D9FF`, and font is Inter. (Visual verification — this task has no unit test; the render is the gate.)

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: port jmotools.com brand tokens and fonts"
```

---

### Task 3: Base layout, BaseHead (SEO/OG), Header, Footer

**Files:**
- Modify: `src/components/BaseHead.astro` (SEO/OG meta)
- Modify: `src/components/Header.astro`, `src/components/Footer.astro` (brand + link back to apex)
- Reference: `src/consts.ts` (template's SITE_TITLE / SITE_DESCRIPTION)

**Interfaces:**
- Consumes: `SITE_TITLE`, `SITE_DESCRIPTION` from `src/consts.ts`.
- Produces: `<BaseHead title description image?>` emitting `<title>`, description, canonical, OG, Twitter tags; `<Header>` and `<Footer>` brand chrome.

- [ ] **Step 1: Set site constants**

In `src/consts.ts`:
```ts
export const SITE_TITLE = 'JMo Security Blog';
export const SITE_DESCRIPTION = 'Security scanning, DevSecOps, and tooling notes from JMo Security.';
```

- [ ] **Step 2: Confirm `BaseHead.astro` emits canonical + OG**

The template's `BaseHead.astro` already emits canonical (`Astro.url`), OG, and Twitter tags. Verify these lines exist; if missing, ensure it includes:
```astro
<link rel="canonical" href={canonicalURL} />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
```
where `const canonicalURL = new URL(Astro.url.pathname, Astro.site);`

- [ ] **Step 3: Brand the Header with a link back to the apex site**

In `src/components/Header.astro`, ensure the nav includes an external link:
```astro
<a href="https://jmotools.com">jmotools.com</a>
```
and that internal links cover `/` and an RSS link to `/rss.xml`.

- [ ] **Step 4: Build + verify**

Run: `npm run build`
Expected: success. `npm run dev` → confirm header shows "JMo Security Blog", a link to jmotools.com, and footer renders. View source on `/`: `<title>` and OG tags present.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: brand BaseHead/Header/Footer with SEO and apex link"
```

---

### Task 4: Content schema + home list page + PostCard

**Files:**
- Modify: `src/content.config.ts` (schema)
- Modify: `src/pages/index.astro` (list)
- Create: `src/components/PostCard.astro`
- Reference: `src/components/FormattedDate.astro` (template-provided)

**Interfaces:**
- Produces: `blog` collection with schema `{ title, description, pubDate, updatedDate?, tags[], heroImage?, draft }`; `<PostCard post={CollectionEntry<'blog'>} />`.
- Consumes: `getCollection('blog')`.

- [ ] **Step 1: Define the schema** (Content Layer / v5)

Replace `src/content.config.ts` with:
```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      tags: z.array(z.string()).default([]),
      heroImage: image().optional(),
      draft: z.boolean().default(false),
    }),
});

export const collections = { blog };
```

- [ ] **Step 2: Verify the schema rejects bad frontmatter (build-as-test)**

Temporarily edit a template sample post in `src/content/blog/` to set `pubDate: not-a-date`.
Run: `npx astro check`
Expected: FAIL with a Zod error on `pubDate`. Then revert the edit and re-run — expected `0 errors`. (This proves the schema is the validation gate; no separate unit test needed.)

- [ ] **Step 3: Create `PostCard.astro`**

```astro
---
import type { CollectionEntry } from 'astro:content';
import FormattedDate from './FormattedDate.astro';
interface Props { post: CollectionEntry<'blog'>; }
const { post } = Astro.props;
---
<article class="post-card">
  <a href={`/blog/${post.id}/`}>
    <h2>{post.data.title}</h2>
  </a>
  <p class="meta"><FormattedDate date={post.data.pubDate} /></p>
  <p>{post.data.description}</p>
  <ul class="tags">{post.data.tags.map((t) => <li><a href={`/tags/${t}/`}>#{t}</a></li>)}</ul>
</article>
<style>
  .post-card { border: 1px solid var(--border-color); background: var(--bg-card); border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
  .post-card h2 { color: var(--primary-color); margin: 0 0 .25rem; }
  .meta { color: var(--text-muted); font-size: .875rem; }
  .tags { display: flex; gap: .5rem; list-style: none; padding: 0; flex-wrap: wrap; }
  .tags a { color: var(--accent-purple); font-family: var(--font-mono); font-size: .8rem; }
</style>
```

- [ ] **Step 4: Render the list on `index.astro`**

In `src/pages/index.astro`, replace the post-list body with:
```astro
---
import { getCollection } from 'astro:content';
import PostCard from '../components/PostCard.astro';
// ...existing BaseHead/Header/Footer imports from template...
const posts = (await getCollection('blog'))
  .filter((p) => !p.data.draft)
  .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
---
<section class="container">
  {posts.map((post) => <PostCard post={post} />)}
</section>
```

- [ ] **Step 5: Build + verify**

Run: `npm run build`
Expected: success; `/` lists the template's sample posts as cards with cyan titles + purple tags.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: content schema, home list, PostCard"
```

---

### Task 5: Post page (`[...slug]`) + prose styling

**Files:**
- Modify: `src/pages/blog/[...slug].astro`
- Modify: `src/layouts/BlogPost.astro`

**Interfaces:**
- Consumes: `getCollection('blog')`, `render(post)` → `{ Content, headings, remarkPluginFrontmatter }`.
- Produces: rendered post pages at `/blog/<id>/`; `BlogPost` layout accepting `title, description, pubDate, updatedDate?, headings, readingTime?`.

- [ ] **Step 1: Static paths + render in `[...slug].astro`**

```astro
---
import { getCollection, render } from 'astro:content';
import BlogPost from '../../layouts/BlogPost.astro';

export async function getStaticPaths() {
  const posts = (await getCollection('blog')).filter((p) => !p.data.draft);
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
}

const { post } = Astro.props;
const { Content, headings, remarkPluginFrontmatter } = await render(post);
---
<BlogPost {...post.data} headings={headings} readingTime={remarkPluginFrontmatter?.minutesRead}>
  <Content />
</BlogPost>
```

- [ ] **Step 2: Prose + token styling in `BlogPost.astro`**

Ensure `BlogPost.astro` accepts the props above and wraps `<slot />` in an `<article class="prose">`. Add scoped styles using tokens:
```astro
<style>
  .prose { max-width: 760px; margin: 0 auto; padding: 2rem 20px; }
  .prose :global(h2), .prose :global(h3) { color: var(--text-primary); }
  .prose :global(pre) { background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; padding: 1rem; overflow-x: auto; }
  .prose :global(code) { font-family: var(--font-mono); }
  .prose :global(a) { color: var(--primary-color); }
</style>
```

- [ ] **Step 3: Build + verify**

Run: `npm run build`
Expected: success; visiting a sample post shows styled prose; fenced code blocks render with the `night-owl` Shiki theme on the dark card background.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: post page rendering with prose + Shiki styling"
```

---

### Task 6: Tag pages (`/tags/[tag]`)

**Files:**
- Create: `src/pages/tags/[tag].astro`

**Interfaces:**
- Consumes: `getCollection('blog')`, `PostCard`.
- Produces: `/tags/<tag>/` pages listing matching posts.

- [ ] **Step 1: Create the tag route**

```astro
---
import { getCollection } from 'astro:content';
import BaseHead from '../../components/BaseHead.astro';
import Header from '../../components/Header.astro';
import Footer from '../../components/Footer.astro';
import PostCard from '../../components/PostCard.astro';

export async function getStaticPaths() {
  const posts = (await getCollection('blog')).filter((p) => !p.data.draft);
  const tags = [...new Set(posts.flatMap((p) => p.data.tags))];
  return tags.map((tag) => ({
    params: { tag },
    props: { posts: posts.filter((p) => p.data.tags.includes(tag)) },
  }));
}
const { tag } = Astro.params;
const { posts } = Astro.props;
---
<html lang="en">
  <head><BaseHead title={`#${tag}`} description={`Posts tagged ${tag}`} /></head>
  <body>
    <Header />
    <main class="container">
      <h1>Posts tagged <span style="color: var(--accent-purple)">#{tag}</span></h1>
      {posts.map((post) => <PostCard post={post} />)}
    </main>
    <Footer />
  </body>
</html>
```

- [ ] **Step 2: Build + verify**

Run: `npm run build`
Expected: success; for any tag present in a sample post, `/tags/<tag>/` lists it. (If the template samples have no tags, add a `tags: ['demo']` to one sample first, then verify, then leave it — it'll be removed when sample posts are deleted in Task 10.)

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: tag index pages"
```

---

### Task 7: RSS feed + sitemap

**Files:**
- Create: `src/pages/rss.xml.js`
- Reference: `astro.config.mjs` (sitemap already added in Task 1)

**Interfaces:**
- Produces: `/rss.xml`, `/sitemap-index.xml`.

- [ ] **Step 1: Install + create the RSS endpoint**

```bash
npm install @astrojs/rss
```

`src/pages/rss.xml.js`:
```js
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';

export async function GET(context) {
  const posts = (await getCollection('blog')).filter((p) => !p.data.draft);
  return rss({
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    site: context.site,
    items: posts
      .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
      .map((post) => ({
        title: post.data.title,
        pubDate: post.data.pubDate,
        description: post.data.description,
        link: `/blog/${post.id}/`,
      })),
  });
}
```

- [ ] **Step 2: Build + verify feed + sitemap exist**

Run: `npm run build`
Then: `ls dist/rss.xml dist/sitemap-index.xml`
Expected: both files exist. `cat dist/rss.xml` shows `<rss version="2.0">` with `<item>` entries for each post.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: RSS feed and sitemap"
```

---

### Task 8: Reading time + Table of Contents

**Files:**
- Create: `remark-reading-time.mjs` (repo root)
- Modify: `astro.config.mjs` (register remark plugin)
- Create: `src/components/TableOfContents.astro`
- Modify: `src/layouts/BlogPost.astro` (render TOC + reading time)

**Interfaces:**
- Produces: `remarkPluginFrontmatter.minutesRead` on every post; `<TableOfContents headings={MarkdownHeading[]} />`.
- Consumes: `headings` and `readingTime` props passed by `[...slug].astro` (Task 5).

- [ ] **Step 1: Add the reading-time remark plugin**

Install the helper:
```bash
npm install reading-time mdast-util-to-string
```
`remark-reading-time.mjs`:
```js
import getReadingTime from 'reading-time';
import { toString } from 'mdast-util-to-string';

export function remarkReadingTime() {
  return function (tree, { data }) {
    const textOnPage = toString(tree);
    const readingTime = getReadingTime(textOnPage);
    data.astro.frontmatter.minutesRead = readingTime.text; // e.g. "6 min read"
  };
}
```
Register it in `astro.config.mjs`:
```js
import { remarkReadingTime } from './remark-reading-time.mjs';
// inside defineConfig:
markdown: {
  shikiConfig: { theme: 'night-owl', wrap: true },
  remarkPlugins: [remarkReadingTime],
},
```

- [ ] **Step 2: Create `TableOfContents.astro`**

```astro
---
import type { MarkdownHeading } from 'astro';
interface Props { headings: MarkdownHeading[]; }
const { headings } = Astro.props;
const toc = headings.filter((h) => h.depth === 2 || h.depth === 3);
---
{toc.length > 0 && (
  <nav class="toc" aria-label="Table of contents">
    <p class="toc-title">On this page</p>
    <ul>
      {toc.map((h) => (
        <li class={`depth-${h.depth}`}><a href={`#${h.slug}`}>{h.text}</a></li>
      ))}
    </ul>
  </nav>
)}
<style>
  .toc { border-left: 2px solid var(--border-color); padding-left: 1rem; margin: 1.5rem 0; }
  .toc-title { color: var(--text-muted); text-transform: uppercase; font-size: .75rem; letter-spacing: .05em; }
  .toc ul { list-style: none; padding: 0; }
  .toc .depth-3 { padding-left: 1rem; }
  .toc a { color: var(--text-secondary); text-decoration: none; }
  .toc a:hover { color: var(--primary-color); }
</style>
```

- [ ] **Step 3: Render reading time + TOC in `BlogPost.astro`**

In `BlogPost.astro` frontmatter add `TableOfContents` import and accept `headings` + `readingTime` props. In the markup, above `<slot />`:
```astro
<p class="reading-time">{readingTime}</p>
<TableOfContents headings={headings} />
```

- [ ] **Step 4: Build + verify**

Run: `npm run build`
Expected: success; a sample post page shows "N min read" and a TOC listing its `##`/`###` headings, each linking to the heading anchor.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: reading time and table of contents"
```

---

### Task 9: Newsletter component (unit-tested logic)

**Files:**
- Create: `src/lib/subscribe.ts`
- Create: `src/lib/subscribe.test.ts`
- Create: `src/components/Newsletter.astro`
- Modify: `package.json` (Vitest), `src/layouts/BlogPost.astro` (include `<Newsletter />`)

**Interfaces:**
- Produces: `validateEmail(s): boolean`, `isHoneypotTripped(s): boolean`, `buildPayload(email): { email, source }`, and `<Newsletter />`.

- [ ] **Step 1: Add Vitest**

```bash
npm install -D vitest
```
Add to `package.json` scripts: `"test": "vitest run"`.

- [ ] **Step 2: Write the failing test**

`src/lib/subscribe.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { validateEmail, isHoneypotTripped, buildPayload } from './subscribe';

describe('subscribe helpers', () => {
  it('accepts a valid email', () => { expect(validateEmail('a@b.com')).toBe(true); });
  it('rejects malformed emails', () => {
    expect(validateEmail('nope')).toBe(false);
    expect(validateEmail('a@b')).toBe(false);
    expect(validateEmail(' ')).toBe(false);
  });
  it('flags a filled honeypot', () => {
    expect(isHoneypotTripped('bot')).toBe(true);
    expect(isHoneypotTripped('')).toBe(false);
  });
  it('builds the payload with source=blog and trims', () => {
    expect(buildPayload('  a@b.com ')).toEqual({ email: 'a@b.com', source: 'blog' });
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module './subscribe'`.

- [ ] **Step 4: Implement `src/lib/subscribe.ts`**

```ts
export interface SubscribePayload { email: string; source: string; }
export function validateEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
}
export function isHoneypotTripped(value: string): boolean {
  return value.trim().length > 0;
}
export function buildPayload(email: string): SubscribePayload {
  return { email: email.trim(), source: 'blog' };
}
export const SUBSCRIBE_ENDPOINT = 'https://api.jmotools.com/api/subscribe';
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test`
Expected: PASS (4 tests).

- [ ] **Step 6: Build the `Newsletter.astro` component**

```astro
---
// styling + markup; logic imported in the client script
---
<form id="nl-form" class="newsletter">
  <label for="nl-email" class="sr-only">Email</label>
  <input id="nl-email" name="email" type="email" placeholder="your@email.com" required />
  <input type="text" name="website" id="nl-hp" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px" />
  <button type="submit" id="nl-btn">Subscribe</button>
  <p id="nl-ok" hidden>Subscribed — check your inbox.</p>
</form>
<style>
  .newsletter { display: flex; gap: .5rem; flex-wrap: wrap; border: 1px solid var(--border-color); background: var(--bg-card); border-radius: 12px; padding: 1.5rem; margin: 2rem auto; max-width: 760px; }
  .newsletter input[type="email"] { flex: 1 1 240px; padding: .75rem; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-primary); }
  .newsletter button { padding: .75rem 1.5rem; background: var(--primary-color); color: var(--bg-primary); border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
  .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
</style>
<script>
  import { validateEmail, isHoneypotTripped, buildPayload, SUBSCRIBE_ENDPOINT } from '../lib/subscribe';
  const form = document.getElementById('nl-form');
  const ok = document.getElementById('nl-ok');
  const btn = document.getElementById('nl-btn');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = (document.getElementById('nl-email') as HTMLInputElement).value;
    const hp = (document.getElementById('nl-hp') as HTMLInputElement).value;
    if (isHoneypotTripped(hp)) return;
    if (!validateEmail(email)) return;
    btn?.setAttribute('disabled', 'true');
    try {
      await fetch(SUBSCRIBE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(email)),
      });
    } catch { /* graceful: show success regardless, matching apex behavior */ }
    form?.setAttribute('hidden', 'true');
    ok?.removeAttribute('hidden');
  });
</script>
```

- [ ] **Step 7: Include `<Newsletter />` in `BlogPost.astro`** (below `<slot />`), import at top.

- [ ] **Step 8: Build + test + verify**

Run: `npm test && npm run build`
Expected: tests PASS, build succeeds. `npm run dev` → newsletter renders on a post; submitting a valid email shows the success message.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: newsletter component with unit-tested submit logic"
```

---

### Task 10: Author the 3 launch posts + remove samples

**Files:**
- Delete: template sample posts in `src/content/blog/`
- Create: `src/content/blog/why-i-built-a-free-security-scanner.mdx`
- Create: `src/content/blog/kubernetes-style-scan-scheduling.mdx`
- Create: `src/content/blog/dedup-methodology.mdx`
- Reference: `C:\Projects\jmo-security-repo\paperclip\content\dedup_methodology_note.md`; live Hashnode posts at `https://blog.jmotools.com/...`

**Interfaces:**
- Produces: exactly 3 published posts; `/`, tag pages, and RSS reflect them.

- [ ] **Step 1: Remove the template's sample posts**

```bash
rm src/content/blog/*.md src/content/blog/*.mdx
```
(plus any sample images under `src/content/blog/` if present.)

- [ ] **Step 2: Author the dedup methodology post**

Create `src/content/blog/dedup-methodology.mdx` with frontmatter, then port the body from `C:\Projects\jmo-security-repo\paperclip\content\dedup_methodology_note.md` (CEO-approved) as MDX:
```mdx
---
title: 'Cross-Tool Deduplication: How JMo Security Cuts Scanner Noise 30-40%'
description: 'The methodology behind JMo Security’s cross-tool finding deduplication and why it matters for signal-to-noise.'
pubDate: 2026-06-18
tags: ['deduplication', 'methodology', 'devsecops']
---

<!-- Body ported from dedup_methodology_note.md, converted to MDX. Verify all code fences and tables render. -->
```

- [ ] **Step 3: Port the two Hashnode posts**

Pull each from the live Hashnode page and convert to MDX, preserving original `pubDate`:
- `why-i-built-a-free-security-scanner.mdx` → `pubDate: 2025-10-24`, tags e.g. `['origin', 'open-source']`.
- `kubernetes-style-scan-scheduling.mdx` → `pubDate: 2025-10-30`, tags e.g. `['scheduling', 'ci-cd']`.

For each: copy the rendered article text, re-author headings as `##`/`###` (so TOC works), re-fence code blocks, set `title`/`description` from the originals.

- [ ] **Step 4: Build + verify all three**

Run: `npm run build`
Expected: success with exactly 3 routes under `/blog/`. `npm run dev` → `/` shows 3 cards newest-first (dedup, then 2025 posts); each post shows reading time + TOC; tag pages and `/rss.xml` list all three.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: launch content — dedup post + 2 ported Hashnode posts"
```

---

### Task 11: Cloudflare Pages deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Produces: a GitHub Actions workflow that builds and deploys `dist/` to the `jmotools-blog` Pages project on push to `main`.

- [ ] **Step 1: Create the workflow** (mirrors the apex pattern, adapted for a build step)

```yaml
name: Deploy to Cloudflare Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy dist --project-name=jmotools-blog --branch=main
```

- [ ] **Step 2: Validate the workflow YAML locally**

Run (if `actionlint` available): `actionlint .github/workflows/deploy.yml` — Expected: no errors. Otherwise verify indentation by eye; the deploy itself is exercised in Task 12.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "ci: Cloudflare Pages deploy workflow"
```

---

### Task 12: Deploy, verify, DNS cutover (outward — confirm each)

**Files:** none (infra actions)

> These steps create remote resources and change live DNS. Each is confirmed with Jimmy at execution time, not run unattended.

- [ ] **Step 1: Create GitHub remote + push** (confirm first)

```bash
gh repo create jmotools-blog --private --source=. --remote=origin --push
```

- [ ] **Step 2: Create the Cloudflare Pages project + secrets**

Create Pages project `jmotools-blog` (Cloudflare dashboard or `wrangler pages project create jmotools-blog`). Add repo secrets `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` (`gh secret set ...`). Trigger the workflow (`gh workflow run deploy.yml` or push).

- [ ] **Step 3: Verify on `*.pages.dev`** (before any DNS change)

On `https://jmotools-blog.pages.dev`: 3 posts render, code highlighted, TOC + reading time present, `/rss.xml` + `/sitemap-index.xml` valid, newsletter submits OK, brand parity with jmotools.com. Run Lighthouse — target ≥90 perf/a11y/SEO. Fix any issues before proceeding.

- [ ] **Step 4: DNS cutover** (confirm — this is the go-live)

In Cloudflare: add custom domain `blog.jmotools.com` to the `jmotools-blog` Pages project; repoint the `blog` CNAME from Hashnode to the Pages target. Confirm `https://blog.jmotools.com` serves the new site with valid TLS. Hashnode content is left intact (just no longer linked).

- [ ] **Step 5: Close the loop**

The dedup post now has a stable URL → update JMOAA-28 / the showcase outreach packages to link it (separate follow-up in jmo-security). Optionally update the apex site's blog badge wording.

---

## Self-Review

**Spec coverage** (spec §→task):
- §3 repo/hosting/CI → Tasks 1, 11, 12. §4 content model → Task 4. §5 design system → Task 2. §6 pages/components → Tasks 3–7. §7 features → RSS/sitemap (7), tags (6), Shiki (2/5), SEO/OG (3), newsletter (9), TOC+reading-time (8). §8 newsletter → Task 9. §9 launch content → Task 10. §10 deploy/cutover → Tasks 11–12. §11 verification → Tasks 4 (schema), 7 (feed), 12 (Lighthouse/cutover). All covered.
- §13 TBDs: analytics → deferred (noted, not a task; add in Task 12 if confirmed); old-URL redirects → deferred (default none); GitHub remote/Pages creation → Task 12 (confirmed); subscribe API contract → exercised in Task 9 step 8 + Task 12 step 3.

**Placeholder scan:** No "TBD/TODO" in task steps. The one prose-port (Task 10 step 2/3) references the exact source files to port from rather than inventing content — appropriate, since the content is authored, not generated.

**Type consistency:** `getCollection('blog')`, `render(post)` → `{ Content, headings, remarkPluginFrontmatter }`, `params: { slug: post.id }`, link `/blog/${post.id}/`, and `BlogPost` props (`title, description, pubDate, headings, readingTime`) are consistent across Tasks 4/5/7/8. `subscribe.ts` exports (`validateEmail`, `isHoneypotTripped`, `buildPayload`, `SUBSCRIBE_ENDPOINT`) match between Task 9 test and component.

---

## Notes on test strategy

For a static content site, `astro build` + `astro check` are the primary gates: the Zod content schema (Task 4) rejects bad frontmatter at build, and route/link/feed generation fails the build if references break. Genuine branching logic (the newsletter handler) is unit-tested with Vitest (Task 9). UI/brand correctness is verified by render + Lighthouse (Tasks 2, 3, 12). This matches the domain rather than bolting unit tests onto presentational components.
