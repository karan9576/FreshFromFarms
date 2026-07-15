import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';

export default function Navbar({ cartCount, onCartClick, user }) {
  const backendLogoutUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/logout`;

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand text-gradient">FreshFromFarms</Link>
      <ul className="nav-links" style={{ display: 'flex', alignItems: 'center' }}>
        <li><Link to="/">Shop</Link></li>
        <li><Link to="/my-orders">Track Orders</Link></li>
        
        {user ? (
          <>
            {user.isAdmin && <li><Link to="/admin">Admin</Link></li>}
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginLeft: '0.5rem' }}>
              {user.picture && (
                <img 
                  src={user.picture} 
                  alt={user.displayName} 
                  title={user.displayName}
                  style={{ 
                    width: '30px', 
                    height: '30px', 
                    borderRadius: '50%', 
                    border: '2px solid var(--primary-color)',
                    boxShadow: '0 2px 8px rgba(12, 56, 35, 0.15)'
                  }} 
                />
              )}
              <a 
                href={backendLogoutUrl} 
                className="logout-link"
                style={{ 
                  textDecoration: 'none', 
                  color: 'var(--text-muted)', 
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  transition: 'color 0.3s'
                }}
                onMouseEnter={e => e.target.style.color = '#d63031'}
                onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
              >
                Logout
              </a>
            </li>
          </>
        ) : (
          <li><Link to="/login">Login</Link></li>
        )}
        
        <li>
          <button className="cart-nav-btn" onClick={onCartClick} style={{ marginLeft: '0.5rem' }}>
            <ShoppingBag size={20} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
        </li>
      </ul>
    </nav>
  );
}
