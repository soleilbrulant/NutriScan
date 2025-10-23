'use client';

import { useState, useEffect } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth, googleProvider } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/ui/icons';
import { toast } from 'sonner';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { user, hasProfile, isReady, profileLoading } = useAuth();
  const router = useRouter();

  // Redirect logic - only when everything is ready
  useEffect(() => {
    if (isReady && user) {
      console.log('🔄 Redirecting user:', { hasProfile, profileLoading });
      
      if (hasProfile) {
        console.log('✅ User has profile, redirecting to home page');
        router.push('/');
      } else {
        console.log('📝 User needs profile, redirecting to onboarding');
        router.push('/onboarding');
      }
    }
  }, [isReady, user, hasProfile, router]);

  const handleGoogleSignIn = async () => {
    if (loading || !auth || !googleProvider) {
      toast.error('Authentication not available. Please check your configuration.');
      return;
    }
    
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      
      // Backend authentication is handled by AuthContext
      toast.success('Successfully signed in!');
      
    } catch (error: any) {
      console.error('Sign-in error:', error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Sign-in was cancelled');
      } else if (error.code === 'auth/popup-blocked') {
        toast.error('Popup was blocked. Please allow popups and try again.');
      } else {
        toast.error('Failed to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading while auth or profile check is in progress
  if (!isReady || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {profileLoading ? 'Checking your profile...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // Show configuration message if Firebase is not initialized
  if (!auth || !googleProvider) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Configuration Required
            </CardTitle>
            <CardDescription className="text-gray-600">
              Please configure Firebase to enable authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600">
              Check the setup guide for instructions on configuring Firebase authentication.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-emerald-100 rounded-full opacity-50 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-teal-100 rounded-full opacity-50 animate-pulse delay-1000"></div>
      </div>

      <div className="relative w-full max-w-md">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mb-4 animate-bounce">
              <Icons.apple className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Welcome to NutriScan
            </CardTitle>
            <CardDescription className="text-gray-600 text-lg">
              Track your nutrition with AI-powered food scanning
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pb-8">
            <div className="space-y-4">
              <Button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full h-12 bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 shadow-sm transition-all duration-200 hover:shadow-md group"
                variant="outline"
              >
                {loading ? (
                  <Icons.spinner className="mr-3 h-5 w-5 animate-spin" />
                ) : (
                  <Icons.google className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform" />
                )}
                {loading ? 'Signing in...' : 'Continue with Google'}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">Secure authentication</span>
                </div>
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  By continuing, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </div>

            {/* Features preview */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-100">
              <div className="text-center">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Icons.scan className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-xs text-gray-600">Scan Foods</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Icons.target className="w-4 h-4 text-teal-600" />
                </div>
                <p className="text-xs text-gray-600">Track Goals</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Icons.trendingUp className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-xs text-gray-600">Analytics</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 