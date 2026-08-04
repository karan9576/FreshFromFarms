import MyOrders from '../../src/views/MyOrders';

export const metadata = {
  title: 'Track Orders & Delivery Status | FreshFromFarms',
  description: 'Track your organic Makhana orders in real-time. Registered users and guests can verify order fulfillment, payment verification, and delivery timelines.',
  alternates: {
    canonical: 'https://freshfromfarms.shop/my-orders',
  }
};

export default function MyOrdersPage() {
  return <MyOrders />;
}
