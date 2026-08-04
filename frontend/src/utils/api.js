export const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    const url = process.env.NEXT_PUBLIC_API_URL.trim();
    if (url && !url.includes('localhost') && !url.includes('127.0.0.1')) {
      return url.endsWith('/') ? url.slice(0, -1) : url;
    }
  }

  // Production API default for Next.js SSR build and client runtime
  if (process.env.NODE_ENV === 'production' || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')) {
    return 'https://freshfromfarms-ly62.onrender.com/api';
  }
  
  return 'http://localhost:5000/api';
};
