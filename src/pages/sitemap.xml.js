import { getCollection } from 'astro:content';

export async function GET() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const site = 'https://blog.jmotools.com';

  const staticUrls = [
    { loc: `${site}/`, priority: '1.0', changefreq: 'weekly' },
    { loc: `${site}/rss.xml`, priority: '0.3', changefreq: 'weekly' },
  ];

  const postUrls = posts
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
    .map((post) => ({
      loc: `${site}/blog/${post.slug}/`,
      lastmod: (post.data.updatedDate ?? post.data.pubDate).toISOString().split('T')[0],
      priority: '0.8',
      changefreq: 'monthly',
    }));

  const allUrls = [...staticUrls, ...postUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map((u) => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
