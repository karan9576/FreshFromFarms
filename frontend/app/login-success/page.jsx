import { Suspense } from 'react';
import LoginSuccessClientWrapper from '../../src/components/LoginSuccessClientWrapper';

export const metadata = {
  title: 'Authentication Success | FreshFromFarms',
  description: 'Completing user login and securing session details.',
  robots: {
    index: false,
    follow: false
  }
};

export default function LoginSuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '1.2rem', backgroundColor: 'var(--bg-light)' }}>
        <div className="spinner"></div>
        <h3 style={{ color: 'var(--bg-dark)', fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>Completing login...</h3>
      </div>
    }>
      <LoginSuccessClientWrapper />
    </Suspense>
  );
}
