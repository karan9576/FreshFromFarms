import '../src/styles/index.css';
import '../src/App.css';
import AppShell from '../src/components/AppShell';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://freshfromfarms.com'),
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
    shortcut: '/favicon.svg',
    apple: '/makhana_favicon.png',
  },
  openGraph: {
    title: 'FreshFromFarms | Premium Organic Makhana & Water Lily Seeds',
    description: '100% Natural, Water-cultivated organic Makhana (Foxnuts) direct from Bihar water farms. Preservative-free roasted superfood.',
    url: 'https://freshfromfarms.com',
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
    canonical: 'https://freshfromfarms.com',
  },
};

export const viewport = {
  themeColor: '#0c3823',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
