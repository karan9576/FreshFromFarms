import React from 'react';

export default function Login() {
  // Point directly to the Express Passport.js redirection route.
  // This triggers the server-side OAuth callback, registers the user,
  // sets session cookies, and handles redirects.
  const backendAuthUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/google`;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: '1rem' }}>
      <div className="glass-panel" style={{ textAlign: 'center', maxWidth: '400px', width: '100%', padding: '2.5rem 2rem' }}>
        <h2 style={{ marginBottom: '1rem', fontWeight: 800, color: 'var(--bg-dark)' }}>Welcome Back</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
          Sign in using your Google account to access your customer dashboard or the admin panel.
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <a 
            href={backendAuthUrl}
            className="btn-primary" 
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
              boxShadow: '0 4px 15px rgba(207, 92, 54, 0.15)'
            }}
          >
            {/* SVG Logo for Google */}
            <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24">
              <path 
                fill="currentColor" 
                d="M12.24 10.285V13.4h6.887c-.648 2.41-2.519 4.19-5.136 4.19A5.882 5.882 0 0 1 8 11.71a5.882 5.882 0 0 1 5.99-5.885c1.49 0 2.858.55 3.92 1.455l2.427-2.427C18.6 3.327 16.42 2.225 14 2.225c-5.41 0-9.8 4.39-9.8 9.8s4.39 9.8 9.8 9.8c5.44 0 9.8-4.39 9.8-9.8 0-.665-.07-1.3-.2-1.92H12.24Z" 
              />
            </svg>
            Continue with Google
          </a>
        </div>
      </div>
    </div>
  );
}
