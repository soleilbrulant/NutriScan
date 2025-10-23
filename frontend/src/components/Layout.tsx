'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import BottomNavigation from './BottomNavigation';
import { Toaster } from 'sonner';

// Lazy load heavy components
const Chatbot = dynamic(() => import('./Chatbot'), {
  loading: () => (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="animate-pulse w-14 h-14 rounded-full bg-gray-200"></div>
    </div>
  ),
  ssr: false // Don't render on server
});

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const pathname = usePathname();
  const { user, isNewUser, isReady } = useAuth();
  
  // Pages where we don't want to show the bottom navigation
  const hideNavPages = ['/login', '/onboarding', '/test-auth'];
  const shouldHideNav = hideNavPages.some(page => pathname.startsWith(page));
  
  // Only show navigation when user is authenticated and not a new user, and not on special pages
  const showBottomNav = isReady && user && !isNewUser && !shouldHideNav;

  return (
    <div className={`min-h-screen bg-gray-50 ${showBottomNav ? 'pb-20' : ''}`}>
      {children}
      {showBottomNav && <BottomNavigation />}
      {/* Show chatbot only when user is authenticated and not on auth/onboarding pages */}
      {isReady && user && !shouldHideNav && <Chatbot />}
      <Toaster position="top-center" />
    </div>
  );
};

export default Layout;
