import React from 'react';

// Product Card Skeleton
export const ProductCardSkeleton = () => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-pulse">
    <div className="flex items-center space-x-3">
      <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
      <div className="w-4 h-4 bg-gray-200 rounded"></div>
    </div>
  </div>
);

// Nutrition Progress Skeleton
export const NutritionProgressSkeleton = () => (
  <div className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
    <div className="h-6 bg-gray-200 rounded mb-4 w-1/2"></div>
    <div className="space-y-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i}>
          <div className="flex justify-between mb-2">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="h-2 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  </div>
);

// Daily Goal Card Skeleton
export const DailyGoalCardSkeleton = () => (
  <div className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
    <div className="text-center">
      <div className="h-8 bg-gray-200 rounded mb-2 w-24 mx-auto"></div>
      <div className="h-4 bg-gray-200 rounded mb-4 w-16 mx-auto"></div>
      <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto"></div>
    </div>
  </div>
);

// Recent Logs Skeleton
export const RecentLogsSkeleton = () => (
  <div className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
    <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
    <div className="space-y-3">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
            <div>
              <div className="h-4 bg-gray-200 rounded mb-1 w-24"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-12"></div>
        </div>
      ))}
    </div>
  </div>
);

// Chatbot Skeleton (for loading state)
export const ChatbotSkeleton = () => (
  <div className="fixed bottom-4 right-4 z-50">
    <div className="animate-pulse w-14 h-14 rounded-full bg-gray-200 shadow-lg"></div>
  </div>
);