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

  const handleAddToCart = (e) => {
    // 1. Trigger parent context addToCart logic
    addToCart(product, selectedWeight, currentPrice);

    // 2. Trigger fly micro-animation
    const cardElement = e.target.closest('.product-card');
    const imgElement = cardElement ? cardElement.querySelector('.product-package-img') : null;
    // Query for first visible cart button (.cart-nav-btn is present on both desktop and mobile navbar)
    const cartElement = document.querySelector('.cart-nav-btn');

    if (imgElement && cartElement) {
      const imgRect = imgElement.getBoundingClientRect();
      const cartRect = cartElement.getBoundingClientRect();

      // Create a temporary cloned element for flying animation
      const clone = imgElement.cloneNode(true);
      clone.style.position = 'fixed';
      clone.style.left = `${imgRect.left}px`;
      clone.style.top = `${imgRect.top}px`;
      clone.style.width = `${imgRect.width}px`;
      clone.style.height = `${imgRect.height}px`;
      clone.style.zIndex = '10000';
      clone.style.pointerEvents = 'none';
      clone.style.transition = 'all 1.1s cubic-bezier(0.25, 1, 0.5, 1)';
      clone.style.opacity = '1';
      clone.style.transform = 'scale(1) rotate(0deg)';
      clone.style.filter = 'drop-shadow(0 10px 15px rgba(0, 0, 0, 0.15))';
      
      document.body.appendChild(clone);

      // Transition properties on next paint (delayed to prevent browser transition batching/skipping)
      setTimeout(() => {
        clone.style.left = `${cartRect.left + cartRect.width / 2 - 15}px`;
        clone.style.top = `${cartRect.top + cartRect.height / 2 - 15}px`;
        clone.style.width = '35px';
        clone.style.height = '35px';
        clone.style.opacity = '0.15';
        clone.style.transform = 'scale(0.25) rotate(720deg)';
      }, 50);

      // Cleanup and bump cart button state
      setTimeout(() => {
        clone.remove();
        cartElement.classList.add('bump');
        
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        if (mobileToggle) {
          mobileToggle.classList.add('bump');
        }

        setTimeout(() => {
          cartElement.classList.remove('bump');
          if (mobileToggle) {
            mobileToggle.classList.remove('bump');
          }
        }, 500);
      }, 1150);
    }
  };

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
              <button className="btn-primary" onClick={handleAddToCart}>
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
            <h3>Join the Fresh Farm</h3>
            <p>Sign up to receive 10% off your first order!</p>
            <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Enter your email" required />
              <button type="submit">Join</button>
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
