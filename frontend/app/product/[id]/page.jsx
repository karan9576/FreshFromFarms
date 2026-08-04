import React from 'react';
import Link from 'next/link';

const productsData = {
  'raw-makhana': {
    id: 'raw-makhana',
    name: 'Raw Premium Organic Makhana',
    price: 199,
    originalPrice: 249,
    description: '100% natural, unroasted water-cultivated raw Makhana harvested directly from the pristine water bodies of Bihar. Ideal for home roasting, kheer, and traditional fasting recipes.',
    flavour: 'Raw',
    rating: 4.9,
    reviewsCount: 142,
    image: '/raw.png',
    weight: '250g',
    nutrition: 'High Protein, Rich in Calcium, Low Glycemic Index'
  },
  'salted-makhana': {
    id: 'salted-makhana',
    name: 'Himalayan Pink Salt Roasted Makhana',
    price: 229,
    originalPrice: 279,
    description: 'Slow-roasted in pure cold-pressed coconut oil and seasoned with authentic mineral-rich Himalayan Pink Salt. A crisp, healthy, guilt-free snack.',
    flavour: 'Salted',
    rating: 4.8,
    reviewsCount: 118,
    image: '/salted.png',
    weight: '200g',
    nutrition: 'Zero Trans Fat, Mineral Rich, Low Calorie'
  },
  'peri-peri-makhana': {
    id: 'peri-peri-makhana',
    name: 'Spicy Peri Peri Roasted Makhana',
    price: 249,
    originalPrice: 299,
    description: 'Zesty African Bird’s Eye chili seasoning infused with roasted crunchy water-cultivated foxnuts. Perfectly spicy, bold, and nutrient-packed superfood.',
    flavour: 'Peri Peri',
    rating: 4.9,
    reviewsCount: 185,
    image: '/periperi.png',
    weight: '200g',
    nutrition: 'Antioxidant Rich, Oil-Free Roasted, Spicy & Bold'
  },
  'mint-makhana': {
    id: 'mint-makhana',
    name: 'Pudina Crisp Herb Roasted Makhana',
    price: 239,
    originalPrice: 289,
    description: 'Infused with natural garden-fresh Pudina (Mint) leaves and mild tangy Indian spices. Refreshing, digestive, and crunch-packed healthy snack.',
    flavour: 'Mint',
    rating: 4.7,
    reviewsCount: 96,
    image: '/mint.png',
    weight: '200g',
    nutrition: 'Digestive Friendly, Fresh Herb Seasoning, Natural'
  },
  'cheese-makhana': {
    id: 'cheese-makhana',
    name: 'Creamy Cheddar Cheese Makhana',
    price: 259,
    originalPrice: 309,
    description: 'Rich, creamy cheddar cheese dusting over slow-roasted water lily seeds. The ultimate kid-friendly and party snack alternative to fried potato chips.',
    flavour: 'Cheese',
    rating: 4.8,
    reviewsCount: 104,
    image: '/cheese.png',
    weight: '200g',
    nutrition: 'Calcium Boosted, Gourmet Cheese Seasoning, Kid Favorite'
  }
};

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const productId = resolvedParams?.id || 'raw-makhana';
  const product = productsData[productId] || {
    name: 'Organic Makhana (Foxnuts)',
    description: '100% natural water-cultivated organic Makhana from Bihar farms.',
    image: '/makhana.png'
  };

  const title = `${product.name} | FreshFromFarms Organic Makhana`;
  const description = `${product.description} Order online directly from FreshFromFarms Bihar water farms.`;
  const canonicalUrl = `https://freshfromfarms.shop/product/${productId}`;

  return {
    title,
    description,
    keywords: [
      product.name,
      'Organic Makhana',
      'Buy Makhana Online',
      'Bihar Foxnuts',
      'Water Lily Seeds',
      'Healthy Snacks',
      'FreshFromFarms'
    ],
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'FreshFromFarms',
      images: [
        {
          url: product.image,
          width: 800,
          height: 800,
          alt: product.name
        }
      ],
      type: 'product'
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [product.image]
    }
  };
}

export default async function ProductDetailPage({ params }) {
  const resolvedParams = await params;
  const productId = resolvedParams?.id || 'raw-makhana';
  const product = productsData[productId] || productsData['raw-makhana'];

  // Individual Product JSON-LD Schema
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: `https://freshfromfarms.shop${product.image}`,
    description: product.description,
    sku: product.id,
    mpn: `FFF-${product.id.toUpperCase()}`,
    brand: {
      '@type': 'Brand',
      name: 'FreshFromFarms'
    },
    offers: {
      '@type': 'Offer',
      url: `https://freshfromfarms.shop/product/${product.id}`,
      priceCurrency: 'INR',
      price: product.price,
      priceValidUntil: '2027-12-31',
      itemCondition: 'https://schema.org/NewCondition',
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'FreshFromFarms'
      }
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewsCount
    }
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://freshfromfarms.shop'
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Products',
        item: 'https://freshfromfarms.shop/#products'
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.name,
        item: `https://freshfromfarms.shop/product/${product.id}`
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '120px 20px 60px 20px', color: 'var(--text-color, #1a1a1a)' }}>
        {/* Breadcrumb Links */}
        <nav style={{ marginBottom: '24px', fontSize: '0.9rem', color: '#666' }}>
          <Link href="/" style={{ color: 'var(--primary-color, #0c3823)', textDecoration: 'none', fontWeight: 500 }}>Home</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <Link href="/#products" style={{ color: 'var(--primary-color, #0c3823)', textDecoration: 'none', fontWeight: 500 }}>Products</Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <span>{product.name}</span>
        </nav>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px', alignItems: 'center' }}>
          {/* Product Image */}
          <div style={{ background: '#f8f9fa', borderRadius: '24px', padding: '30px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            <img
              src={product.image}
              alt={`${product.name} - 100% Organic Water-Cultivated Bihar Makhana Foxnuts`}
              style={{ maxWidth: '100%', maxHeight: '420px', objectFit: 'contain' }}
            />
          </div>

          {/* Product Details */}
          <div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-block', padding: '6px 14px', background: '#e8f5e9', color: '#2e7d32', borderRadius: '50px', fontSize: '0.85rem', fontWeight: 600 }}>
                🌿 100% Organic & Preservative-Free
              </span>
              <span style={{ display: 'inline-block', padding: '6px 14px', background: '#fff3e0', color: '#e67e22', borderRadius: '50px', fontSize: '0.85rem', fontWeight: 800 }}>
                ⏳ Coming Soon
              </span>
            </div>

            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--primary-color, #0c3823)', marginBottom: '12px', lineHeight: 1.2 }}>
              {product.name}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span style={{ background: '#fff8e1', color: '#f57f17', padding: '4px 10px', borderRadius: '8px', fontWeight: 700, fontSize: '0.95rem' }}>
                ★ {product.rating} / 5.0
              </span>
              <span style={{ color: '#777', fontSize: '0.9rem' }}>({product.reviewsCount} Customer Reviews)</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '20px' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: '#2e7d32' }}>₹{product.price}</span>
              <span style={{ fontSize: '1.2rem', color: '#999', textDecoration: 'line-through' }}>₹{product.originalPrice}</span>
              <span style={{ fontSize: '0.9rem', color: '#d32f2f', fontWeight: 700 }}>Save ₹{product.originalPrice - product.price}</span>
            </div>

            <p style={{ fontSize: '1.05rem', lineHeight: 1.6, color: '#555', marginBottom: '24px' }}>
              {product.description}
            </p>

            <div style={{ background: '#f4f6f8', borderRadius: '16px', padding: '16px 20px', marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.95rem' }}>
                <span style={{ fontWeight: 600, color: '#444' }}>Pack Weight:</span>
                <span style={{ fontWeight: 700, color: '#1a1a1a' }}>{product.weight}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                <span style={{ fontWeight: 600, color: '#444' }}>Key Nutrition:</span>
                <span style={{ fontWeight: 700, color: '#2e7d32' }}>{product.nutrition}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
              <Link href="/" style={{ flex: 1, minWidth: '200px', textAlign: 'center', padding: '16px 28px', background: 'var(--primary-color, #0c3823)', color: '#fff', borderRadius: '12px', fontWeight: 700, fontSize: '1.1rem', textDecoration: 'none', boxShadow: '0 8px 20px rgba(12,56,35,0.25)' }}>
                Shop Full Collection
              </Link>
            </div>

            {/* Marketplace Buy Options (Dev Feature) */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed rgba(0,0,0,0.15)' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#444', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                🛒 Also Available On Fast Delivery Apps:
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                <a 
                  href="#amazon" 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justify: 'center', 
                    gap: '8px', 
                    padding: '10px 14px', 
                    background: '#232F3E', 
                    color: '#FF9900', 
                    borderRadius: '8px', 
                    fontSize: '0.85rem', 
                    fontWeight: 700, 
                    textDecoration: 'none'
                  }}
                >
                  📦 Amazon
                </a>
                <a 
                  href="#flipkart" 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justify: 'center', 
                    gap: '8px', 
                    padding: '10px 14px', 
                    background: '#2874F0', 
                    color: '#FFE11B', 
                    borderRadius: '8px', 
                    fontSize: '0.85rem', 
                    fontWeight: 700, 
                    textDecoration: 'none'
                  }}
                >
                  ⚡ Flipkart
                </a>
                <a 
                  href="#blinkit" 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justify: 'center', 
                    gap: '8px', 
                    padding: '10px 14px', 
                    background: '#F7C600', 
                    color: '#111111', 
                    borderRadius: '8px', 
                    fontSize: '0.85rem', 
                    fontWeight: 800, 
                    textDecoration: 'none'
                  }}
                >
                  ⚡ Blinkit
                </a>
                <a 
                  href="#flipkart-minutes" 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justify: 'center', 
                    gap: '8px', 
                    padding: '10px 14px', 
                    background: '#4F1A87', 
                    color: '#FFE11B', 
                    borderRadius: '8px', 
                    fontSize: '0.85rem', 
                    fontWeight: 700, 
                    textDecoration: 'none'
                  }}
                >
                  ⏱️ FK Minutes
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
