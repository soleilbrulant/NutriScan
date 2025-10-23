'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import Link from 'next/link';

interface ConsumptionLog {
  id: number;
  barcode: string;
  amountConsumed: number;
  calculatedCalories: number;
  calculatedProtein: number;
  calculatedCarbs: number;
  calculatedFat: number;
  calculatedSugar: number;
  consumedAt: string;
  createdAt: string;
  FoodItem: {
    barcode: string;
    name: string;
    servingSize: number;
    caloriesPer100g: number;
    carbsPer100g: number;
    proteinsPer100g: number;
    fatsPer100g: number;
    sugarsPer100g: number;
  };
}

interface RecentLogsProps {
  refreshTrigger?: number; // To trigger refresh when new food is scanned
}

export default function RecentLogs({ refreshTrigger }: RecentLogsProps) {
  const { firebaseUser } = useAuth();
  const [logs, setLogs] = useState<ConsumptionLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentLogs();
  }, [refreshTrigger]);

  const fetchRecentLogs = async () => {
    if (!firebaseUser) return;

    setLoading(true);
    try {
      const token = await firebaseUser.getIdToken();
      const today = new Date().toISOString().split('T')[0];
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/logs?date=${today}&limit=5`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.consumptionLogs || []);
      }
    } catch (error) {
      toast.error('Failed to load recent logs');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getHealthTags = (foodItem: ConsumptionLog['FoodItem'], amount: number) => {
    const tags = [];
    const ratio = amount / 100;
    
    if (foodItem.proteinsPer100g * ratio > 10) {
      tags.push({ label: 'High Protein', color: 'blue' });
    }
    if (foodItem.fatsPer100g * ratio > 15) {
      tags.push({ label: 'High Fat', color: 'orange' });
    }
    if (foodItem.carbsPer100g * ratio > 20) {
      tags.push({ label: 'High Carbs', color: 'purple' });
    }
    if (foodItem.sugarsPer100g * ratio > 15) {
      tags.push({ label: 'High Sugar', color: 'red' });
    }
    if (foodItem.caloriesPer100g * ratio < 50) {
      tags.push({ label: 'Low Calorie', color: 'green' });
    }
    
    return tags.slice(0, 2); // Limit to 2 tags
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-white/80 rounded-lg animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
        <CardContent className="p-6 text-center">
          <Icons.utensils className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            No food logged today
          </h4>
          <p className="text-gray-600 mb-4">
            Start tracking your nutrition by scanning food barcodes
          </p>
          <Button variant="outline" size="sm">
            <Icons.scan className="w-4 h-4 mr-2" />
            Scan Your First Food
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => {
        const healthTags = getHealthTags(log.FoodItem, log.amountConsumed);
        
        return (
          <Card key={log.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900 line-clamp-1">
                        {log.FoodItem.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {log.amountConsumed}g • {Math.round(log.calculatedCalories)} kcal
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {formatDate(log.consumedAt)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatTime(log.consumedAt)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Nutrition breakdown */}
                  <div className="flex items-center gap-4 text-xs text-gray-600 mb-2">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      P: {Math.round(log.calculatedProtein)}g
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      C: {Math.round(log.calculatedCarbs)}g
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      F: {Math.round(log.calculatedFat)}g
                    </span>
                  </div>

                  {/* Health tags */}
                  {healthTags.length > 0 && (
                    <div className="flex gap-1">
                      {healthTags.map((tag, index) => (
                        <Badge 
                          key={index}
                          variant="secondary" 
                          className={`text-xs px-2 py-0.5 ${
                            tag.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                            tag.color === 'orange' ? 'bg-orange-100 text-orange-700' :
                            tag.color === 'purple' ? 'bg-purple-100 text-purple-700' :
                            tag.color === 'red' ? 'bg-red-100 text-red-700' :
                            'bg-green-100 text-green-700'
                          }`}
                        >
                          {tag.label}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
      
      {logs.length >= 5 && (
        <div className="text-center pt-2">
          <Link href="/history">
            <Button variant="outline" size="sm">
              View All Logs
              <Icons.arrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
} 