import HomeClientWrapper from '../src/components/HomeClientWrapper';

export const metadata = {
  title: 'FreshFromFarms | Premium Organic Makhana & Water Lily Seeds',
  description: 'Shop 100% natural, water-cultivated organic Makhana (Indian Fox Nuts / Lotus Seeds) direct from pristine farms of Bihar. Preservative-free, GI-tagged, oil-free roasted superfood.',
  alternates: {
    canonical: 'https://freshfromfarms.com',
  },
  openGraph: {
    title: 'FreshFromFarms | Premium Organic Makhana',
    description: 'Shop 100% natural, water-cultivated organic Makhana (Indian Fox Nuts) direct from pristine farms of Bihar.',
    url: 'https://freshfromfarms.com',
    siteName: 'FreshFromFarms',
    images: [{ url: '/hero_image.png', width: 1200, height: 630, alt: 'FreshFromFarms Makhana Range' }],
  }
};

export default function HomePage() {
  // JSON-LD Structured Data for Google Rich Snippets
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'FreshFromFarms',
    url: 'https://freshfromfarms.com',
    logo: 'https://freshfromfarms.com/makhana_favicon.png',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91-9870415174',
      contactType: 'customer service',
      email: 'care.freshfromfarms@gmail.com',
      availableLanguage: ['English', 'Hindi']
    }
  };

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'FreshFromFarms Organic Makhana (Fox Nuts)',
    image: [
      'https://freshfromfarms.com/hero_image.png',
      'https://freshfromfarms.com/raw.png',
      'https://freshfromfarms.com/salted.png',
      'https://freshfromfarms.com/periperi.png'
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
    url: 'https://freshfromfarms.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://freshfromfarms.com/#shop',
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
