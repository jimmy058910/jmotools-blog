# Agent Blog Workflow

How any agent publishes to blog.jmotools.com.

## The Three-Step Loop

```
Write markdown → Open PR → Jimmy reviews → Merge → Auto-deploys
```

Cloudflare Pages builds from `main` automatically. Merge = live in ~1 minute.

---

## Step 1: Write the post

All posts live in `src/content/blog/`. Create a new `.md` file:

```
src/content/blog/your-post-slug.md
```

**Required frontmatter:**

```yaml
---
title: "Your Post Title"
description: "One-sentence summary for SEO and the post listing."
pubDate: 2026-05-15
author: "Jimmy"
tags: ["security", "devsecops"]
draft: true
---
```

Keep `draft: true` until Jimmy approves the PR. The build will not publish it.

**Slug = filename.** `my-post-slug.md` → `https://blog.jmotools.com/blog/my-post-slug`

**Writing conventions:**
- Use `##` and `###` for sections — never `#` inside the post body (the title is `h1`)
- Code blocks: always specify the language (` ```bash `, ` ```yaml `, ` ```python `)
- Internal links: absolute paths (`/blog/other-post`) not relative (`../other-post`)
- No internal Paperclip metadata in published posts — strip `<!-- internal -->` comments

---

## Step 2: Branch and PR

```bash
# Sync with main first
git fetch origin
git checkout main
git pull origin main

# Create your branch
git checkout -b post/your-post-slug

# Stage and commit
git add src/content/blog/your-post-slug.md
git commit -m "Add post: Your Post Title"

# Push and open PR
git push -u origin post/your-post-slug
gh pr create \
  --base main \
  --title "Post: Your Post Title" \
  --body "$(cat <<'BODY'
## Summary
One-sentence description of the post.

## Checklist
- [ ] draft: true in frontmatter
- [ ] pubDate set correctly
- [ ] No internal metadata left in post body
- [ ] Tags accurate

## Paperclip
- Issue: JMOAA-XX
- Agent: <your role>
BODY
)"
```

**Branch naming:** `post/<slug>` for new posts, `fix/<slug>` for corrections.

---

## Step 3: After Jimmy approves and merges

Jimmy merges the PR → Cloudflare Pages auto-builds → live at `blog.jmotools.com/blog/<slug>` within ~60 seconds.

If the post should go live: Jimmy changes `draft: false` before merging, or does it in a follow-up commit.

If cross-posting to dev.to: add `canonicalUrl` pointing to the live blog URL before publishing on dev.to. This prevents duplicate content SEO penalty.

---

## Updating an existing post

Check out a `fix/<slug>` branch, edit the file, PR to main. Same flow.

If you fix a factual error, update `updatedDate` in frontmatter:

```yaml
updatedDate: 2026-06-01
```

---

## Adding Cloudflare Web Analytics

After the Cloudflare Pages project is created, Jimmy will get a beacon token. Add it to `src/components/BaseHead.astro` (the placeholder comment is already there):

```html
<script defer src='https://static.cloudflareinsights.com/beacon.min.js'
  data-cf-beacon='{"token": "YOUR_TOKEN_HERE"}'></script>
```

---

## File structure reference

```
src/
  content/
    blog/           ← all blog posts go here
      config.ts     ← schema definition (do not edit unless adding fields)
  components/
    BaseHead.astro  ← SEO, OG tags, fonts, analytics
    Header.astro    ← site navigation
    Footer.astro    ← copyright, links
  layouts/
    BaseLayout.astro  ← wraps all pages
    BlogPost.astro    ← wraps individual posts
  pages/
    index.astro       ← post listing
    rss.xml.js        ← RSS feed
    404.astro         ← 404 page
    blog/
      [...slug].astro ← dynamic post route
public/
  robots.txt
paperclip/
  AGENT_BLOG_WORKFLOW.md  ← this file
```

---

## DNS cutover (Jimmy only)

When the Cloudflare Pages preview URL is confirmed working:

1. In Cloudflare dashboard → Pages → jmotools-blog → Custom Domains
2. Add `blog.jmotools.com`
3. Cloudflare will show you the CNAME record to add (or configure it automatically if the domain is on Cloudflare DNS)
4. SSL certificate provisions automatically

The blog is on the same Cloudflare account as jmotools.com, so the CNAME update in DNS should propagate immediately.
