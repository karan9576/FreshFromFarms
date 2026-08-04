export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://freshfromfarms.shop';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/login-success', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
