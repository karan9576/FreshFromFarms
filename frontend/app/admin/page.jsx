import AdminDashboard from '../../src/views/AdminDashboard';

export const metadata = {
  title: 'Admin Management Console | FreshFromFarms',
  description: 'Administrator dashboard for managing database stats, catalog items, and order fulfillment.',
  robots: {
    index: false,
    follow: false
  }
};

export default function AdminPage() {
  return <AdminDashboard />;
}
