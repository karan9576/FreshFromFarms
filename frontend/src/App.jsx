import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import AnnouncementBar from './components/AnnouncementBar';
import Chatbot from './components/Chatbot';
import Home from './pages/Home';
import Login from './pages/Login';
import LoginSuccess from './pages/LoginSuccess';
import AdminDashboard from './pages/AdminDashboard';
import MyOrders from './pages/MyOrders';
import { X, Plus, Minus, ShoppingBag } from 'lucide-react';
import axios from 'axios';

// Globally intercept all outgoing axios calls to automatically attach Bearer token if it exists in localStorage
// and clean up any double slashes in URLs.
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (config.url) {
      const protocolParts = config.url.split('://');
      if (protocolParts.length === 2) {
        config.url = protocolParts[0] + '://' + protocolParts[1].replace(/\/+/g, '/');
      } else {
        config.url = config.url.replace(/\/+/g, '/');
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

function App() {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState('idle'); // 'idle' | 'processing' | 'success'
  const [user, setUser] = useState(null);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [stateVal, setStateVal] = useState('');
  const [pincodeLoading, setPincodeLoading] = useState(false);

  // Autofill email when user state changes
  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
    } else {
      setEmail('');
    }
  }, [user]);

  // Auto-detect City and State using Indian Postal PIN code API
  useEffect(() => {
    const fetchCityState = async () => {
      if (pincode.length === 6) {
        setPincodeLoading(true);
        try {
          const res = await axios.get(`https://api.postalpincode.in/pincode/${pincode}`);
          if (res.data && res.data[0] && res.data[0].Status === 'Success') {
            const postOffices = res.data[0].PostOffice;
            if (postOffices && postOffices.length > 0) {
              setCity(postOffices[0].District);
              setStateVal(postOffices[0].State);
            }
          }
        } catch (err) {
          console.error('Error fetching pincode details:', err);
        } finally {
          setPincodeLoading(false);
        }
      }
    };
    fetchCityState();
  }, [pincode]);

  // Check login authentication session status on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/current_user`,
          { withCredentials: true }
        );
        setUser(res.data);
      } catch (err) {
        setUser(null); // Not authenticated
      }
    };
    checkAuthStatus();
  }, []);

  const addToCart = (product, weight, price) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id && item.weight === weight);
      if (existingItem) {
        return prevCart.map(item => 
          item.id === product.id && item.weight === weight 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, weight, price, quantity: 1 }];
    });
    // Removed automatic drawer open behavior
  };

  const updateQuantity = (id, weight, delta) => {
    setCart(prevCart => 
      prevCart.map(item => {
        if (item.id === id && item.weight === weight) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean)
    );
  };

  const removeFromCart = (id, weight) => {
    setCart(prevCart => prevCart.filter(item => !(item.id === id && item.weight === weight)));
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Dynamically load Razorpay SDK Script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async () => {
    if (!email || !phone || !addressLine1 || !pincode || !city || !stateVal) {
      alert('Please fill out all mandatory fields (Email, Mobile, Address Line 1, PIN code, City, and State) before checking out.');
      return;
    }

    try {
      setCheckoutStep('processing');
      
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        alert('Razorpay SDK failed to load. Please check your internet connection.');
        setCheckoutStep('idle');
        return;
      }

      // 1. Create order on Express backend (session cookies sent via credentials)
      const orderResponse = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/payment/order`, 
        { amount: cartTotal },
        { withCredentials: true }
      );
      
      const order = orderResponse.data;
      setCheckoutStep('idle'); // Close spinner overlay to open the payment sheet
      
      // 2. Open Razorpay Checkout overlay
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'test_razorpay_key',
        amount: order.amount,
        currency: order.currency,
        name: 'FreshFromFarms',
        description: 'Roasted Foxnuts Superfood Order',
        image: '/favicon.svg',
        order_id: order.id,
        handler: async function (response) {
          // 3. Verify payment signature on backend
          setCheckoutStep('processing');
          try {
            const verifyRes = await axios.post(
              `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/payment/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                cartItems: cart,
                shippingInfo: {
                  email,
                  phone,
                  addressLine1,
                  addressLine2,
                  city,
                  state: stateVal,
                  pincode
                }
              },
              { withCredentials: true }
            );
            
            if (verifyRes.status === 200) {
              setCheckoutStep('success');
              setTimeout(() => {
                setCart([]);
                setPhone('');
                setEmail('');
                setAddressLine1('');
                setAddressLine2('');
                setPincode('');
                setCity('');
                setStateVal('');
                setIsCartOpen(false);
                setCheckoutStep('idle');
              }, 2000);
            } else {
              alert('Payment signature verification failed.');
              setCheckoutStep('idle');
            }
          } catch (err) {
            console.error(err);
            alert('Error verifying transaction authentication signature.');
            setCheckoutStep('idle');
          }
        },
        prefill: {
          name: 'Healthy Snacker',
          email: 'snack@freshfromfarms.com',
          contact: '9999999999'
        },
        theme: {
          color: '#0c3823' // Dark forest green brand color matching CSS
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        alert('Please login using your Google account to proceed to checkout!');
        setIsCartOpen(false);
        window.location.href = '/login';
      } else {
        alert('Error creating transaction order. Please check your backend connection and Razorpay credentials.');
      }
      setCheckoutStep('idle');
    }
  };

  return (
    <>
      <AnnouncementBar />
      <Navbar cartCount={cartCount} onCartClick={() => setIsCartOpen(true)} user={user} setUser={setUser} />
      
      <Routes>
        <Route path="/" element={<Home addToCart={addToCart} cart={cart} updateQuantity={updateQuantity} />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/login-success" element={<LoginSuccess setUser={setUser} />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/my-orders" element={<MyOrders />} />
      </Routes>

      {/* Slide-out Cart Drawer */}
      <div className={`cart-drawer ${isCartOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <ShoppingBag size={22} style={{ color: 'var(--primary-color)' }} />
            <h3>Your Cart ({cartCount})</h3>
          </div>
          <button className="close-cart-btn" onClick={() => setIsCartOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="empty-cart-msg">
              <p>Your cart is empty</p>
              <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => setIsCartOpen(false)}>Shop Now</button>
            </div>
          ) : (
            cart.map(item => (
              <div key={`${item.id}-${item.weight}`} className="cart-item">
                <div className="cart-item-details">
                  <h4>{item.name}</h4>
                  <span className="cart-item-weight">{item.weight}</span>
                  <span className="cart-item-price">₹{item.price} each</span>
                </div>
                <div className="cart-item-actions">
                  <div className="quantity-controls">
                    <button onClick={() => updateQuantity(item.id, item.weight, -1)}><Minus size={14} /></button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.weight, 1)}><Plus size={14} /></button>
                  </div>
                  <button className="remove-item-btn" onClick={() => removeFromCart(item.id, item.weight)}>Remove</button>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <>
            {/* Shipping Information Form */}
            <div className="shipping-info-form" style={{ padding: '1.2rem', borderTop: '1px solid rgba(12, 56, 35, 0.1)', background: 'rgba(255, 255, 255, 0.35)', borderRadius: '14px', margin: '1rem 0.5rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <h4 style={{ color: 'var(--bg-dark)', fontWeight: 700, fontSize: '0.95rem' }}>Shipping Details</h4>
              
              <div className="form-group" style={{ margin: 0 }}>
                <input 
                  type="email" 
                  placeholder="Email Address*" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)}
                  style={{ padding: '0.65rem 0.8rem', fontSize: '0.85rem', background: '#fff', border: '1px solid var(--border-color)', borderRadius: '6px', width: '100%', outline: 'none' }} 
                  required 
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <input 
                  type="tel" 
                  placeholder="Mobile Number*" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)}
                  style={{ padding: '0.65rem 0.8rem', fontSize: '0.85rem', background: '#fff', border: '1px solid var(--border-color)', borderRadius: '6px', width: '100%', outline: 'none' }} 
                  required 
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <input 
                  type="text" 
                  placeholder="Address Line 1 (Flat, House No)*" 
                  value={addressLine1} 
                  onChange={e => setAddressLine1(e.target.value)}
                  style={{ padding: '0.65rem 0.8rem', fontSize: '0.85rem', background: '#fff', border: '1px solid var(--border-color)', borderRadius: '6px', width: '100%', outline: 'none' }} 
                  required 
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <input 
                  type="text" 
                  placeholder="Address Line 2 (Area, Street, Landmark)" 
                  value={addressLine2} 
                  onChange={e => setAddressLine2(e.target.value)}
                  style={{ padding: '0.65rem 0.8rem', fontSize: '0.85rem', background: '#fff', border: '1px solid var(--border-color)', borderRadius: '6px', width: '100%', outline: 'none' }} 
                />
              </div>

              <div className="form-group" style={{ margin: 0, position: 'relative' }}>
                <input 
                  type="text" 
                  maxLength="6"
                  placeholder="PIN Code (Auto-fills City/State)*" 
                  value={pincode} 
                  onChange={e => setPincode(e.target.value.replace(/\D/g, ''))} 
                  style={{ padding: '0.65rem 0.8rem', fontSize: '0.85rem', background: '#fff', border: '1px solid var(--border-color)', borderRadius: '6px', width: '100%', outline: 'none' }} 
                  required 
                />
                {pincodeLoading && (
                  <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Searching...
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <input 
                    type="text" 
                    placeholder="City*" 
                    value={city} 
                    onChange={e => setCity(e.target.value)}
                    style={{ padding: '0.65rem 0.8rem', fontSize: '0.85rem', background: '#fff', border: '1px solid var(--border-color)', borderRadius: '6px', width: '100%', outline: 'none' }} 
                    required 
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <input 
                    type="text" 
                    placeholder="State*" 
                    value={stateVal} 
                    onChange={e => setStateVal(e.target.value)}
                    style={{ padding: '0.65rem 0.8rem', fontSize: '0.85rem', background: '#fff', border: '1px solid var(--border-color)', borderRadius: '6px', width: '100%', outline: 'none' }} 
                    required 
                  />
                </div>
              </div>
            </div>

            <div className="cart-footer-summary" style={{ borderTop: 'none', paddingTop: 0 }}>
              <div className="cart-total-row" style={{ marginTop: 0 }}>
                <span>Subtotal</span>
                <span className="total-val">₹{cartTotal}</span>
              </div>
              <button className="btn-primary checkout-btn" onClick={handleCheckout}>
                Checkout via UPI
              </button>
            </div>
          </>
        )}
      </div>

      {/* Cart overlay background */}
      {isCartOpen && <div className="cart-overlay" onClick={() => setIsCartOpen(false)}></div>}

      {/* Mock UPI Payment Overlay */}
      {checkoutStep !== 'idle' && (
        <div className="checkout-overlay">
          <div className="checkout-modal-content">
            {checkoutStep === 'processing' ? (
              <>
                <div className="spinner"></div>
                <h3 style={{ color: 'var(--bg-dark)', marginBottom: '0.5rem', fontWeight: 800 }}>Processing Payment</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Connecting to secure UPI gateway for ₹{cartTotal}...</p>
              </>
            ) : (
              <>
                <div className="success-icon-wrapper">
                  <svg style={{ width: '36px', height: '36px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 style={{ color: 'var(--bg-dark)', marginBottom: '0.5rem', fontWeight: 800 }}>Order Placed!</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Payment verified successfully. Sourcing fresh foxnuts for you!</p>
              </>
            )}
          </div>
        </div>
      )}

      <Chatbot />
    </>
  );
}

export default App;
