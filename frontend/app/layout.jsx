import Script from 'next/script';
import '../src/styles/index.css';
import '../src/App.css';
import AppShell from '../src/components/AppShell';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://freshfromfarms.shop'),
  title: {
    default: 'FreshFromFarms | Premium Organic Makhana & Water Lily Seeds',
    template: '%s | FreshFromFarms'
  },
  description: 'Buy 100% natural, water-cultivated organic Makhana (Indian Foxnuts / Water Lily Seeds) directly from pristine farms of Bihar. Preservative-free, GI-tagged, oil-free roasted superfood snacks.',
  keywords: [
    'Makhana',
    'Organic Makhana',
    'Indian Foxnuts',
    'Water Lily Seeds',
    'Raw Makhana',
    'Salted Makhana',
    'Flavoured Makhana',
    'Peri Peri Makhana',
    'Bihar Foxnuts',
    'Healthy Snacking',
    'FreshFromFarms'
  ],
  authors: [{ name: 'FreshFromFarms' }],
  creator: 'FreshFromFarms',
  publisher: 'FreshFromFarms',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/makhana_favicon.png',
    shortcut: '/makhana_favicon.png',
    apple: '/makhana_favicon.png',
  },
  openGraph: {
    title: 'FreshFromFarms | Premium Organic Makhana & Water Lily Seeds',
    description: '100% Natural, Water-cultivated organic Makhana (Foxnuts) direct from Bihar water farms. Preservative-free roasted superfood.',
    url: 'https://freshfromfarms.shop',
    siteName: 'FreshFromFarms',
    images: [
      {
        url: '/hero_image.png',
        width: 1200,
        height: 630,
        alt: 'FreshFromFarms Organic Makhana Collection',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FreshFromFarms | Premium Organic Makhana',
    description: '100% Natural organic water-cultivated Makhana (Foxnuts) direct from Bihar farms.',
    images: ['/hero_image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://freshfromfarms.shop',
  },
};

export const viewport = {
  themeColor: '#0c3823',
  width: 'device-width',
  initialScale: 1,
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is Makhana (Foxnuts / Water Lily Seeds)?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Makhana (Foxnuts) are edible puffed seeds of the Euryale ferox water lily plant, cultivated natively in pristine water ponds across Bihar, India. They are rich in protein, fiber, calcium, and antioxidants with a low glycemic index.'
      }
    },
    {
      '@type': 'Question',
      name: 'Why buy organic Makhana directly from FreshFromFarms?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'FreshFromFarms sources 100% natural, GI-tagged water-cultivated Makhana directly from Bihar water farms. Our products are roasted oil-free, 100% preservative-free, and quality-tested for maximum crispness and safety.'
      }
    },
    {
      '@type': 'Question',
      name: 'Are FreshFromFarms Makhana products FSSAI certified?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, FreshFromFarms operates under strict FSSAI food safety regulations (FSSAI Licence No: 20426121001137) and GST compliance (GSTIN: 10ACJFA8885A1ZL).'
      }
    },
    {
      '@type': 'Question',
      name: 'What are the delivery times and shipping fees?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'FreshFromFarms offers FREE Shipping across India on all orders above ₹499. Standard delivery takes 2 to 5 business days depending on location.'
      }
    }
  ]
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID || 'G-RJD0MW8LK9'}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID || 'G-RJD0MW8LK9'}', {
              page_path: window.location.pathname,
            });
          `}
        </Script>
      </head>
      <body>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
