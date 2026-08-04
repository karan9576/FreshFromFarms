export default function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://freshfromfarms.shop';
  const currentDate = new Date();

  const productRoutes = [
    'raw-makhana',
    'salted-makhana',
    'peri-peri-makhana',
    'mint-makhana',
    'cheese-makhana'
  ].map(slug => ({
    url: `${baseUrl}/product/${slug}`,
    lastModified: currentDate,
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  return [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    ...productRoutes,
    {
      url: `${baseUrl}/my-orders`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];
}
