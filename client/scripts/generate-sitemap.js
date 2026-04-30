import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = 'https://frioo.in';
const TODAY = new Date().toISOString().split('T')[0];

const STATIC_PAGES = [
  { path: '/',                     changefreq: 'daily',   priority: '1.0'  },
  { path: '/shop',                 changefreq: 'daily',   priority: '0.95' },
  { path: '/shop?category=fruits', changefreq: 'daily',   priority: '0.95' },
  { path: '/shop?category=juices', changefreq: 'daily',   priority: '0.90' },
  { path: '/shop?category=shakes', changefreq: 'daily',   priority: '0.90' },
  { path: '/shop?category=salads', changefreq: 'daily',   priority: '0.90' },
  { path: '/shop?category=deals',  changefreq: 'daily',   priority: '0.85' },
  { path: '/stores',               changefreq: 'monthly', priority: '0.75' },
  { path: '/about',                changefreq: 'monthly', priority: '0.70' },
  { path: '/contact',              changefreq: 'monthly', priority: '0.65' },
  { path: '/faq',                  changefreq: 'monthly', priority: '0.55' },
  { path: '/shipping',             changefreq: 'monthly', priority: '0.40' },
  { path: '/returns',              changefreq: 'monthly', priority: '0.40' },
  { path: '/privacy',              changefreq: 'yearly',  priority: '0.30' },
  { path: '/terms',                changefreq: 'yearly',  priority: '0.30' },
];

const urlEntry = (loc, lastmod, changefreq, priority) =>
  `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;

async function generate() {
  const entries = STATIC_PAGES.map(p =>
    urlEntry(`${BASE_URL}${p.path}`, TODAY, p.changefreq, p.priority)
  );

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: products, error } = await supabase
      .from('products')
      .select('id, created_at');

    if (error) {
      console.warn('Could not fetch products:', error.message);
    } else if (products?.length) {
      products.forEach(p => {
        const lastmod = p.created_at ? p.created_at.split('T')[0] : TODAY;
        entries.push(urlEntry(`${BASE_URL}/product/${p.id}`, lastmod, 'weekly', '0.80'));
      });
      console.log(`Added ${products.length} product URLs to sitemap`);
    }
  } else {
    console.warn('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set — product URLs skipped');
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries.join('\n') +
    `\n</urlset>\n`;

  const outPath = join(__dirname, '../public/sitemap.xml');
  writeFileSync(outPath, xml, 'utf8');
  console.log(`Sitemap written: ${entries.length} total URLs → public/sitemap.xml`);
}

generate().catch(err => {
  console.error('Sitemap generation failed:', err.message);
  process.exit(1);
});
