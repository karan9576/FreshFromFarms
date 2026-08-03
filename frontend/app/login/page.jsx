import { Suspense } from 'react';
import LoginClientWrapper from '../../src/components/LoginClientWrapper';

export const metadata = {
  title: 'Sign In / Register | FreshFromFarms',
  description: 'Log in or sign up to your FreshFromFarms account to track orders, manage addresses, and access exclusive organic Makhana harvest offers.',
  alternates: {
    canonical: 'https://freshfromfarms.com/login',
  }
};

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="dashboard-container" style={{ textAlign: 'center', paddingTop: '150px' }}>
        <div className="spinner"></div>
      </div>
    }>
      <LoginClientWrapper />
    </Suspense>
  );
}
