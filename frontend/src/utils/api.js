export const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    const url = process.env.NEXT_PUBLIC_API_URL.trim();
    return url.endsWith('/') ? url.slice(0, -1) : url;
  }
  
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://api.freshfromfarms.shop/api';
  }
  
  return 'http://localhost:5000/api';
};
