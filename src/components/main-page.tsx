'use client';

import { UserProvider } from '@/components/providers/user-provider';
import { MainLayout } from '@/components/layout/main-layout';

export default function MainPage() {
  return (
    <UserProvider>
      <MainLayout />
    </UserProvider>
  );
}
