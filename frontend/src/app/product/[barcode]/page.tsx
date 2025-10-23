'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

interface FoodData {
  barcode: string;
  name: string;
  brand?: string;
  caloriesPer100g: number;
  carbsPer100g: number;
  proteinsPer100g: number;
  fatsPer100g: number;
  sugarsPer100g: number;
  servingSize: number;
  imageUrl?: string;
}

interface ProductData {
  foodItem: FoodData;
  source: 'database' | 'openfoodfacts';
  additionalData?: {
    brand?: string;
    imageUrl?: string;
    ingredients?: string;
    categories?: string[];
  };
}

export default function ProductPage({ params }: { params: { barcode: string } }) {
  const { barcode } = params;
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [amountConsumed, setAmountConsumed] = useState<string>('100');
  const [logging, setLogging] = useState(false);

  useEffect(() => {
    fetchProductData();
  }, [barcode]);

  const fetchProductData = async () => {
    setLoading(true);
    try {
      // Fetch from your backend OpenFoodFacts service (no auth required for product lookup)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/barcode/${barcode}?autoFetch=true`);

      if (response.ok) {
        const data = await response.json();
        setProduct(data);
      } else {
        
        // Try to create a basic product entry for manual input
        setProduct({
          foodItem: {
            barcode: barcode,
            name: `Product ${barcode}`,
            caloriesPer100g: 0,
            carbsPer100g: 0,
            proteinsPer100g: 0,
            fatsPer100g: 0,
            sugarsPer100g: 0,
            servingSize: 100
          },
          source: 'manual' as any,
          additionalData: {
            brand: 'Unknown Brand'
          }
        });
      }
    } catch (error: any) {
      
      // Create a fallback product for manual entry
      setProduct({
        foodItem: {
          barcode: barcode,
          name: `Product ${barcode}`,
          caloriesPer100g: 0,
          carbsPer100g: 0,
          proteinsPer100g: 0,
          fatsPer100g: 0,
          sugarsPer100g: 0,
          servingSize: 100
        },
        source: 'manual' as any,
        additionalData: {
          brand: 'Unknown Brand'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const logConsumption = async () => {
    if (!product || !amountConsumed) {
      toast.error('Please enter the amount consumed');
      return;
    }

    const amount = parseFloat(amountConsumed);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    // Check if user is logged in for logging consumption
    if (!firebaseUser) {
      toast.error('Please log in to log food consumption');
      router.push('/login');
      return;
    }

    setLogging(true);
    try {
      console.log(`📝 Logging consumption: ${amount}g of ${product.foodItem.name}`);
      const token = await firebaseUser.getIdToken();
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/logs/scan`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          barcode: product.foodItem.barcode,
          amountConsumed: amount,
        }),
      });

      if (response.ok) {
        const logData = await response.json();
        console.log('✅ Food logged successfully:', logData);
        toast.success(`Successfully logged ${amount}g of ${product.foodItem.name}!`);
        router.push('/');
      } else {
        const error = await response.json();
        console.error('❌ Failed to log consumption:', error);
        toast.error(error.error || 'Failed to log consumption');
      }
    } catch (error: any) {
      console.error('Error logging consumption:', error);
      toast.error('Failed to log consumption. Please try again.');
    } finally {
      setLogging(false);
    }
  };

  const calculateNutrientPerServing = (per100g: number, amount: number) => {
    return Math.round((per100g * amount / 100) * 10) / 10;
  };

  const getNutrientPercentage = (nutrient: string, value: number) => {
    // Daily Value percentages based on 2000 calorie diet
    const dailyValues: { [key: string]: number } = {
      calories: 2000,
      fat: 65,
      carbs: 300,
      protein: 50,
      sugar: 50
    };
    
    return dailyValues[nutrient] ? Math.round((value / dailyValues[nutrient]) * 100) : 0;
  };

  const getHealthTags = (foodItem: FoodData, amount: number) => {
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
    
    return tags.slice(0, 3);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-emerald-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading product information...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-6">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-4">
            We couldn't find information for barcode: {barcode}
          </p>
          <Button
            onClick={() => router.push('/scan')}
            className="bg-emerald-500 hover:bg-emerald-600"
          >
            Scan Another Product
          </Button>
        </div>
      </div>
    );
  }

  const foodItem = product.foodItem;
  const amount = parseFloat(amountConsumed) || 100;
  const healthTags = getHealthTags(foodItem, amount);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="text-gray-600" size={20} />
          </Button>
          <h1 className="text-lg font-semibold">Product Details</h1>
          <div></div>
        </div>
      </header>

      {/* Content */}
      <main className="px-6 py-6 space-y-6">
        {/* Product Image */}
        <div className="flex justify-center">
          {product.additionalData?.imageUrl ? (
            <div className="w-40 h-40 rounded-lg overflow-hidden shadow-md">
              <img
                src={product.additionalData.imageUrl}
                alt={foodItem.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder-food.png';
                }}
              />
            </div>
          ) : (
            <div className="w-40 h-40 bg-gray-200 rounded-lg flex items-center justify-center">
              <div className="text-gray-400 text-center">
                <div className="text-4xl mb-2">🍽️</div>
                <p className="text-sm">No Image</p>
              </div>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{foodItem.name}</h2>
          {product.additionalData?.brand && (
            <p className="text-gray-600">{product.additionalData.brand}</p>
          )}
          <p className="text-sm text-gray-500 mt-1">Barcode: {barcode}</p>
          <div className="mt-2">
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
              product.source === 'database' ? 'bg-blue-100 text-blue-700' :
              product.source === 'openfoodfacts' ? 'bg-green-100 text-green-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              Source: {product.source === 'openfoodfacts' ? 'OpenFoodFacts' : product.source}
            </span>
          </div>
        </div>

        {/* Amount Input */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount Consumed (grams)</Label>
              <Input
                id="amount"
                type="number"
                value={amountConsumed}
                onChange={(e) => setAmountConsumed(e.target.value)}
                placeholder="Enter amount in grams"
                min="0"
                step="0.1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Calories */}
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {calculateNutrientPerServing(foodItem.caloriesPer100g, amount)}
              </div>
              <div className="text-gray-600 mb-2">Calories</div>
              <div className="text-sm text-gray-500">
                ({foodItem.caloriesPer100g} kcal per 100g)
              </div>
              <div className="w-full bg-emerald-200 rounded-full h-2 mt-4">
                <div 
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(getNutrientPercentage('calories', calculateNutrientPerServing(foodItem.caloriesPer100g, amount)), 100)}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-600 mt-2">
                {getNutrientPercentage('calories', calculateNutrientPerServing(foodItem.caloriesPer100g, amount))}% Daily Value
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nutrition Facts */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-lg text-gray-900 mb-4">Nutrition Facts</h3>
            
            {/* Protein */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Protein</span>
                <div className="text-right">
                  <span className="font-semibold">
                    {calculateNutrientPerServing(foodItem.proteinsPer100g, amount)}g
                  </span>
                  <span className="text-sm text-gray-600 ml-2">
                    {getNutrientPercentage('protein', calculateNutrientPerServing(foodItem.proteinsPer100g, amount))}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(getNutrientPercentage('protein', calculateNutrientPerServing(foodItem.proteinsPer100g, amount)), 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Carbohydrates */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Carbohydrates</span>
                <div className="text-right">
                  <span className="font-semibold">
                    {calculateNutrientPerServing(foodItem.carbsPer100g, amount)}g
                  </span>
                  <span className="text-sm text-gray-600 ml-2">
                    {getNutrientPercentage('carbs', calculateNutrientPerServing(foodItem.carbsPer100g, amount))}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-orange-200 rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(getNutrientPercentage('carbs', calculateNutrientPerServing(foodItem.carbsPer100g, amount)), 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Fat */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Fat</span>
                <div className="text-right">
                  <span className="font-semibold">
                    {calculateNutrientPerServing(foodItem.fatsPer100g, amount)}g
                  </span>
                  <span className="text-sm text-gray-600 ml-2">
                    {getNutrientPercentage('fat', calculateNutrientPerServing(foodItem.fatsPer100g, amount))}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-purple-200 rounded-full h-2">
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(getNutrientPercentage('fat', calculateNutrientPerServing(foodItem.fatsPer100g, amount)), 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Sugar */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Sugar</span>
                <div className="text-right">
                  <span className="font-semibold">
                    {calculateNutrientPerServing(foodItem.sugarsPer100g, amount)}g
                  </span>
                  <span className="text-sm text-gray-600 ml-2">
                    {getNutrientPercentage('sugar', calculateNutrientPerServing(foodItem.sugarsPer100g, amount))}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-red-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(getNutrientPercentage('sugar', calculateNutrientPerServing(foodItem.sugarsPer100g, amount)), 100)}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Product Information */}
        {product.additionalData?.ingredients && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Ingredients</h3>
              <p className="text-sm text-gray-600">{product.additionalData.ingredients}</p>
            </CardContent>
          </Card>
        )}

        {/* Health Tags */}
        {healthTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {healthTags.map((tag, index) => (
              <span 
                key={index}
                className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                  tag.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                  tag.color === 'orange' ? 'bg-orange-100 text-orange-700' :
                  tag.color === 'purple' ? 'bg-purple-100 text-purple-700' :
                  tag.color === 'red' ? 'bg-red-100 text-red-700' :
                  'bg-green-100 text-green-700'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${
                  tag.color === 'blue' ? 'bg-blue-500' :
                  tag.color === 'orange' ? 'bg-orange-500' :
                  tag.color === 'purple' ? 'bg-purple-500' :
                  tag.color === 'red' ? 'bg-red-500' :
                  'bg-green-500'
                }`}></span>
                {tag.label}
              </span>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Get Recommendations Button */}
          <Button
            onClick={() => router.push(`/recommendations?barcode=${barcode}&product=${encodeURIComponent(product.foodItem.name)}`)}
            variant="outline"
            className="w-full border-emerald-500 text-emerald-600 hover:bg-emerald-50 py-4 text-lg font-semibold"
            size="lg"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Get Health Recommendations
          </Button>

          {/* Log Consumption Button */}
          <Button
            onClick={logConsumption}
            disabled={logging || !amountConsumed || isNaN(parseFloat(amountConsumed)) || parseFloat(amountConsumed) <= 0}
            className="w-full bg-emerald-500 hover:bg-emerald-600 py-4 text-lg font-semibold"
            size="lg"
          >
            {logging ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Logging...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 mr-2" />
                Add to Daily Log
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
} 