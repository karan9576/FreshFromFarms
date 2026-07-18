import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Login({ setUser }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const errorType = searchParams.get('error');
  const errorMsg = searchParams.get('msg');

  // Local form state
  const [isSignUp, setIsSignUp] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const cleanApiURL = apiURL.endsWith('/') ? apiURL.slice(0, -1) : apiURL;
  const backendAuthUrl = `${cleanApiURL}/auth/google`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setLoading(true);

    if (isSignUp) {
      if (!displayName || !email || !password || !confirmPassword) {
        setLocalError('All fields are required.');
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setLocalError('Passwords do not match.');
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setLocalError('Password must be at least 6 characters.');
        setLoading(false);
        return;
      }

      try {
        const res = await axios.post(`${cleanApiURL}/auth/register`, {
          displayName: displayName.trim(),
          email: email.trim(),
          password
        });
        
        localStorage.setItem('token', res.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        if (setUser) setUser(res.data.user);
        
        if (res.data.user.isAdmin) {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } catch (err) {
        setLocalError(err.response?.data?.message || 'Registration failed. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      if (!email || !password) {
        setLocalError('Email and password are required.');
        setLoading(false);
        return;
      }

      try {
        const res = await axios.post(`${cleanApiURL}/auth/login`, {
          email: email.trim(),
          password
        });

        localStorage.setItem('token', res.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        if (setUser) setUser(res.data.user);

        if (res.data.user.isAdmin) {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } catch (err) {
        setLocalError(err.response?.data?.message || 'Invalid email or password.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '140px 1rem 80px', boxSizing: 'border-box' }}>
      <div className="glass-panel" style={{ maxWidth: '450px', width: '100%', padding: '2.5rem 2rem', boxSizing: 'border-box' }}>
        <h2 style={{ marginBottom: '0.5rem', fontWeight: 800, color: 'var(--bg-dark)', textAlign: 'center' }}>
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem', textAlign: 'center', lineHeight: '1.4' }}>
          {isSignUp 
            ? 'Sign up to shop Indian foxnuts and track checkout progress.' 
            : 'Sign in to access your customer dashboard or admin panel.'}
        </p>
        
        {(errorType || localError) && (
          <div style={{ 
            backgroundColor: 'rgba(231, 76, 60, 0.1)', 
            border: '1px solid rgba(231, 76, 60, 0.2)', 
            borderRadius: '12px', 
            padding: '0.8rem 1rem', 
            marginBottom: '1.5rem', 
            fontSize: '0.85rem'
          }}>
            <p style={{ color: '#e74c3c', fontWeight: 700, margin: 0 }}>
              {localError ? 'Error Occurred' : 'Authentication Failed'}
            </p>
            <p style={{ color: 'var(--text-dark)', margin: '0.2rem 0 0', opacity: 0.85 }}>
              {localError || (
                <>
                  {errorType === 'no_token_provided' && 'No login session token returned.'}
                  {errorType === 'token_fetch_failed' && `Unable to fetch user profile: ${errorMsg || 'Unknown error'}`}
                  {errorType === 'auth_failed' && 'Google OAuth authentication failed.'}
                </>
              )}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {isSignUp && (
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', display: 'block', color: 'var(--text-dark)' }}>Full Name*</label>
              <input 
                type="text" 
                placeholder="Enter your full name" 
                value={displayName} 
                onChange={e => setDisplayName(e.target.value)}
                style={{ padding: '0.75rem 1rem', fontSize: '0.9rem', background: '#fff', border: '1px solid var(--border-color)', borderRadius: '8px', width: '100%', outline: 'none', boxSizing: 'border-box' }}
                required 
              />
            </div>
          )}

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', display: 'block', color: 'var(--text-dark)' }}>Email Address*</label>
            <input 
              type="email" 
              placeholder="Enter your email" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              style={{ padding: '0.75rem 1rem', fontSize: '0.9rem', background: '#fff', border: '1px solid var(--border-color)', borderRadius: '8px', width: '100%', outline: 'none', boxSizing: 'border-box' }}
              required 
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', display: 'block', color: 'var(--text-dark)' }}>Password*</label>
            <input 
              type="password" 
              placeholder="Enter password (min 6 chars)" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              style={{ padding: '0.75rem 1rem', fontSize: '0.9rem', background: '#fff', border: '1px solid var(--border-color)', borderRadius: '8px', width: '100%', outline: 'none', boxSizing: 'border-box' }}
              required 
            />
          </div>

          {isSignUp && (
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem', display: 'block', color: 'var(--text-dark)' }}>Confirm Password*</label>
              <input 
                type="password" 
                placeholder="Re-enter password" 
                value={confirmPassword} 
                onChange={e => setConfirmPassword(e.target.value)}
                style={{ padding: '0.75rem 1rem', fontSize: '0.9rem', background: '#fff', border: '1px solid var(--border-color)', borderRadius: '8px', width: '100%', outline: 'none', boxSizing: 'border-box' }}
                required 
              />
            </div>
          )}

          <button 
            type="submit" 
            className="btn-primary" 
            style={{ width: '100%', padding: '0.85rem', borderRadius: '50px', fontWeight: 700 }}
            disabled={loading}
          >
            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0', color: 'var(--text-muted)' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(12, 56, 35, 0.1)' }}></div>
          <span style={{ padding: '0 1rem', fontSize: '0.8rem', fontWeight: 600 }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(12, 56, 35, 0.1)' }}></div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <a 
            href={backendAuthUrl}
            className="btn-secondary" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '0.8rem', 
              textDecoration: 'none',
              width: '100%',
              borderRadius: '50px',
              padding: '0.85rem',
              fontWeight: 700,
              color: 'var(--bg-dark)',
              border: '1px solid rgba(12, 56, 35, 0.15)',
              background: 'transparent',
              boxShadow: 'none',
              transition: 'var(--transition)'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(12, 56, 35, 0.04)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24">
              <path 
                fill="#ea4335" 
                d="M12.24 10.285V13.4h6.887c-.648 2.41-2.519 4.19-5.136 4.19A5.882 5.882 0 0 1 8 11.71a5.882 5.882 0 0 1 5.99-5.885c1.49 0 2.858.55 3.92 1.455l2.427-2.427C18.6 3.327 16.42 2.225 14 2.225c-5.41 0-9.8 4.39-9.8 9.8s4.39 9.8 9.8 9.8c5.44 0 9.8-4.39 9.8-9.8 0-.665-.07-1.3-.2-1.92H12.24Z" 
              />
            </svg>
            Continue with Google
          </a>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <button 
            type="button" 
            onClick={() => { setIsSignUp(!isSignUp); setLocalError(''); }}
            style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: 700, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
          >
            {isSignUp ? 'Sign In' : 'Sign Up Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
