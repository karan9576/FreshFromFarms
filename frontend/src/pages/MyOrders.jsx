import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  // Guest search form states
  const [searchOrderId, setSearchOrderId] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [guestOrders, setGuestOrders] = useState([]);
  const [guestSearchLoading, setGuestSearchLoading] = useState(false);
  const [guestError, setGuestError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/auth/my-orders`, { withCredentials: true });
        setOrders(res.data);
        setIsGuest(false);
      } catch (err) {
        // If not logged in, fall back to guest order tracking dashboard
        setIsGuest(true);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const handleGuestSearch = async (e) => {
    e.preventDefault();
    if (!searchEmail) {
      setGuestError('Please enter your Email.');
      return;
    }

    try {
      setGuestSearchLoading(true);
      setGuestError('');
      const res = await axios.post(`${API_URL}/auth/track-guest-order`, {
        orderId: searchOrderId.trim() || undefined,
        email: searchEmail.trim()
      });
      setGuestOrders(res.data);
    } catch (err) {
      console.error(err);
      setGuestOrders([]);
      setGuestError(err.response?.data?.message || 'No matching orders found. Please check your inputs.');
    } finally {
      setGuestSearchLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container" style={{ textAlign: 'center', paddingTop: '150px' }}>
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-muted)' }}>Retrieving your order logs...</p>
      </div>
    );
  }

  // Sub-component to render a single order tracking panel (timeline progress bar)
  const renderOrderCard = (order) => {
    const statusSteps = ['Paid', 'Shipped', 'Delivered'];
    const currentIdx = statusSteps.indexOf(order.status);

    return (
      <div key={order._id} className="glass-panel" style={{ padding: '2rem', marginTop: '1.5rem' }}>
        {/* Order Top Banner */}
        <div className="order-details-header">
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>ORDER REFERENCE ID</span>
            <h4 style={{ fontWeight: 800, color: 'var(--primary-color)', marginTop: '0.1rem' }}>{order._id.toUpperCase()}</h4>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Placed: {new Date(order.createdAt).toLocaleString()}</span>
          </div>
          <div className="order-details-header-amount">
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL PAID AMOUNT</span>
            <h3 style={{ fontWeight: 800, color: 'var(--bg-dark)' }}>₹{order.totalAmount}</h3>
          </div>
        </div>

        {/* Main details body */}
        <div className="order-details-grid">
          
          {/* Items list and shipping info */}
          <div>
            <h5 style={{ fontWeight: 700, color: 'var(--text-dark)', marginBottom: '0.8rem' }}>Order Items</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {order.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                  <span>{item.name} ({item.weight}) x {item.quantity}</span>
                  <span style={{ fontWeight: 600 }}>₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <h5 style={{ fontWeight: 700, color: 'var(--text-dark)', marginBottom: '0.5rem' }}>Shipping Details</h5>
            <p style={{ fontSize: '0.95rem', color: 'var(--text-dark)', lineHeight: '1.5' }}>
              <strong>Email:</strong> {order.email}<br/>
              <strong>Mobile:</strong> {order.phone}<br/>
              <strong>Address:</strong> {order.addressLine1}
              {order.addressLine2 ? `, ${order.addressLine2}` : ''}<br />
              {order.city}, {order.state} - {order.pincode}
            </p>
          </div>

          {/* Status Progress Timeline */}
          <div className="order-tracker-card">
            <h5 style={{ fontWeight: 700, color: 'var(--text-dark)', marginBottom: '1.5rem', textAlign: 'center' }}>Delivery Status Tracker</h5>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', padding: '0 1rem' }}>
              {/* Timeline connection track */}
              <div style={{ position: 'absolute', top: '15px', left: '15%', right: '15%', height: '4px', background: 'rgba(12, 56, 35, 0.1)', zIndex: 1 }}>
                <div style={{ 
                  height: '100%', 
                  background: 'var(--primary-color)', 
                  width: currentIdx === 0 ? '0%' : currentIdx === 1 ? '50%' : '100%',
                  transition: 'width 0.4s ease'
                }}></div>
              </div>

              {/* Tracker Steps */}
              {statusSteps.map((step, idx) => {
                const isDone = idx <= currentIdx;
                const isActive = idx === currentIdx;

                return (
                  <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, position: 'relative' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: isActive ? 'var(--primary-color)' : isDone ? 'var(--bg-dark)' : '#ffffff',
                      border: `2.5px solid ${isDone ? 'transparent' : 'rgba(12, 56, 35, 0.15)'}`,
                      color: isDone ? '#ffffff' : 'var(--text-muted)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      boxShadow: isDone ? '0 4px 10px rgba(12, 56, 35, 0.2)' : 'none',
                      transition: 'all 0.3s'
                    }}>
                      {isDone ? '✓' : idx + 1}
                    </div>
                    <span style={{ 
                      fontSize: '0.8rem', 
                      marginTop: '0.6rem', 
                      fontWeight: isDone ? 700 : 500,
                      color: isActive ? 'var(--primary-color)' : isDone ? 'var(--text-dark)' : 'var(--text-muted)'
                    }}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              {order.status === 'Paid' && '🎉 Order placed successfully! We are roasting your fresh foxnuts.'}
              {order.status === 'Shipped' && '🚚 In transit. Your package is on the way via our courier partner.'}
              {order.status === 'Delivered' && '🟢 Delivered! Hope you enjoy your superfood crunch.'}
            </div>

          </div>

        </div>

      </div>
    );
  };

  // 1. Render Guest tracking interface
  if (isGuest) {
    return (
      <div className="dashboard-container" style={{ maxWidth: '850px', margin: '0 auto' }}>
        <h2 style={{ fontWeight: 800, marginBottom: '0.5rem', textAlign: 'center' }}>Track Your Order</h2>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2rem' }}>
          Enter your email below to check fulfillment progress.
        </p>

        <div className="glass-panel" style={{ padding: '2rem', maxWidth: '550px', margin: '0 auto' }}>
          <h3 style={{ marginBottom: '1.5rem', fontWeight: 800 }}>Search Guest Order</h3>
          <form onSubmit={handleGuestSearch} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.4rem', display: 'block' }}>Order Reference ID (Optional)</label>
              <input 
                type="text" 
                placeholder="Enter 24-character Order ID if known" 
                value={searchOrderId} 
                onChange={e => setSearchOrderId(e.target.value)}
                style={{ padding: '0.75rem 1rem', fontSize: '0.9rem', background: '#fff', border: '1px solid var(--border-color)', borderRadius: '8px', width: '100%', outline: 'none' }} 
              />
            </div>
            
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.4rem', display: 'block' }}>Email Address*</label>
              <input 
                type="email" 
                placeholder="Enter email used during checkout" 
                value={searchEmail} 
                onChange={e => setSearchEmail(e.target.value)}
                style={{ padding: '0.75rem 1rem', fontSize: '0.9rem', background: '#fff', border: '1px solid var(--border-color)', borderRadius: '8px', width: '100%', outline: 'none' }} 
                required 
              />
            </div>

            {guestError && <p style={{ color: '#d63031', fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>{guestError}</p>}
            
            <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.8rem' }} disabled={guestSearchLoading}>
              {guestSearchLoading ? 'Searching...' : 'Track Order'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', borderTop: '1px solid rgba(12, 56, 35, 0.1)', paddingTop: '1.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Registered user? </span>
            <a href="/login" style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: 700, textDecoration: 'none' }}>Sign In with Google</a>
          </div>
        </div>

        {/* Display list of tracked guest orders if found */}
        {guestOrders && guestOrders.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ textAlign: 'center', fontWeight: 800, color: 'var(--bg-dark)' }}>
              Tracking Result ({guestOrders.length} {guestOrders.length === 1 ? 'Order' : 'Orders'})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
              {guestOrders.map(order => renderOrderCard(order))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. Render Logged-in Customer history interface
  return (
    <div className="dashboard-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ fontWeight: 800, marginBottom: '2rem', textAlign: 'center' }}>My Orders & Tracking</h2>

      {orders.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>You haven't placed any orders yet. Fresh organic foxnuts are waiting!</p>
          <a href="/" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block', marginTop: '1.5rem' }}>Shop Now</a>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {orders.map(order => renderOrderCard(order))}
        </div>
      )}
    </div>
  );
}
