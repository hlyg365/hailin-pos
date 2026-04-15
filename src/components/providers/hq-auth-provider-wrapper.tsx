'use client';

import { HqAuthProvider, useHqAuth } from '@/contexts/HqAuthContext';
import { ReactNode } from 'react';

export { useHqAuth };

export function HqAuthProviderWrapper({ children }: { children: ReactNode }) {
  return <HqAuthProvider>{children}</HqAuthProvider>;
}
