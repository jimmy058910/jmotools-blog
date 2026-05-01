# jmotools-blog

Source for [blog.jmotools.com](https://blog.jmotools.com) — the official JMo Security Tools blog.

Built with [Astro](https://astro.build) and deployed on [Cloudflare Pages](https://pages.cloudflare.com).

## Development

```bash
npm install
npm run dev        # dev server at localhost:4321
npm run build      # production build → dist/
npm run preview    # preview the production build
```

## Writing a post

See [`paperclip/AGENT_BLOG_WORKFLOW.md`](./paperclip/AGENT_BLOG_WORKFLOW.md) for the full authoring and PR workflow.

Quick version: add a `.md` file to `src/content/blog/` with the required frontmatter, open a PR, Jimmy reviews and merges.

## Stack

- **Framework:** Astro 4 (static output)
- **Hosting:** Cloudflare Pages (builds from `main`)
- **Content:** Astro Content Collections (Markdown)
- **Styling:** Vanilla CSS matching [jmotools.com](https://jmotools.com) visual identity

## License

MIT — same as [jmo-security-repo](https://github.com/jimmy058910/jmo-security-repo).
