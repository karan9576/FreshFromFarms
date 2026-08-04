'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import Navbar from './Navbar';
import AnnouncementBar from './AnnouncementBar';
import Chatbot from './Chatbot';
import { X, Plus, Minus, ShoppingBag } from 'lucide-react';
import axios from 'axios';

import { getApiUrl } from '../utils/api';

const AppContext = createContext();

export function useApp() {
  return useContext(AppContext);
}

// Global axios interceptor setup for Client Component lifecycle
if (typeof window !== 'undefined') {
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
    (error) => Promise.reject(error)
  );
}

export default function AppShell({ children }) {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState('idle'); // 'idle' | 'processing' | 'success'
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('');
  const [stateVal, setStateVal] = useState('');
  const [pincodeLoading, setPincodeLoading] = useState(false);

  const apiURL = getApiUrl();
  const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_TLfcrrpSYAfpKX';

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
          `${apiURL}/auth/current_user`,
          { withCredentials: true }
        );
        setUser(res.data);
      } catch (err) {
        setUser(null); // Not authenticated
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuthStatus();
  }, [apiURL]);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('fff_cart');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) setCart(parsed);
      }
    } catch (e) {
      console.warn('Failed to load cart from localStorage:', e);
    }
  }, []);

  // Save cart to localStorage whenever cart changes
  useEffect(() => {
    try {
      localStorage.setItem('fff_cart', JSON.stringify(cart));
    } catch (e) {
      console.warn('Failed to save cart to localStorage:', e);
    }
  }, [cart]);

  const addToCart = (product, weight, price) => {
    if (!product) return;
    const finalPrice = typeof price === 'number' && !isNaN(price) ? price : (product.price || 199);
    const finalWeight = weight || '100g';

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id && item.weight === finalWeight);
      if (existingItem) {
        return prevCart.map(item => 
          item.id === product.id && item.weight === finalWeight 
            ? { ...item, quantity: item.quantity + 1, price: finalPrice }
            : item
        );
      }
      return [...prevCart, { ...product, weight: finalWeight, price: finalPrice, quantity: 1 }];
    });

    // Cart item added silently without opening drawer
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
      if (window.Razorpay) return resolve(true);
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
      
      // Handle Online Payment (Razorpay) Flow
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        alert('Razorpay SDK failed to load. Please check your internet connection.');
        setCheckoutStep('idle');
        return;
      }

      const orderResponse = await axios.post(
        `${apiURL}/payment/order`, 
        { 
          amount: cartTotal,
          phone: phone ? phone.trim() : undefined,
          pincode: pincode ? pincode.trim() : undefined,
          address: addressLine1 ? addressLine1.trim() : undefined
        },
        { withCredentials: true }
      );
      
      const order = orderResponse.data;
      
      // Clean Razorpay options (order_id automatically provides amount & currency on Razorpay servers)
      const options = {
        key: order.key || razorpayKey || 'rzp_test_TLfcrrpSYAfpKX',
        order_id: order.id,
        name: 'FreshFromFarms',
        description: 'Roasted Organic Makhana Superfood Order',
        image: typeof window !== 'undefined' ? `${window.location.origin}/makhana_favicon.png` : undefined,
        modal: {
          ondismiss: function () {
            setCheckoutStep('idle');
          }
        },
        handler: async function (response) {
          setCheckoutStep('processing');
          try {
            const verifyRes = await axios.post(
              `${apiURL}/payment/verify`,
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
            console.error('Payment Verification Error:', err);
            alert('Error verifying transaction authentication signature.');
            setCheckoutStep('idle');
          }
        },
        prefill: {
          name: user ? user.name : 'Healthy Snacker',
          email: email || (user ? user.email : 'snack@freshfromfarms.com'),
          contact: phone || '9999999999'
        },
        theme: {
          color: '#0c3823'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (err) {
      console.error('Checkout Error:', err);
      if (err.response && err.response.status === 401) {
        alert('Please login using your account to proceed to checkout!');
        setIsCartOpen(false);
        window.location.href = '/login';
      } else {
        const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Error creating transaction order.';
        alert(`Checkout Error: ${errorMsg}`);
      }
      setCheckoutStep('idle');
    }
  };

  return (
    <AppContext.Provider value={{ cart, addToCart, updateQuantity, removeFromCart, user, setUser, authLoading }}>
      <AnnouncementBar />
      <Navbar cartCount={cartCount} onCartClick={() => setIsCartOpen(true)} user={user} setUser={setUser} authLoading={authLoading} />
      
      {children}

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
          <div className="cart-footer">
            <div className="shipping-form" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
              <h4 style={{ margin: '0 0 0.2rem 0', color: 'var(--primary-color)', fontSize: '0.9rem' }}>Delivery Information</h4>
              <input type="email" placeholder="Email Address *" value={email} onChange={e => setEmail(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.85rem' }} />
              <input type="tel" placeholder="Mobile Phone *" value={phone} onChange={e => setPhone(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.85rem' }} />
              <input type="text" placeholder="House / Flat / Building / Street *" value={addressLine1} onChange={e => setAddressLine1(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.85rem' }} />
              <input type="text" placeholder="Landmark / Sector (Optional)" value={addressLine2} onChange={e => setAddressLine2(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.85rem' }} />
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  placeholder="PIN Code *" 
                  value={pincode} 
                  maxLength={6} 
                  onChange={e => setPincode(e.target.value.replace(/\D/g, ''))} 
                  style={{ flex: '1', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.85rem' }} 
                />
                {pincodeLoading && <span style={{ fontSize: '0.75rem', color: '#666', alignSelf: 'center' }}>Detecting...</span>}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input type="text" placeholder="City *" value={city} onChange={e => setCity(e.target.value)} style={{ flex: '1', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.85rem' }} />
                <input type="text" placeholder="State *" value={stateVal} onChange={e => setStateVal(e.target.value)} style={{ flex: '1', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', fontSize: '0.85rem' }} />
              </div>
            </div>

            <div className="cart-total-row">
              <span>Total Amount:</span>
              <span className="cart-total-price">₹{cartTotal}</span>
            </div>
            
            <button 
              className="btn-primary checkout-btn" 
              onClick={handleCheckout} 
              disabled={checkoutStep === 'processing'}
              style={{ width: '100%' }}
            >
              {checkoutStep === 'processing' ? 'Processing...' : 'Proceed to Checkout'}
            </button>
          </div>
        )}
      </div>
      
      {/* Checkout Processing / Success Overlay Modal */}
      {checkoutStep !== 'idle' && (
        <div className="checkout-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(12, 56, 35, 0.55)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000
        }}>
          <div className="glass-panel" style={{
            padding: '2.5rem 3rem',
            textAlign: 'center',
            maxWidth: '420px',
            background: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
          }}>
            {checkoutStep === 'processing' && (
              <>
                <div className="spinner" style={{ margin: '0 auto 1.5rem' }}></div>
                <h3 style={{ color: 'var(--primary-color)', margin: '0 0 0.5rem 0', fontWeight: 800 }}>Connecting Payment Gateway</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Securing transaction details with Razorpay...</p>
              </>
            )}
            {checkoutStep === 'success' && (
              <>
                <div style={{ fontSize: '3.5rem', color: '#40916c', marginBottom: '1rem', animation: 'popIn 0.3s ease' }}>✓</div>
                <h3 style={{ color: 'var(--primary-color)', margin: '0 0 0.5rem 0', fontWeight: 800 }}>Payment Successful!</h3>
                <p style={{ color: 'var(--text-dark)', fontSize: '0.95rem', margin: 0 }}>Your order has been verified and placed. Check your email for details!</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Overlay background for open cart */}
      {isCartOpen && <div className="cart-backdrop" onClick={() => setIsCartOpen(false)} style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.4)',
        zIndex: 998
      }}></div>}

      <Chatbot />
    </AppContext.Provider>
  );
}
