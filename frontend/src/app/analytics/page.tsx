'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Tooltip, Legend } from 'recharts';
import { ArrowLeft, TrendingUp, TrendingDown, Target, Calendar, Award, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DailySummary {
  date: string;
  summary: {
    totalCalories: number;
    totalCarbs: number;
    totalProteins: number;
    totalFats: number;
    totalSugars: number;
    totalItems: number;
  };
  goalComparison?: {
    calories: { consumed: number; goal: number; percentage: number; remaining: number };
    carbs: { consumed: number; goal: number; percentage: number; remaining: number };
    proteins: { consumed: number; goal: number; percentage: number; remaining: number };
    fats: { consumed: number; goal: number; percentage: number; remaining: number };
    sugars: { consumed: number; goal: number; percentage: number; remaining: number };
  };
}

interface ConsumptionLog {
  id: number;
  barcode: string;
  date: string;
  amountConsumed: number;
  calculatedCalories: number;
  calculatedCarbs: number;
  calculatedProtein: number;
  calculatedFat: number;
  calculatedSugar: number;
  createdAt: string;
  FoodItem: {
    barcode: string;
    name: string;
    servingSize: number;
  };
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const [timeframe, setTimeframe] = useState<'7days' | '30days' | '90days'>('7days');
  const [loading, setLoading] = useState(true);
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([]);
  const [recentLogs, setRecentLogs] = useState<ConsumptionLog[]>([]);
  const [todaySummary, setTodaySummary] = useState<DailySummary | null>(null);

  useEffect(() => {
    if (firebaseUser) {
      fetchAnalyticsData();
    }
  }, [firebaseUser, timeframe]);

  const fetchAnalyticsData = async () => {
    if (!firebaseUser) return;

    setLoading(true);
    try {
      const token = await firebaseUser.getIdToken();
      
      // Get date range based on timeframe
      const endDate = new Date();
      const startDate = new Date();
      const days = timeframe === '7days' ? 7 : timeframe === '30days' ? 30 : 90;
      startDate.setDate(endDate.getDate() - days);

      // Fetch daily summaries for the date range
      const summaryPromises = [];
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        summaryPromises.push(
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/logs/daily-summary/${dateStr}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }).then(res => res.ok ? res.json() : null)
        );
      }

      const summaries = (await Promise.all(summaryPromises)).filter(Boolean);
      setDailySummaries(summaries);

      // Get today's summary
      const today = new Date().toISOString().split('T')[0];
      const todayData = summaries.find(s => s.date === today);
      setTodaySummary(todayData || null);

      // Fetch recent consumption logs
      const logsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/logs?limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (logsResponse.ok) {
        const logsData = await logsResponse.json();
        setRecentLogs(logsData.consumptionLogs);
      }

    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeframeDays = () => {
    return timeframe === '7days' ? 7 : timeframe === '30days' ? 30 : 90;
  };

  const getChartData = () => {
    return dailySummaries.map(summary => ({
      date: new Date(summary.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      calories: summary.summary.totalCalories,
      protein: summary.summary.totalProteins,
      carbs: summary.summary.totalCarbs,
      fats: summary.summary.totalFats,
      items: summary.summary.totalItems
    }));
  };

  const getMacroData = () => {
    if (!todaySummary) return [];
    
    const { totalProteins, totalCarbs, totalFats } = todaySummary.summary;
    const total = totalProteins + totalCarbs + totalFats;
    
    if (total === 0) return [];

    return [
      { 
        name: 'Protein', 
        value: Math.round((totalProteins / total) * 100), 
        color: '#3b82f6',
        grams: totalProteins
      },
      { 
        name: 'Carbs', 
        value: Math.round((totalCarbs / total) * 100), 
        color: '#f59e0b',
        grams: totalCarbs
      },
      { 
        name: 'Fats', 
        value: Math.round((totalFats / total) * 100), 
        color: '#8b5cf6',
        grams: totalFats
      },
    ];
  };

  const getAverages = () => {
    if (dailySummaries.length === 0) return null;

    const totals = dailySummaries.reduce((acc, summary) => ({
      calories: acc.calories + summary.summary.totalCalories,
      protein: acc.protein + summary.summary.totalProteins,
      carbs: acc.carbs + summary.summary.totalCarbs,
      fats: acc.fats + summary.summary.totalFats,
      items: acc.items + summary.summary.totalItems
    }), { calories: 0, protein: 0, carbs: 0, fats: 0, items: 0 });

    const days = dailySummaries.length;
    return {
      calories: Math.round(totals.calories / days),
      protein: Math.round(totals.protein / days),
      carbs: Math.round(totals.carbs / days),
      fats: Math.round(totals.fats / days),
      items: Math.round(totals.items / days)
    };
  };

  const getInsights = () => {
    const insights: Array<{type: string; title: string; message: string}> = [];
    const averages = getAverages();
    
    if (!averages || !todaySummary) return insights;

    const today = todaySummary.summary;
    
    // Calorie insights
    if (today.totalCalories > averages.calories * 1.2) {
      insights.push({
        type: 'warning',
        title: 'High Calorie Day',
        message: `Today's intake (${Math.round(today.totalCalories)} cal) is 20% above your average.`
      });
    } else if (today.totalCalories < averages.calories * 0.8) {
      insights.push({
        type: 'info',
        title: 'Low Calorie Day',
        message: `Today's intake is below your average. Consider adding a healthy snack.`
      });
    }

    // Protein insights
    if (today.totalProteins < averages.protein * 0.8) {
      insights.push({
        type: 'suggestion',
        title: 'Protein Goal',
        message: `Consider adding more protein-rich foods to reach your daily target.`
      });
    }

    // Goal comparison insights
    if (todaySummary.goalComparison) {
      const { calories, proteins } = todaySummary.goalComparison;
      
      if (calories.percentage >= 100) {
        insights.push({
          type: 'success',
          title: 'Calorie Goal Achieved',
          message: `You've reached ${calories.percentage}% of your daily calorie goal!`
        });
      }
      
      if (proteins.percentage >= 100) {
        insights.push({
          type: 'success',
          title: 'Protein Goal Achieved',
          message: `Great job hitting your protein target!`
        });
      }
    }

    return insights.slice(0, 3); // Limit to 3 insights
  };

  const chartData = getChartData();
  const macroData = getMacroData();
  const averages = getAverages();
  const insights = getInsights();

  if (!firebaseUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-6">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Login Required</h2>
          <p className="text-gray-600 mb-4">Please log in to view your nutrition analytics</p>
          <Button
            onClick={() => router.push('/login')}
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="text-gray-600" size={20} />
            </Button>
            <h1 className="text-xl font-bold text-gray-900">Nutrition Analytics</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/history')}
            className="flex items-center gap-2"
          >
            <Calendar size={16} />
            History
          </Button>
        </div>
      </header>

      {/* Timeframe Selector */}
      <div className="px-6 py-4">
        <div className="flex bg-gray-100 rounded-lg p-1">
          {[
            { key: '7days', label: '7 Days' },
            { key: '30days', label: '30 Days' },
            { key: '90days', label: '90 Days' }
          ].map((period) => (
            <button
              key={period.key}
              onClick={() => setTimeframe(period.key as any)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                timeframe === period.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="px-6 pb-6 space-y-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your analytics...</p>
          </div>
        ) : (
          <>
            {/* Today's Overview */}
            {todaySummary && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-emerald-600">
                      {Math.round(todaySummary.summary.totalCalories)}
                    </div>
                    <div className="text-sm text-gray-600">Calories Today</div>
                    {todaySummary.goalComparison?.calories && (
                      <div className="text-xs text-gray-500 mt-1">
                        {todaySummary.goalComparison.calories.percentage}% of goal
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.round(todaySummary.summary.totalProteins)}g
                    </div>
                    <div className="text-sm text-gray-600">Protein</div>
                    {todaySummary.goalComparison?.proteins && (
                      <div className="text-xs text-gray-500 mt-1">
                        {todaySummary.goalComparison.proteins.percentage}% of goal
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {Math.round(todaySummary.summary.totalCarbs)}g
                    </div>
                    <div className="text-sm text-gray-600">Carbs</div>
                    {todaySummary.goalComparison?.carbs && (
                      <div className="text-xs text-gray-500 mt-1">
                        {todaySummary.goalComparison.carbs.percentage}% of goal
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round(todaySummary.summary.totalFats)}g
                    </div>
                    <div className="text-sm text-gray-600">Fats</div>
                    {todaySummary.goalComparison?.fats && (
                      <div className="text-xs text-gray-500 mt-1">
                        {todaySummary.goalComparison.fats.percentage}% of goal
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Calorie Trend Chart */}
            {chartData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="text-emerald-500" size={20} />
                    Calorie Trend ({getTimeframeDays()} days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <XAxis 
                          dataKey="date" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis hide />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px'
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="calories"
                          stroke="#10b981"
                          strokeWidth={3}
                          dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  {averages && (
                    <div className="flex justify-center mt-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{averages.calories}</div>
                        <div className="text-sm text-gray-600">Avg Daily Calories</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Macro Distribution */}
            {macroData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Today's Macro Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="h-40 w-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={macroData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                            dataKey="value"
                          >
                            {macroData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="flex-1 ml-6 space-y-3">
                      {macroData.map((macro) => (
                        <div key={macro.name} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: macro.color }}
                            ></div>
                            <span className="font-medium">{macro.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{macro.value}%</div>
                            <div className="text-sm text-gray-600">{Math.round(macro.grams)}g</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Nutrition Trends */}
            {chartData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Nutrition Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <XAxis 
                          dataKey="date" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis hide />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="protein" fill="#3b82f6" name="Protein (g)" />
                        <Bar dataKey="carbs" fill="#f59e0b" name="Carbs (g)" />
                        <Bar dataKey="fats" fill="#8b5cf6" name="Fats (g)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Insights */}
            {insights.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Insights & Recommendations</h3>
                {insights.map((insight, index) => (
                  <Card key={index} className={`border-l-4 ${
                    insight.type === 'success' ? 'border-l-green-500 bg-green-50' :
                    insight.type === 'warning' ? 'border-l-yellow-500 bg-yellow-50' :
                    insight.type === 'info' ? 'border-l-blue-500 bg-blue-50' :
                    'border-l-emerald-500 bg-emerald-50'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 ${
                          insight.type === 'success' ? 'text-green-600' :
                          insight.type === 'warning' ? 'text-yellow-600' :
                          insight.type === 'info' ? 'text-blue-600' :
                          'text-emerald-600'
                        }`}>
                          {insight.type === 'success' ? <Award size={20} /> :
                           insight.type === 'warning' ? <AlertCircle size={20} /> :
                           <Target size={20} />}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-1">{insight.title}</h4>
                          <p className="text-sm text-gray-700">{insight.message}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Empty State */}
            {chartData.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
                <p className="text-gray-600 mb-4">
                  Start logging your meals to see detailed analytics and insights
                </p>
                <Button
                  onClick={() => router.push('/scan')}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  Start Logging Food
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
} 