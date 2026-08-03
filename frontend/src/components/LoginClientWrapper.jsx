'use client';

import React from 'react';
import Login from '../views/Login';
import { useApp } from './AppShell';

export default function LoginClientWrapper() {
  const { setUser } = useApp();
  return <Login setUser={setUser} />;
}
