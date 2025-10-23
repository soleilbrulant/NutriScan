'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Icons } from '@/components/ui/icons';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

// Code-split heavy data-visualisation components to shrink initial JS bundle
const NutritionProgress = dynamic(() => import('@/components/NutritionProgress'), {
  ssr: false,
  loading: () => (
    <div className="h-40 flex items-center justify-center text-sm text-gray-500">Loading chart…</div>
  ),
});

const RecentLogs = dynamic(() => import('@/components/RecentLogs'), {
  ssr: false,
  loading: () => (
    <div className="h-40 flex items-center justify-center text-sm text-gray-500">Loading logs…</div>
  ),
});

export default function Home() {
  const { user, isNewUser, firebaseUser, loading, logout } = useAuth();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    // Immediate routing without waiting for isReady
    if (!loading) {
      if (!user) {
        // User not authenticated, redirect to login immediately
        router.replace('/login');
        return;
      } 
      
      if (isNewUser) {
        // New user (just created in database), redirect to onboarding immediately
        router.replace('/onboarding');
        return;
      }
    }
  }, [loading, user, isNewUser, router, firebaseUser]);

  // Refresh data when page becomes visible (user returns from scanning)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user && !isNewUser) {
        setRefreshTrigger(prev => prev + 1);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, isNewUser]);

  const handleSignOut = async () => {
    if (signingOut) return; // Prevent double-click
    
    setSigningOut(true);
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🚪 Starting sign out process...');
      }
      await logout();
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Sign out successful, waiting for cleanup...');
      }
      
      // Small delay to ensure all cleanup is complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Signed out successfully');
      router.replace('/login');
    } catch (error) {
      console.error('❌ Sign out error:', error);
      toast.error('Failed to sign out. Please try again.');
    } finally {
      setSigningOut(false);
    }
  };

  // Show minimal loading only when auth is actually loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Authenticating...</p>
        </div>
      </div>
    );
  }

  // If we reach here, user is authenticated with profile - show home content
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mr-3">
                <Icons.apple className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                NutriScan
              </h1>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="h-5 w-5" />
              </Button>
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.pictureUrl} alt={user?.name} />
                <AvatarFallback>
                  {user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                disabled={signingOut}
                className="text-gray-600 hover:text-gray-900"
              >
                {signingOut ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    Signing Out...
                  </>
                ) : (
                  'Sign Out'
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}! 👋
          </h2>
          <p className="text-gray-600">
            Here's your nutrition overview for today
          </p>
        </div>

        {/* Daily Goals with Real Data */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Today's Goals</h3>
          </div>
          
          <NutritionProgress refreshTrigger={refreshTrigger} />
        </div>

        {/* Recent Logs with Real Data */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Recent Logs</h3>
            <Link href="/history">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
          
          <RecentLogs refreshTrigger={refreshTrigger} />
        </div>
      </main>
    </div>
  );
} 