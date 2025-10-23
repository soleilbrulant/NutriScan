'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DailyGoalCard from '@/components/DailyGoalCard';

interface DailyGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface DailySummary {
  totalCalories: number;
  totalCarbs: number;
  totalProteins: number;
  totalFats: number;
  totalSugars: number;
  totalItems: number;
}

interface NutritionProgressProps {
  refreshTrigger?: number; // To trigger refresh when new food is scanned
}

export default function NutritionProgress({ refreshTrigger }: NutritionProgressProps) {
  const { firebaseUser } = useAuth();
  const [dailyGoals, setDailyGoals] = useState<DailyGoals | null>(null);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [goalsLoading, setGoalsLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);

  useEffect(() => {
    fetchDailyGoals();
    fetchDailySummary();
  }, [firebaseUser]);

  useEffect(() => {
    // Refresh summary when new food is scanned
    if (refreshTrigger !== undefined) {
      fetchDailySummary();
    }
  }, [refreshTrigger]);

  const fetchDailyGoals = async () => {
    if (!firebaseUser) return;

    setGoalsLoading(true);
    try {
      const token = await firebaseUser.getIdToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/goals`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🎯 Daily goals fetched:', data.dailyGoal);
        setDailyGoals({
          calories: data.dailyGoal.targetCalories,
          protein: data.dailyGoal.targetProtein,
          carbs: data.dailyGoal.targetCarbs,
          fat: data.dailyGoal.targetFat
        });
      } else {
        console.error('❌ Failed to fetch daily goals:', response.status);
      }
    } catch (error) {
      console.error('Error fetching daily goals:', error);
    } finally {
      setGoalsLoading(false);
    }
  };

  const fetchDailySummary = async () => {
    if (!firebaseUser) return;

    setSummaryLoading(true);
    try {
      const token = await firebaseUser.getIdToken();
      const today = new Date().toISOString().split('T')[0];
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/logs/daily-summary/${today}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📊 Daily summary fetched:', data);
        setDailySummary(data.summary);
      } else {
        console.error('❌ Failed to fetch daily summary:', response.status);
        // Set empty summary if no data found
        setDailySummary({
          totalCalories: 0,
          totalCarbs: 0,
          totalProteins: 0,
          totalFats: 0,
          totalSugars: 0,
          totalItems: 0
        });
      }
    } catch (error) {
      console.error('Error fetching daily summary:', error);
      // Set empty summary on error
      setDailySummary({
        totalCalories: 0,
        totalCarbs: 0,
        totalProteins: 0,
        totalFats: 0,
        totalSugars: 0,
        totalItems: 0
      });
    } finally {
      setSummaryLoading(false);
    }
  };

  const isLoading = goalsLoading || summaryLoading;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-white/80 rounded-lg animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (!dailyGoals) {
    return (
      <div className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-lg p-6 text-center">
        <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4" />
        <h4 className="text-lg font-medium text-gray-900 mb-2">
          Daily goals not available
        </h4>
        <p className="text-gray-600 mb-4">
          We're having trouble loading your daily nutrition goals
        </p>
        <button 
          onClick={fetchDailyGoals}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <DailyGoalCard
        title="Calories"
        current={dailySummary?.totalCalories || 0}
        target={dailyGoals.calories}
        unit="kcal"
        color="emerald"
      />
      <DailyGoalCard
        title="Protein"
        current={dailySummary?.totalProteins || 0}
        target={dailyGoals.protein}
        unit="g"
        color="blue"
      />
      <DailyGoalCard
        title="Carbs"
        current={dailySummary?.totalCarbs || 0}
        target={dailyGoals.carbs}
        unit="g"
        color="orange"
      />
      <DailyGoalCard
        title="Fat"
        current={dailySummary?.totalFats || 0}
        target={dailyGoals.fat}
        unit="g"
        color="purple"
      />
    </div>
  );
} 