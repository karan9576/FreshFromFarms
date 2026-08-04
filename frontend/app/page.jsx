import HomeClientWrapper from '../src/components/HomeClientWrapper';

export const metadata = {
  title: 'FreshFromFarms | Buy Organic Makhana, Fox Nuts & Healthy Snacks Online India',
  description: 'Buy 100% natural, oil-free roasted organic Makhana (Indian Fox Nuts & Water Lily Seeds) online direct from Bihar farms. Shop healthy breakfast snacks, Peri Peri, Himalayan Salt, Pudina & Cheese Makhana with Free Shipping at FreshFromFarms.',
  keywords: [
    'buy makhana',
    'buy makhana online',
    'freshfromfarms',
    'freshfromfarms shop',
    'fresh from farms makhana',
    'organic makhana',
    'organic makhana online',
    'buy healthy',
    'buy healthy breakfast',
    'buy snacks',
    'buy healthy snacks',
    'healthy snacks online',
    'healthy snacks for weight loss',
    'foxnuts online',
    'buy foxnuts online',
    'water lily seeds buy online',
    'phool makhana online',
    'bihar makhana online',
    'mithila makhana buy online',
    'raw makhana online',
    'salted makhana online',
    'himalayan pink salt makhana',
    'peri peri makhana',
    'spicy peri peri makhana',
    'pudina makhana',
    'mint makhana online',
    'cheese makhana',
    'cheddar cheese makhana',
    'oil free roasted snacks',
    'low calorie snacks online',
    'high protein snacks india',
    'vrat snacks online',
    'fasting food makhana',
    'office snacks online',
    'kids healthy snacks',
    'makhana 250g price',
    'makhana 500g price',
    'makhana 1kg price',
    'best makhana brand in india'
  ],
  alternates: {
    canonical: 'https://freshfromfarms.shop',
  },
  openGraph: {
    title: 'FreshFromFarms | Buy Organic Makhana & Healthy Snacks Online',
    description: 'Buy 100% natural, oil-free roasted organic Makhana (Indian Fox Nuts) online direct from Bihar. Shop healthy breakfast snacks at FreshFromFarms.',
    url: 'https://freshfromfarms.shop',
    siteName: 'FreshFromFarms',
    images: [{ url: '/hero_image.png', width: 1200, height: 630, alt: 'FreshFromFarms Organic Makhana Superfood Range' }],
  },
  verification: {
    google: 'googleaaa2a88a8a24932c'
  }
};

export default function HomePage() {
  // JSON-LD Structured Data for Google Rich Snippets
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'FreshFromFarms',
    url: 'https://freshfromfarms.shop',
    logo: 'https://freshfromfarms.shop/makhana_favicon.png',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91-9870415174',
      contactType: 'customer service',
      email: 'care@freshfromfarms.shop',
      availableLanguage: ['English', 'Hindi']
    }
  };

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'FreshFromFarms Organic Makhana (Fox Nuts)',
    image: [
      'https://freshfromfarms.shop/hero_image.png',
      'https://freshfromfarms.shop/raw.png',
      'https://freshfromfarms.shop/salted.png',
      'https://freshfromfarms.shop/periperi.png'
    ],
    description: 'Handpicked, water-cultivated organic lotus seeds roasted oil-free in Bihar, India. Preservative-free healthy snacking.',
    brand: {
      '@type': 'Brand',
      name: 'FreshFromFarms'
    },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'INR',
      lowPrice: '79',
      highPrice: '1099',
      offerCount: '5',
      availability: 'https://schema.org/InStock'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '10240'
    }
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'FreshFromFarms',
    url: 'https://freshfromfarms.shop',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://freshfromfarms.shop/#shop',
      'query-input': 'required name=search_term_string'
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />

      <HomeClientWrapper />
    </>
  );
}
