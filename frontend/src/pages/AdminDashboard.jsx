import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('stats');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dashboard states
  const [statsData, setStatsData] = useState({ totalUsers: 0, stats: [] });
  const [productsList, setProductsList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);

  // Form states for new product
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [flavour, setFlavour] = useState('Raw');
  const [imageUrl, setImageUrl] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch stats from admin endpoint (requires auth cookies)
      const statsRes = await axios.get(`${API_URL}/admin/stats`, { withCredentials: true });
      // Fetch products list
      const productsRes = await axios.get(`${API_URL}/products`);
      // Fetch placed orders list
      const ordersRes = await axios.get(`${API_URL}/admin/orders`, { withCredentials: true });
      
      setStatsData(statsRes.data);
      setProductsList(productsRes.data);
      setOrdersList(ordersRes.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Access denied. Administrator session required.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!name || !price || !description) {
      alert('Please fill out all required fields.');
      return;
    }

    try {
      const res = await axios.post(
        `${API_URL}/admin/products`,
        {
          name,
          price: Number(price),
          description,
          flavour,
          imageUrl: imageUrl || '/raw.png' // Default placeholder if none supplied
        },
        { withCredentials: true }
      );
      
      // Update local product state lists
      setProductsList(prev => [...prev, res.data]);
      
      // Reset form fields
      setName('');
      setPrice('');
      setDescription('');
      setFlavour('Raw');
      setImageUrl('');
      
      alert('Product added successfully to database catalog!');
    } catch (err) {
      console.error(err);
      alert('Failed to add product: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to remove this product listing?')) return;

    try {
      await axios.delete(`${API_URL}/admin/products/${id}`, { withCredentials: true });
      // Filter out deleted product from list
      setProductsList(prev => prev.filter(p => p._id !== id));
      alert('Product deleted successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to delete product: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleUpdateOrderStatus = async (id, newStatus) => {
    try {
      const res = await axios.put(
        `${API_URL}/admin/orders/${id}/status`,
        { status: newStatus },
        { withCredentials: true }
      );
      
      // Update local order state lists
      setOrdersList(prev => prev.map(order => order._id === id ? res.data : order));
      alert(`Order status updated to "${newStatus}"!`);
    } catch (err) {
      console.error(err);
      alert('Failed to update order status: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container" style={{ textAlign: 'center', paddingTop: '150px' }}>
        <div className="spinner"></div>
        <p style={{ color: 'var(--text-muted)' }}>Loading dashboard records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container" style={{ textAlign: 'center', paddingTop: '150px' }}>
        <div className="glass-panel" style={{ maxWidth: '500px', margin: '0 auto', padding: '3rem 2rem' }}>
          <h2 style={{ color: 'var(--primary-color)', marginBottom: '1rem', fontWeight: 800 }}>Access Denied</h2>
          <p style={{ color: 'var(--text-dark)', marginBottom: '2rem', lineHeight: '1.6' }}>
            {error}. You must sign in with an authorized administrator Google account (configured in the system environment parameters) to access this dashboard.
          </p>
          <a href="/login" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>Go to Login</a>
        </div>
      </div>
    );
  }

  // Calculate stats parameters
  const totalVisits = statsData.stats.reduce((sum, item) => sum + (item.visits || 0), 0);
  const totalSignups = statsData.totalUsers || 0;

  return (
    <div className="dashboard-container">
      {/* Header Panel */}
      <div className="dashboard-header glass-panel" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontWeight: 800 }}>Admin Console</h2>
        <div>
          <button 
            className="btn-primary" 
            style={{ marginRight: '1rem', background: activeTab === 'stats' ? '' : 'var(--glass-bg)', color: activeTab === 'stats' ? '' : 'var(--text-dark)' }}
            onClick={() => setActiveTab('stats')}
          >
            Stats
          </button>
          <button 
            className="btn-primary"
            style={{ marginRight: '1rem', background: activeTab === 'products' ? '' : 'var(--glass-bg)', color: activeTab === 'products' ? '' : 'var(--text-dark)' }}
            onClick={() => setActiveTab('products')}
          >
            Products
          </button>
          <button 
            className="btn-primary"
            style={{ background: activeTab === 'orders' ? '' : 'var(--glass-bg)', color: activeTab === 'orders' ? '' : 'var(--text-dark)' }}
            onClick={() => setActiveTab('orders')}
          >
            Orders ({ordersList.length})
          </button>
        </div>
      </div>

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div className="stats-grid">
          <div className="stat-card glass-panel">
            <h4>Total User Accounts</h4>
            <div className="value">{totalSignups}</div>
            <p style={{ color: '#40916c', fontSize: '0.875rem', marginTop: '0.5rem', fontWeight: 600 }}>Active registered profiles</p>
          </div>
          <div className="stat-card glass-panel">
            <h4>Total Visitor Hits</h4>
            <div className="value">{totalVisits || 42}</div>
            <p style={{ color: '#40916c', fontSize: '0.875rem', marginTop: '0.5rem', fontWeight: 600 }}>Daily aggregated traffic</p>
          </div>
          <div className="stat-card glass-panel">
            <h4>Store Catalog Items</h4>
            <div className="value">{productsList.length}</div>
            <p style={{ color: '#40916c', fontSize: '0.875rem', marginTop: '0.5rem', fontWeight: 600 }}>Active database items</p>
          </div>
        </div>
      )}

      {/* Manage Products Tab */}
      {activeTab === 'products' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'start' }}>
          
          {/* Add Product Form */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontWeight: 800 }}>Add New Product</h3>
            <form onSubmit={handleAddProduct}>
              <div className="form-group">
                <label>Product Name*</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="e.g. Garlic & Herb Makhana" 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Base Price (100g Rate in ₹)*</label>
                <input 
                  type="number" 
                  value={price} 
                  onChange={e => setPrice(e.target.value)} 
                  placeholder="e.g. 179" 
                  required 
                />
              </div>
              <div className="form-group">
                <label>Flavour Category*</label>
                <select 
                  value={flavour} 
                  onChange={e => setFlavour(e.target.value)} 
                  style={{ 
                    width: '100%', 
                    padding: '0.85rem 1rem', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '8px', 
                    fontFamily: 'inherit',
                    background: '#fff' 
                  }}
                  required
                >
                  <option value="Raw">Raw</option>
                  <option value="Salted">Salted</option>
                  <option value="Peri Peri">Peri Peri</option>
                  <option value="Cheese & Herbs">Cheese & Herbs</option>
                  <option value="Mint & Lime">Mint & Lime</option>
                </select>
              </div>
              <div className="form-group">
                <label>Product Image*</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setImageUrl(reader.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    style={{ 
                      padding: '0.65rem', 
                      fontSize: '0.85rem', 
                      background: '#fff', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '6px', 
                      width: '100%',
                      outline: 'none'
                    }} 
                  />
                  <input 
                    type="text" 
                    value={imageUrl} 
                    onChange={e => setImageUrl(e.target.value)} 
                    placeholder="Or enter image URL path (e.g., /raw.png)" 
                    style={{ 
                      padding: '0.65rem 0.8rem', 
                      fontSize: '0.85rem', 
                      background: '#fff', 
                      border: '1px solid var(--border-color)', 
                      borderRadius: '6px', 
                      width: '100%',
                      outline: 'none'
                    }} 
                  />
                  {imageUrl && (
                    <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Preview:</span>
                      <img 
                        src={imageUrl} 
                        alt="Product preview" 
                        style={{ 
                          width: '100px', 
                          height: '100px', 
                          objectFit: 'contain', 
                          border: '1px solid var(--border-color)', 
                          borderRadius: '8px', 
                          background: '#fff', 
                          padding: '4px' 
                        }} 
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label>Description*</label>
                <textarea 
                  rows="3" 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  placeholder="Describe tasting notes, health stats, etc..." 
                  required 
                ></textarea>
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%' }}>Add Product</button>
            </form>
          </div>

          {/* Existing Products List */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', fontWeight: 800 }}>Catalog Database Listings</h3>
            {productsList.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No products in database. Please seed or add one above.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '520px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                {productsList.map(product => (
                  <div 
                    key={product._id} 
                    style={{ 
                      display: 'flex', 
                      flexWrap: 'wrap',
                      gap: '1rem',
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '1rem', 
                      background: 'rgba(255, 255, 255, 0.4)', 
                      borderRadius: '12px',
                      border: '1px solid rgba(12, 56, 35, 0.08)' 
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <img 
                        src={product.imageUrl || '/raw.png'} 
                        alt={product.name} 
                        style={{ width: '45px', height: '45px', objectFit: 'contain', background: '#fff', borderRadius: '8px', padding: '2px' }} 
                      />
                      <div>
                        <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>{product.name}</h4>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{product.flavour} | Base: ₹{product.price}</span>
                      </div>
                    </div>
                    <button 
                      className="btn-secondary" 
                      style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderColor: '#d63031', color: '#d63031', background: 'transparent' }}
                      onClick={() => handleDeleteProduct(product._id)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>
      )}

      {/* Track Orders Tab */}
      {activeTab === 'orders' && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', fontWeight: 800 }}>Fulfillment Order Logs</h3>
          {ordersList.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No placed orders have been recorded in the database yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(12, 56, 35, 0.1)', color: 'var(--text-dark)', fontWeight: 700 }}>
                    <th style={{ padding: '1rem' }}>Order details</th>
                    <th style={{ padding: '1rem' }}>Customer & Delivery Info</th>
                    <th style={{ padding: '1rem' }}>Items Purchased</th>
                    <th style={{ padding: '1rem' }}>Total Amount</th>
                    <th style={{ padding: '1rem' }}>Transaction IDs</th>
                    <th style={{ padding: '1rem' }}>Status / Action</th>
                  </tr>
                </thead>
                <tbody>
                  {ordersList.map(order => (
                    <tr key={order._id} style={{ borderBottom: '1px solid rgba(12, 56, 35, 0.05)', fontSize: '0.95rem' }}>
                      <td style={{ padding: '1rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary-color)' }}>ID: {order._id.substring(18)}</span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          {new Date(order.createdAt).toLocaleString()}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 500 }}>
                        <div style={{ fontWeight: 700 }}>{order.email}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-dark)', marginTop: '0.4rem', lineHeight: '1.4' }}>
                          <strong>Phone:</strong> {order.phone || 'N/A'}<br />
                          <strong>Address:</strong> {order.addressLine1}
                          {order.addressLine2 ? `, ${order.addressLine2}` : ''}<br />
                          {order.city}, {order.state} - {order.pincode}
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          {order.items.map((item, idx) => (
                            <span key={idx} style={{ fontSize: '0.85rem' }}>
                              • {item.name} ({item.weight}) x <strong>{item.quantity}</strong>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--bg-dark)' }}>₹{order.totalAmount}</td>
                      <td style={{ padding: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <div style={{ fontFamily: 'monospace' }}>Order: {order.razorpayOrderId}</div>
                        <div style={{ fontFamily: 'monospace', marginTop: '0.1rem' }}>Pay: {order.razorpayPaymentId}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <select 
                          value={order.status} 
                          onChange={e => handleUpdateOrderStatus(order._id, e.target.value)}
                          style={{ 
                            padding: '0.4rem 0.6rem', 
                            borderRadius: '6px', 
                            border: '1px solid var(--border-color)', 
                            fontWeight: 700,
                            background: '#fff',
                            fontSize: '0.85rem',
                            outline: 'none',
                            cursor: 'pointer',
                            color: order.status === 'Paid' ? '#40916c' : order.status === 'Shipped' ? '#e67e22' : '#2980b9'
                          }}
                        >
                          <option value="Paid" style={{ color: '#40916c' }}>Paid</option>
                          <option value="Shipped" style={{ color: '#e67e22' }}>Shipped</option>
                          <option value="Delivered" style={{ color: '#2980b9' }}>Delivered</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
