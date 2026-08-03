'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ShoppingBag, Menu, X, ChevronDown, LogOut, Shield, ClipboardList, User, LogIn } from 'lucide-react';
import { getApiUrl } from '../utils/api';

export default function Navbar({ cartCount, onCartClick, user, setUser, authLoading }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();

  const cleanApiURL = getApiUrl();
  const backendLogoutUrl = `${cleanApiURL}/auth/logout`;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    if (setUser) setUser(null);
    // Navigate to backend logout to clear any server-side cookies
    window.location.href = backendLogoutUrl;
  };

  return (
    <nav className="navbar">
      <Link href="/" className="nav-brand text-gradient">FreshFromFarms</Link>
      
      {/* Mobile action buttons (Cart + Hamburger) */}
      <div className="mobile-actions">
        <button className="cart-nav-btn" onClick={onCartClick} aria-label="Open Cart">
          <ShoppingBag size={22} />
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </button>
        <button 
          className="mobile-menu-toggle" 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle Navigation Menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Navigation Links */}
      <ul className={`nav-links ${isMobileMenuOpen ? 'active' : ''}`}>
        <li>
          <Link href="/" className={pathname === '/' ? 'active-link' : ''}>Shop</Link>
        </li>
        <li>
          <Link href="/my-orders" className={pathname === '/my-orders' ? 'active-link' : ''}>Track Orders</Link>
        </li>
        <li>
          <a href="/#contact" onClick={(e) => {
            if (pathname === '/') {
              e.preventDefault();
              document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
            }
          }}>Contact Us</a>
        </li>

        {/* Profile / Login */}
        {authLoading ? (
          <li style={{ display: 'inline-flex', alignItems: 'center', minWidth: '85px', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', opacity: 0.6 }}>Loading...</span>
          </li>
        ) : user ? (
          <>
            {/* Show Admin separately on mobile so it's easily accessible */}
            {user.isAdmin && (
              <li className="mobile-only-link">
                <Link href="/admin" className={pathname === '/admin' ? 'active-link' : ''}>Admin Dashboard</Link>
              </li>
            )}
            
            {/* Profile Dropdown (Desktop) / User info group (Mobile) */}
            <li className="profile-menu-item" ref={dropdownRef}>
              <div 
                className="profile-trigger" 
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              >
                {user.picture ? (
                  <img 
                    src={user.picture} 
                    alt={user.displayName || 'User'} 
                    className="profile-avatar"
                  />
                ) : (
                  <div className="profile-avatar-fallback">
                    <User size={16} />
                  </div>
                )}
                <span className="profile-name">{user.displayName}</span>
                <ChevronDown size={14} className={`chevron-icon ${isProfileDropdownOpen ? 'open' : ''}`} />
              </div>

              {/* Profile Dropdown Panel */}
              <div className={`profile-dropdown ${isProfileDropdownOpen ? 'show' : ''}`}>
                <div className="dropdown-user-info">
                  <p className="user-name">{user.displayName}</p>
                  <p className="user-email">{user.email}</p>
                </div>
                
                <hr className="dropdown-divider" />
                
                {user.isAdmin && (
                  <Link href="/admin" className="dropdown-item admin-item" onClick={() => setIsProfileDropdownOpen(false)}>
                    <Shield size={16} />
                    <span>Admin Panel</span>
                  </Link>
                )}

                <Link href="/my-orders" className="dropdown-item" onClick={() => setIsProfileDropdownOpen(false)}>
                  <ClipboardList size={16} />
                  <span>My Orders</span>
                </Link>

                <hr className="dropdown-divider" />

                <a href={backendLogoutUrl} className="dropdown-item logout-item" onClick={handleLogout}>
                  <LogOut size={16} />
                  <span>Logout</span>
                </a>
              </div>
            </li>
            
            {/* Mobile-only Logout */}
            <li className="mobile-only-link">
              <a href={backendLogoutUrl} className="logout-btn-mobile" onClick={handleLogout}>
                <LogOut size={18} />
                <span>Logout</span>
              </a>
            </li>
          </>
        ) : (
          <li>
            <Link href="/login" className="login-btn-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <LogIn size={15} />
              <span>Login</span>
            </Link>
          </li>
        )}

        {/* Desktop Cart Button */}
        <li className="desktop-cart-li">
          <button className="cart-nav-btn" onClick={onCartClick} aria-label="Open Cart">
            <ShoppingBag size={22} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
        </li>
      </ul>
      
      {/* Mobile Drawer Overlay background */}
      {isMobileMenuOpen && <div className="mobile-menu-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>}
    </nav>
  );
}
