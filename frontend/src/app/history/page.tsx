'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Calendar, Utensils, TrendingUp, Filter } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

interface FoodItem {
  barcode: string;
  name: string;
  servingSize: number;
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
  FoodItem: FoodItem;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export default function HistoryPage() {
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const [logs, setLogs] = useState<ConsumptionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  });

  useEffect(() => {
    if (firebaseUser) {
      fetchConsumptionLogs();
    }
  }, [firebaseUser, selectedDate]);

  const fetchConsumptionLogs = async (page = 1) => {
    if (!firebaseUser) return;

    setLoading(true);
    try {
      const token = await firebaseUser.getIdToken();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });
      
      if (selectedDate) {
        params.append('date', selectedDate);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/logs?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.consumptionLogs);
        setPagination(data.pagination);
      } else {
        console.error('Failed to fetch consumption logs');
        setLogs([]);
      }
    } catch (error) {
      console.error('Error fetching consumption logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log =>
    log.FoodItem.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalCaloriesForDay = (date: string) => {
    return logs
      .filter(log => log.date === date)
      .reduce((total, log) => total + log.calculatedCalories, 0);
  };

  const groupLogsByDate = (logs: ConsumptionLog[]) => {
    const grouped: { [key: string]: ConsumptionLog[] } = {};
    logs.forEach(log => {
      if (!grouped[log.date]) {
        grouped[log.date] = [];
      }
      grouped[log.date].push(log);
    });
    return grouped;
  };

  const groupedLogs = groupLogsByDate(filteredLogs);

  if (!firebaseUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-6">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Login Required</h2>
          <p className="text-gray-600 mb-4">Please log in to view your nutrition history</p>
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
          <h1 className="text-xl font-bold text-gray-900">Nutrition History</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/analytics')}
            className="flex items-center gap-2"
          >
            <TrendingUp size={16} />
            Analytics
          </Button>
        </div>
      </header>

      {/* Filters */}
      <div className="px-6 py-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            type="text"
            placeholder="Search foods..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Date Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-10"
            />
          </div>
          {selectedDate && (
            <Button
              variant="outline"
              onClick={() => setSelectedDate('')}
              className="px-3"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <main className="px-6 pb-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your nutrition history...</p>
          </div>
        ) : Object.keys(groupedLogs).length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📱</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {selectedDate ? 'No foods logged for this date' : 'No nutrition history yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {selectedDate ? 'Try selecting a different date or clear the filter' : 'Start scanning and logging foods to build your history'}
            </p>
            <Button
              onClick={() => router.push('/scan')}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              <Utensils className="w-4 h-4 mr-2" />
              Start Logging Food
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedLogs)
              .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
              .map(([date, dayLogs]) => {
                const totalCalories = dayLogs.reduce((sum, log) => sum + log.calculatedCalories, 0);
                
                return (
                  <div key={date} className="space-y-3">
                    {/* Date Header */}
                    <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm">
                      <div>
                        <h3 className="font-semibold text-gray-900">{formatDate(date)}</h3>
                        <p className="text-sm text-gray-600">{dayLogs.length} items logged</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-emerald-600">
                          {Math.round(totalCalories)} cal
                        </div>
                        <p className="text-sm text-gray-600">Total</p>
                      </div>
                    </div>

                    {/* Food Items */}
                    <div className="space-y-2">
                      {dayLogs
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((log) => (
                          <Card key={log.id} className="hover:shadow-md transition-shadow cursor-pointer">
                            <CardContent 
                              className="p-4"
                              onClick={() => router.push(`/product/${log.barcode}`)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900 mb-1">
                                    {log.FoodItem.name}
                                  </h4>
                                  <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <span>{log.amountConsumed}g</span>
                                    <span>•</span>
                                    <span>{formatTime(log.createdAt)}</span>
                                  </div>
                                  
                                  {/* Nutrition Summary */}
                                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                    <span>P: {Math.round(log.calculatedProtein)}g</span>
                                    <span>C: {Math.round(log.calculatedCarbs)}g</span>
                                    <span>F: {Math.round(log.calculatedFat)}g</span>
                                    {log.calculatedSugar > 0 && (
                                      <span>S: {Math.round(log.calculatedSugar)}g</span>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="text-right">
                                  <div className="text-lg font-semibold text-gray-900">
                                    {Math.round(log.calculatedCalories)}
                                  </div>
                                  <div className="text-sm text-gray-600">cal</div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </div>
                );
              })}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm">
                <div className="text-sm text-gray-600">
                  Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                  {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                  {pagination.totalItems} entries
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.currentPage === 1}
                    onClick={() => fetchConsumptionLogs(pagination.currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.currentPage === pagination.totalPages}
                    onClick={() => fetchConsumptionLogs(pagination.currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
} 