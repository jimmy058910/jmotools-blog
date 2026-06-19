# blog.jmotools.com — Self-Hosted Astro Migration (JMOAA-44)

**Date:** 2026-06-18
**Status:** Design approved; pending written-spec review → implementation plan
**Author:** JMoGaming LLC
**Related:** JMOAA-44 (this migration), JMOAA-28 (dedup methodology post — unblocks on launch), JMOAA-78/JMOAA-82 + showcase outreach (downstream of JMOAA-28)

---

## 1. Goal & context

`blog.jmotools.com` currently runs on **Hashnode** (the apex `jmotools.com` static site links to it with a "blog-Hashnode" badge). This project replaces it with a **self-hosted Astro blog**, deployed on Cloudflare Pages — giving full control of design, content, and URLs, and bringing the blog in-house alongside the rest of the stack.

This is the root blocker for the JMo Security showcase-outreach pipeline: the **dedup methodology post (JMOAA-28)** is drafted and CEO-approved but "pending JMOAA-44." Launching the new blog with that post live closes JMOAA-28 and unblocks the 8–9 outreach sends gated behind it.

**Decision (scope):** *Fresh start.* Build a new Astro blog from scratch; do not build Hashnode import tooling. The existing Hashnode content (2 posts) is hand-ported as Markdown/MDX. After cutover, the Hashnode blog is left as a dormant archive (subdomain simply stops pointing at it).

## 2. Scope

**In scope (v1):**
- New Astro project (official `blog` template), brand-matched to `jmotools.com`.
- Content as MDX in Astro content collections.
- Table-stakes: RSS, sitemap, tags + tag pages, code syntax highlighting (Shiki), SEO/OpenGraph + canonical, responsive dark theme.
- Optional features chosen: **newsletter signup** (reuse existing API) and **table-of-contents + reading-time** on posts.
- Launch with **3 posts**: the dedup methodology flagship + both existing Hashnode posts (re-authored as MDX).
- Deploy to a new Cloudflare Pages project; DNS cutover of `blog.jmotools.com`.

**Out of scope (v1):**
- Client-side search, comments.
- Automated Hashnode import/migration tooling.
- Redirect maps for old Hashnode URLs (fresh start; revisit only if a ported post needs its old URL preserved — see §13).
- Any change to the apex `jmotools.com` repo beyond, optionally, updating the blog badge/links post-cutover.

## 3. Architecture & repository

- **New separate repo:** `C:\Projects\jmotools-blog` → GitHub `jmotools-blog`. Kept apart from the apex `jmotools` (static HTML) repo and from `jmo-security-repo` — independent build system, deploy, and versioning.
- **Framework:** Astro, official `blog` template; static output to `dist/`.
- **Hosting:** new **Cloudflare Pages** project `jmotools-blog`.
- **CI/CD:** `.github/workflows/deploy.yml` reusing the apex site's proven pattern (`cloudflare/wrangler-action@v3`), adapted for a build step:
  - `npm ci && npm run build`
  - `pages deploy dist --project-name=jmotools-blog --branch=main`
  - Secrets reused: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

## 4. Content model

Posts are **MDX** in `src/content/blog/`, validated by a Zod schema in `src/content.config.ts`:

| Field | Type | Notes |
|---|---|---|
| `title` | string | required |
| `description` | string | required; used for meta + cards |
| `pubDate` | date | required |
| `updatedDate` | date | optional |
| `tags` | string[] | optional; drives `/tags/[tag]` |
| `heroImage` | image | optional |
| `draft` | boolean | optional; excluded from build/feeds when true |

MDX (not plain MD) so technical posts can use callouts, tables, and components.

## 5. Design system (brand port)

- `src/styles/global.css` copies the apex site's `:root` token set **verbatim** (`styles.css:10-54`): `--primary-color:#00D9FF`, `--secondary-color:#7C3AED`, dark backgrounds (`#0A0E27`/`#141933`/`#1A1F3A`), text (`#F8FAFC`/`#CBD5E1`/`#94A3B8`), borders/shadows/glows, spacing, transitions.
- Fonts self-hosted via `@fontsource`: **Inter** (body) + **JetBrains Mono** (code) — already the brand's fonts.
- Shiki configured to a dark theme tuned to the palette for code blocks.
- Astro scoped component styles built on the shared tokens.

## 6. Pages & components

**Pages**
- `/` — post list (newest first), with PostCards.
- `/blog/[...slug]` — individual post.
- `/tags/[tag]` — posts for a tag.
- `404`.
- `/rss.xml` (`@astrojs/rss`), sitemap (`@astrojs/sitemap`).

**Components**
- `BaseHead` — title/description, canonical, OpenGraph + Twitter card, favicon (reuse apex assets).
- `Header` — blog title + nav, including a link back to `jmotools.com`.
- `Footer` — copyright, links (privacy, jmotools.com, Ko-Fi to match apex).
- `PostCard` — list item (title, date, reading time, tags, description).
- `FormattedDate`, `ReadingTime`, `TableOfContents` (from post headings).
- `Newsletter` — see §8.

## 7. Feature mapping

| Feature | Mechanism |
|---|---|
| RSS | `@astrojs/rss` → `/rss.xml` |
| Sitemap | `@astrojs/sitemap` |
| Tags + tag pages | collection `tags[]` + `/tags/[tag].astro` |
| Syntax highlighting | Shiki (Astro built-in), dark theme |
| SEO / OG / canonical | `BaseHead` component |
| Responsive dark theme | brand token port (§5) |
| **Newsletter** | reuse `api.jmotools.com/api/subscribe` (§8) |
| **TOC + reading time** | remark plugins / heading extraction + `reading-time` |
| ~~Search~~, ~~comments~~ | out of scope (v1) |

## 8. Newsletter integration

Reuse the apex site's existing, working flow (`subscribe.html:260`) — no new backend:
- Client-side `fetch` POST to **`https://api.jmotools.com/api/subscribe`**, JSON body `{ email, source: 'blog' }`.
- Include the **honeypot** field (`website`) for bot rejection, mirroring the apex form.
- `localStorage` "already subscribed" short-circuit + graceful error fallback, as in the apex implementation.
- Retinted to the dark brand (the apex subscribe page uses a different light gradient; the blog component uses brand tokens).

## 9. Launch content (3 posts)

1. **Dedup methodology post** — adapted from `jmo-security-repo/paperclip/content/dedup_methodology_note.md` (CEO-approved). Re-authored as MDX with frontmatter. Flagship; its stable URL closes **JMOAA-28**.
2. **"Why I Built a Free Security Scanner That Makes Sense"** — ported from Hashnode (orig. 2025-10-24).
3. **"Kubernetes-Style Scan Scheduling: Built Enterprise CI/CD Integration for JMo Security"** — ported from Hashnode (orig. 2025-10-30).

Ported posts are pulled from the live Hashnode pages and converted to MDX; original `pubDate`s preserved.

## 10. Deploy & DNS cutover (low-risk sequence)

1. Build locally (`npm run build`), verify `dist/`.
2. Deploy to `jmotools-blog.pages.dev` (Pages project created; GH Actions wired).
3. Verify on `*.pages.dev` (see §11).
4. In Cloudflare DNS, repoint `blog.jmotools.com` from the Hashnode CNAME to the Pages custom domain; add the custom domain in the Pages project.
5. Confirm `https://blog.jmotools.com` serves the new site with valid TLS.
6. (Optional, post-cutover) update the apex site's blog badge/link if any wording changes.

Hashnode content is **not deleted** — the subdomain just stops resolving to it.

## 11. Verification / acceptance criteria

- `astro build` and `astro check` pass clean (content schema valid, no TS errors).
- All 3 posts render; code blocks highlight; TOC + reading time present on each.
- RSS (`/rss.xml`) and sitemap validate; tag pages resolve.
- SEO: each page has title/description/canonical/OG; social preview renders.
- Newsletter form submits successfully to the API (test subscribe) and handles errors gracefully.
- Lighthouse on the `.pages.dev` preview: performance/accessibility/SEO in good range (target ≥90 each).
- Visual brand parity with `jmotools.com` (palette, fonts, dark theme).
- DNS cutover verified: `blog.jmotools.com` serves the new site over HTTPS.

## 12. Implementation sequencing

1. Scaffold Astro `blog` template in `C:\Projects\jmotools-blog`.
2. Port brand tokens + fonts; build `BaseHead`/`Header`/`Footer`/layout.
3. Content schema + list/post/tag pages; RSS + sitemap.
4. `Newsletter`, `TableOfContents`, `ReadingTime`.
5. Author/port the 3 launch posts (MDX).
6. CI deploy workflow; deploy to `*.pages.dev`.
7. Verify (§11) → DNS cutover → confirm live.

## 13. Open items / TBDs (resolve during implementation)

- **Analytics:** confirm whether the apex uses analytics worth mirroring (e.g., Cloudflare Web Analytics). Add if so; otherwise skip for v1.
- **Old Hashnode URLs:** decide whether either ported post needs its original Hashnode slug preserved via a redirect (default: no — fresh start). If yes, add Cloudflare redirect rules.
- **GitHub remote + Pages project creation:** outward actions — performed with explicit confirmation during implementation (not part of design).
- **Newsletter `source` value / API contract:** confirm `api.jmotools.com/api/subscribe` is still live and accepts `source: 'blog'`.

## 14. Future (not now)

Client-side search (Pagefind) and comments (Giscus) once post volume justifies them; per-post dynamic OG images; bulk Hashnode import if more historical posts are ever wanted.
