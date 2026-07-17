import React, { useState, useEffect } from 'react';

const announcements = [
  '🚚 Free Shipping on Orders Above ₹499',
  '🎉 Get 10% OFF on Your First Order',
  '🌱 100% Natural | No Preservatives',
  '⭐ Rated 4.8/5 by 10,000+ Customers'
];

export default function AnnouncementBar() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % announcements.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="announcement-bar">
      <div className="announcement-text" key={index}>
        {announcements[index]}
      </div>
    </div>
  );
}
