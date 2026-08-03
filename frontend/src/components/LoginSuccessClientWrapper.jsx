'use client';

import React from 'react';
import LoginSuccess from '../views/LoginSuccess';
import { useApp } from './AppShell';

export default function LoginSuccessClientWrapper() {
  const { setUser } = useApp();
  return <LoginSuccess setUser={setUser} />;
}
