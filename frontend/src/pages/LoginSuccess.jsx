import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

export default function LoginSuccess({ setUser }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('token', token);
      
      // Fetch user profile immediately using the token
      const fetchUser = async () => {
        try {
          const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
          const cleanApiURL = apiURL.endsWith('/') ? apiURL.slice(0, -1) : apiURL;
          const res = await axios.get(`${cleanApiURL}/auth/current_user`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(res.data);
          
          // Redirect: Admin goes to admin dashboard, regular goes to home page
          if (res.data.isAdmin) {
            navigate('/admin');
          } else {
            navigate('/');
          }
        } catch (err) {
          console.error('Error fetching user after token login:', err);
          navigate(`/login?error=token_fetch_failed&msg=${encodeURIComponent(err.response?.data?.message || err.message)}`);
        }
      };
      
      fetchUser();
    } else {
      navigate('/login?error=no_token_provided');
    }
  }, [searchParams, navigate, setUser]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '1.2rem', backgroundColor: 'var(--bg-light)' }}>
      <div className="spinner"></div>
      <h3 style={{ color: 'var(--bg-dark)', fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>Completing login...</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Securing your session details...</p>
    </div>
  );
}
