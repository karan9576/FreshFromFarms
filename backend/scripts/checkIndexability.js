const axios = require('axios');

async function checkSiteIndexability() {
  console.log('================================================================================');
  console.log('          CHECKING ALL SITEMAP URLS FOR GOOGLE INDEXING READINESS              ');
  console.log('================================================================================\n');

  try {
    const sitemapRes = await axios.get('https://freshfromfarms.shop/sitemap.xml');
    const urls = [...sitemapRes.data.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);

    console.log(`Discovered ${urls.length} URLs in sitemap:\n`);

    for (const url of urls) {
      try {
        const res = await axios.get(url, { headers: { 'User-Agent': 'Googlebot/2.1 (+http://www.google.com/bot.html)' } });
        const html = res.data;
        const noindex = /noindex/i.test(html);
        const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["'](.*?)["']/i);
        const canonical = canonicalMatch ? canonicalMatch[1] : 'NONE';
        const titleMatch = html.match(/<title>(.*?)<\/title>/i);
        const title = titleMatch ? titleMatch[1] : 'NONE';

        console.log(`URL: ${url}`);
        console.log(`  - Status Code : ${res.status} OK`);
        console.log(`  - User-Agent  : Googlebot Simulated`);
        console.log(`  - Robots Tag  : ${noindex ? '❌ NOINDEX DETECTED' : '✅ INDEX, FOLLOW'}`);
        console.log(`  - Canonical   : ${canonical}`);
        console.log(`  - Page Title  : ${title.substring(0, 60)}...`);
        console.log('--------------------------------------------------------------------------------');
      } catch (err) {
        console.log(`URL: ${url} => ERROR: ${err.message}`);
      }
    }
  } catch (e) {
    console.error('Error fetching sitemap:', e.message);
  }
}

checkSiteIndexability();
