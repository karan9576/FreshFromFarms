import React, { useState, useEffect } from 'react';
import axios from 'axios';

const fallbackProducts = [
  { 
    id: 1, 
    name: 'Raw Makhana', 
    category: 'raw', 
    desc: 'Premium, unprocessed organic fox nuts straight from our water farms.', 
    prices: { '50g': 79, '100g': 139, '1kg': 899 },
    imgUrl: '/raw.png' 
  },
  { 
    id: 2, 
    name: 'Salted Makhana', 
    category: 'salted', 
    desc: 'Lightly roasted with trace rock salt for a pure, salty crunch.', 
    prices: { '50g': 89, '100g': 159, '1kg': 999 },
    imgUrl: '/salted.png' 
  },
  { 
    id: 3, 
    name: 'Peri Peri Makhana', 
    category: 'flavoured', 
    desc: 'Spiced with fiery African bird\'s eye chili and premium herbs.', 
    prices: { '50g': 99, '100g': 179, '1kg': 1099 },
    imgUrl: '/periperi.png' 
  },
  { 
    id: 4, 
    name: 'Cheese & Herbs', 
    category: 'flavoured', 
    desc: 'Rich cheese dusting mixed with natural Italian oregano.', 
    prices: { '50g': 99, '100g': 179, '1kg': 1099 },
    imgUrl: '/cheese.png' 
  },
  { 
    id: 5, 
    name: 'Mint & Lime', 
    category: 'flavoured', 
    desc: 'Tangy lemon zest with dried mint leaves for a refreshing kick.', 
    prices: { '50g': 99, '100g': 179, '1kg': 1099 },
    imgUrl: '/mint.png' 
  }
];

// Vector Leaf Component (Ref 1)
const LeafSVG = ({ className }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={className} 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: '45px', height: '45px' }}
  >
    <path 
      d="M2 22C2 22 6 18 12 17C18 16 22 10 22 2C22 2 14 2 8 8C2 14 2 22 2 22Z" 
      fill="#40916c" 
    />
    <path 
      d="M2 22C10 14 16 8 22 2" 
      stroke="#1b4332" 
      strokeWidth="1.5" 
      strokeLinecap="round"
    />
  </svg>
);

// Utility to chroma-key white background into transparency in runtime.
const makeImageTransparent = (imgUrl) => {
  return new Promise((resolve) => {
    const img = new Image();
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i+1];
          const b = data[i+2];
          const brightness = (r + g + b) / 3;
          
          // Remove white/very light background pixels
          if (brightness > 245) {
            data[i+3] = 0; 
          } else if (brightness > 230) {
            // Feather edges/shadows smoothly
            const alpha = (brightness - 230) / (245 - 230);
            data[i+3] = Math.min(data[i+3], Math.round((1 - alpha) * 255));
          }
        }
        
        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL());
      } catch (err) {
        console.warn('Canvas transparency check failed, falling back:', err);
        resolve(imgUrl); 
      }
    };

    img.onerror = () => {
      console.warn('Failed to load image for transparency:', imgUrl);
      resolve(imgUrl); 
    };

    img.src = imgUrl;
  });
};

// Sub-component for Product Card to manage individual selected weights
function ProductCard({ product, addToCart, cart = [], updateQuantity }) {
  const [selectedWeight, setSelectedWeight] = useState('100g'); // Default selected weight
  const currentPrice = product.prices[selectedWeight];


  return (
    <div className="product-card">
      <div className="product-image-container">
        <img src={product.imgUrl} alt={product.name} className="product-package-img" />
      </div>
      <div className="product-info">
        <h3>{product.name}</h3>
        <p>{product.desc}</p>
        
        {/* Size/Weight Selector pills (Ref 2) */}
        <div className="weight-selector">
          {Object.keys(product.prices).map(weight => (
            <button 
              key={weight} 
              className={`weight-pill ${selectedWeight === weight ? 'active' : ''}`}
              onClick={() => setSelectedWeight(weight)}
            >
              {weight}
            </button>
          ))}
        </div>

        <div className="card-footer">
          <span className="price">₹{currentPrice}</span>
          {(() => {
            const cartItem = cart.find(item => item.id === product.id && item.weight === selectedWeight);
            const quantity = cartItem ? cartItem.quantity : 0;
            if (quantity > 0) {
              return (
                <div className="quantity-controls product-qty-adjuster" style={{ margin: 0, padding: '0.2rem', gap: '0.8rem', background: 'var(--primary-color)', color: '#fff', borderRadius: '8px', border: 'none', display: 'flex', alignItems: 'center' }}>
                  <button 
                    onClick={() => updateQuantity(product.id, selectedWeight, -1)} 
                    style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.1rem', fontWeight: 800, padding: '0.2rem 0.6rem', cursor: 'pointer' }}
                  >
                    -
                  </button>
                  <span style={{ fontWeight: 800, minWidth: '15px', textAlign: 'center', fontSize: '0.95rem' }}>{quantity}</span>
                  <button 
                    onClick={() => updateQuantity(product.id, selectedWeight, 1)} 
                    style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.1rem', fontWeight: 800, padding: '0.2rem 0.6rem', cursor: 'pointer' }}
                  >
                    +
                  </button>
                </div>
              );
            }
            return (
              <button className="btn-primary" onClick={() => addToCart(product, selectedWeight, currentPrice)}>
                Add to Cart
              </button>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

export default function Home({ addToCart, cart = [], updateQuantity }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [products, setProducts] = useState(fallbackProducts);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterLoading(true);
    try {
      const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const cleanApiURL = apiURL.endsWith('/') ? apiURL.slice(0, -1) : apiURL;
      const res = await axios.post(`${cleanApiURL}/auth/newsletter`, {
        email: newsletterEmail
      });
      alert(res.data.message || 'Subscribed successfully! Check your inbox for your 10% discount code.');
      setNewsletterEmail('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to subscribe to newsletter. Please try again.');
    } finally {
      setNewsletterLoading(false);
    }
  };

  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [transparentImages, setTransparentImages] = useState({
    raw: '',
    salted: '',
    periperi: '',
    cheese: '',
    mint: ''
  });

  // Process all product pouch images to make them transparent on mount
  useEffect(() => {
    const paths = {
      raw: '/raw.png',
      salted: '/salted.png',
      periperi: '/periperi.png',
      cheese: '/cheese.png',
      mint: '/mint.png'
    };

    const processAll = async () => {
      const processed = {};
      for (const [key, path] of Object.entries(paths)) {
        try {
          processed[key] = await makeImageTransparent(path);
        } catch (e) {
          processed[key] = path; 
        }
      }
      setTransparentImages(processed);
    };

    processAll();
  }, []);

  // Fetch products from the database on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/products`);
        if (res.data && res.data.length > 0) {
          const mapped = res.data.map(p => {
            let category = 'flavoured';
            if (p.flavour === 'Raw') category = 'raw';
            else if (p.flavour === 'Salted') category = 'salted';
            
            let prices = { '50g': 99, '100g': 179, '1kg': 1099 }; // default flavoured pricing
            if (p.price === 139) prices = { '50g': 79, '100g': 139, '1kg': 899 };
            else if (p.price === 159) prices = { '50g': 89, '100g': 159, '1kg': 999 };
            else {
              // Custom dynamic scaling for new admin added products
              prices = {
                '50g': Math.round(p.price * 0.57),
                '100g': p.price,
                '1kg': Math.round(p.price * 6.47)
              };
            }

            return {
              id: p._id,
              name: p.name,
              category,
              desc: p.description,
              prices,
              imgUrl: p.imageUrl || '/raw.png'
            };
          });
          setProducts(mapped);
        } else {
          setProducts(fallbackProducts);
        }
      } catch (err) {
        console.warn('API error fetching products, using local fallback:', err);
        setProducts(fallbackProducts);
      }
    };

    fetchProducts();
  }, []);

  // 3D Parallax Tilt calculation
  const handleMouseMove = (e) => {
    if (window.innerWidth < 968) return; // Disable tilt on mobile/tablets to prevent NaN scroll bugs
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    const rx = -(y / (rect.height / 2)) * 12;
    const ry = (x / (rect.width / 2)) * 12;

    setTilt({ x: rx, y: ry });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  // Helper to filter categories and smooth scroll to shop
  const handlePouchClick = (category) => {
    setActiveCategory(category);
    const shopSection = document.getElementById('shop');
    if (shopSection) {
      shopSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <span className="hero-badge">Handpicked. Healthy. Natural.</span>
          <h1 className="hero-title">
            Bring The Nature <br />
            Close To You
          </h1>
          <p className="hero-subtitle">
            Experience India's own GI-tagged superfood. Sourced directly from pristine farms, roasted to perfection, and delivered fresh to your doorstep.
          </p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => document.getElementById('shop').scrollIntoView({ behavior: 'smooth' })}>
              Shop Makhana
            </button>
            <button className="btn-secondary" onClick={() => document.getElementById('story').scrollIntoView({ behavior: 'smooth' })}>
              Our Heritage
            </button>
          </div>
          <div className="hero-features">
            <div className="feat-item">
              <span className="feat-val">100% Organic</span>
              <span className="feat-lbl">Certified Crops</span>
            </div>
            <div className="feat-divider"></div>
            <div className="feat-item">
              <span className="feat-val">Water Grown</span>
              <span className="feat-lbl">Traditional Farming</span>
            </div>
          </div>
        </div>

        {/* 3D Parallax Graphic Layering with 5 Flying Pouches */}
        <div 
          className="hero-graphic-container"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Only the center image (inside tilt-layer) tilts on hover */}
          <div 
            className="tilt-layer"
            style={{
              transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`
            }}
          >
            {/* Morphing Blob shape enclosing high quality makhana bowl */}
            <div className="morphing-blob">
              <img src="/makhana.png" alt="Earthy Bowl of roasted Makhana" className="blob-img" />
            </div>
          </div>

          {/* 5 Floating Flavoured Pouches wrapped in containers for independent hover effects */}
          {transparentImages.raw && (
            <div className="pouch-raw" onClick={() => handlePouchClick('raw')}>
              <img 
                src={transparentImages.raw} 
                alt="Raw Makhana Pouch" 
                className="pouch-hover-target" 
              />
            </div>
          )}
          {transparentImages.salted && (
            <div className="pouch-salted" onClick={() => handlePouchClick('salted')}>
              <img 
                src={transparentImages.salted} 
                alt="Classic Sea Salt Makhana Pouch" 
                className="pouch-hover-target" 
              />
            </div>
          )}
          {transparentImages.periperi && (
            <div className="pouch-periperi" onClick={() => handlePouchClick('flavoured')}>
              <img 
                src={transparentImages.periperi} 
                alt="Tangy Peri Peri Makhana Pouch" 
                className="pouch-hover-target" 
              />
            </div>
          )}
          {transparentImages.cheese && (
            <div className="pouch-cheese" onClick={() => handlePouchClick('flavoured')}>
              <img 
                src={transparentImages.cheese} 
                alt="Cheese & Herbs Makhana Pouch" 
                className="pouch-hover-target" 
              />
            </div>
          )}
          {transparentImages.mint && (
            <div className="pouch-mint" onClick={() => handlePouchClick('flavoured')}>
              <img 
                src={transparentImages.mint} 
                alt="Mint & Lime Makhana Pouch" 
                className="pouch-hover-target" 
              />
            </div>
          )}

          {/* Vector floating leaves */}
          <LeafSVG className="floating-leaf leaf-1" />
          <LeafSVG className="floating-leaf leaf-2" />
          <LeafSVG className="floating-leaf leaf-3" />
        </div>
      </section>

      {/* Feature Cards Section (Ref 2) */}
      <section className="features-section">
        <div className="feat-card">
          <h3>Sourced Responsibly</h3>
          <p>Harvested by local farmers using eco-friendly water cultivation techniques that respect biodiversity.</p>
        </div>
        <div className="feat-card">
          <h3>Nutrient Powerhouse</h3>
          <p>Rich in proteins, dietary fibers, calcium, and iron. The perfect oil-free snacks to fuel your day.</p>
        </div>
        <div className="feat-card">
          <h3>GI Tagged Authenticity</h3>
          <p>Grown in the geographically certified water fields of Mithila, providing true authenticity of origin.</p>
        </div>
      </section>

      {/* Brand Story Section */}
      <section className="story-section" id="story">
        <div className="story-grid">
          <div className="story-image-container">
            <img src="/hero_image.png" alt="Makhana product range mockup" className="story-img" />
          </div>
          <div className="story-content">
            <span className="hero-badge" style={{ background: 'rgba(12, 56, 35, 0.08)', color: 'var(--bg-dark)', border: '1px solid rgba(12, 56, 35, 0.15)' }}>Our Heritage</span>
            <h2>Pure Makhana, Clean Farming</h2>
            <p>
              We harvest our lotus seeds from the mineral-rich waters of Bihar, using sustainable farming methods. Each seed is hand-selected, cleaned, graded, and roasted to perfection. 
            </p>
            <p>
              No artificial preservatives, no extra oils—just pure, clean crunch packed with protein, calcium, and essential antioxidants. We believe in bridging the gap between conscious farmers and health-conscious snackers.
            </p>
          </div>
        </div>
      </section>

      {/* Shop/Product Grid Section (Ref 2 & 3) */}
      <section className="shop-section" id="shop">
        <div className="section-header">
          <span className="hero-badge" style={{ background: 'rgba(12, 56, 35, 0.08)', color: 'var(--bg-dark)', border: '1px solid rgba(12, 56, 35, 0.15)' }}>The Collection</span>
          <h2>Explore Our Products</h2>
          <p>A handpicked selection of healthy, roasted fox nut snacks.</p>
        </div>

        {/* Categories Tab (Ref 2) */}
        <div className="filter-tabs">
          <button className={`tab-btn ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => setActiveCategory('all')}>ALL PRODUCTS</button>
          <button className={`tab-btn ${activeCategory === 'raw' ? 'active' : ''}`} onClick={() => setActiveCategory('raw')}>RAW MAKHANA</button>
          <button className={`tab-btn ${activeCategory === 'salted' ? 'active' : ''}`} onClick={() => setActiveCategory('salted')}>SALTED MAKHANA</button>
          <button className={`tab-btn ${activeCategory === 'flavoured' ? 'active' : ''}`} onClick={() => setActiveCategory('flavoured')}>FLAVOURED</button>
        </div>

        {/* Product Grid */}
        <div className="product-grid">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} addToCart={addToCart} cart={cart} updateQuantity={updateQuantity} />
          ))}
        </div>
      </section>

      {/* Middle Banner (Ref 2) */}
      <section className="middle-banner">
        <h2>Taste the Crunch of Nature</h2>
        <p>Subscribe to our newsletter for seasonal harvest deals, exclusive recipe insights, and health snacking guides.</p>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button className="btn-primary" onClick={() => document.getElementById('shop').scrollIntoView({ behavior: 'smooth' })}>Shop Now</button>
        </div>
      </section>

      {/* Contact Us Section */}
      <section id="contact" className="contact-section">
        <div className="contact-container">
          <div className="contact-info">
            <span className="contact-badge">GET IN TOUCH</span>
            <h2>We'd Love to Hear From You</h2>
            <p className="contact-desc">
              Have questions about our organic harvesting, bulk orders, or product range? Sourced straight from the farms of India, we are here to help!
            </p>
            
            <div className="contact-details">
              <div className="contact-item">
                <span className="contact-icon">📞</span>
                <div>
                  <h4>Call / WhatsApp Us</h4>
                  <p><a href="tel:+919870415174">+91 9870415174</a></p>
                  <p><a href="tel:+919576600246">+91 9576600246</a></p>
                </div>
              </div>

              <div className="contact-item">
                <span className="contact-icon">✉️</span>
                <div>
                  <h4>Email Support</h4>
                  <p><a href="mailto:support@freshfromfarms.com">support@freshfromfarms.com</a></p>
                </div>
              </div>

              <div className="contact-item">
                <span className="contact-icon">🛡️</span>
                <div>
                  <h4>Compliance & Registrations</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.4rem', marginBottom: '0.6rem' }}>
                    <img src="/fssai.png" alt="FSSAI Logo" style={{ height: '24px', width: 'auto', objectFit: 'contain' }} />
                    <span style={{ fontSize: '0.95rem', color: 'var(--text-dark)' }}><strong>FSSAI Licence No:</strong> 20426121001137</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <img src="/gst.png" alt="GST Logo" style={{ height: '20px', width: 'auto', objectFit: 'contain' }} />
                    <span style={{ fontSize: '0.95rem', color: 'var(--text-dark)' }}><strong>GST Registration No:</strong> 10ACJFA8885A1ZL</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="contact-form-panel glass-panel">
            <h3>Send a Message</h3>
            <form onSubmit={(e) => { e.preventDefault(); alert('Thank you! Your message has been received. We will get back to you shortly.'); e.target.reset(); }}>
              <div className="form-group">
                <label htmlFor="contact-name">Full Name</label>
                <input type="text" id="contact-name" placeholder="Enter your name" required />
              </div>
              <div className="form-group">
                <label htmlFor="contact-email">Email Address</label>
                <input type="email" id="contact-email" placeholder="Enter your email" required />
              </div>
              <div className="form-group">
                <label htmlFor="contact-message">Your Message</label>
                <textarea id="contact-message" rows="4" placeholder="How can we help you?" required></textarea>
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%' }}>Send Message</button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer (Ref 2) */}
      <footer className="footer">
        <div className="footer-grid">
          <div className="footer-col">
            <h3 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '1.2rem' }}>FreshFromFarms</h3>
            <p>Direct-to-consumer premium organic Makhana (Fox Nuts) snacks sourced straight from agricultural farms of India.</p>
          </div>
          <div className="footer-col">
            <h3>Quick Links</h3>
            <ul>
              <li><a href="#story">Our Story</a></li>
              <li><a href="#shop">Shop</a></li>
              <li><a href="#faq">FAQ</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h3>Contact & Compliance</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '0.4rem', color: 'rgba(255,255,255,0.7)' }}>📞 +91 9870415174</p>
            <p style={{ fontSize: '0.9rem', marginBottom: '0.4rem', color: 'rgba(255,255,255,0.7)' }}>📞 +91 9576600246</p>
            <p style={{ fontSize: '0.9rem', marginBottom: '1.2rem', color: 'rgba(255,255,255,0.7)' }}>✉️ support@freshfromfarms.com</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.4rem 0' }}>
              <img src="/fssai.png" alt="FSSAI Logo" style={{ height: '22px', objectFit: 'contain' }} />
              <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}><strong>FSSAI:</strong> 20426121001137</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.4rem 0' }}>
              <img src="/gst.png" alt="GST Logo" style={{ height: '18px', objectFit: 'contain' }} />
              <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}><strong>GSTIN:</strong> 10ACJFA8885A1ZL</span>
            </div>
          </div>
          <div className="footer-col">
            <h3>Join the Fresh Farm</h3>
            <p>Sign up to receive 10% off your first order!</p>
            <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
              <input 
                type="email" 
                placeholder="Enter your email" 
                value={newsletterEmail} 
                onChange={(e) => setNewsletterEmail(e.target.value)} 
                required 
                disabled={newsletterLoading}
              />
              <button type="submit" disabled={newsletterLoading}>
                {newsletterLoading ? '...' : 'Join'}
              </button>
            </form>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 FreshFromFarms. All rights reserved. Sourced organically.</p>
        </div>
      </footer>
    </div>
  );
}
