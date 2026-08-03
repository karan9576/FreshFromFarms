'use client';

import React from 'react';
import Home from '../views/Home';
import { useApp } from './AppShell';

export default function HomeClientWrapper() {
  const { addToCart, cart, updateQuantity } = useApp();
  return <Home addToCart={addToCart} cart={cart} updateQuantity={updateQuantity} />;
}
