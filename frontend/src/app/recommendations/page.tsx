'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2, Heart, AlertTriangle, CheckCircle, TrendingUp, Sparkles, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import ProductCard from '@/components/ProductCard';

interface NutritionData {
  calories: number;
  fat: number;
  carbs: number;
  protein: number;
  sugar: number;
  fiber: number;
  sodium: number;
}

interface ProductData {
  barcode: string;
  name: string;
  brand?: string;
  image?: string;
  nutrition: NutritionData;
  ingredients?: string[];
  categories?: string[];
}

interface AlternativeProduct {
  name: string;
  brand?: string;
  image?: string;
  nutrition: NutritionData;
  healthScore: number;
  whyBetter: string[];
  availableAt?: string[];
}

interface RecommendationData {
  originalProduct: ProductData;
  healthScore: number;
  healthInsights: {
    positive: string[];
    concerns: string[];
    recommendations: string[];
  };
  alternatives: AlternativeProduct[];
  nutritionComparison: {
    betterIn: string[];
    worseIn: string[];
  };
}

const RecommendationsPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { firebaseUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [recommendation, setRecommendation] = useState<RecommendationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const barcode = searchParams.get('barcode');
  const productName = searchParams.get('product');

  useEffect(() => {
    if (barcode) {
      fetchRecommendations();
    } else {
      setError('No product data provided');
      setLoading(false);
    }
  }, [barcode]);

  const fetchRecommendations = async () => {
    if (!barcode) return;

    setLoading(true);
    setError(null);

    try {
      // First, get the product data
      const productResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/barcode/${barcode}?autoFetch=true`);
      
      if (!productResponse.ok) {
        throw new Error('Product not found');
      }

      const productData = await productResponse.json();

      // Generate AI recommendations
      await generateAIRecommendations(productData);

    } catch (error: any) {
      setError(error.message || 'Failed to fetch recommendations');
      toast.error('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const generateAIRecommendations = async (productData: any) => {
    setGenerating(true);

    try {
      if (!firebaseUser) {
        throw new Error('Authentication required for recommendations');
      }

      console.log('🤖 Calling backend for AI recommendations...');
      const token = await firebaseUser.getIdToken();
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/recommendations/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productData: {
            barcode: productData.foodItem.barcode,
            name: productData.foodItem.name,
            brand: productData.additionalData?.brand,
            caloriesPer100g: productData.foodItem.caloriesPer100g,
            carbsPer100g: productData.foodItem.carbsPer100g,
            proteinsPer100g: productData.foodItem.proteinsPer100g,
            fatsPer100g: productData.foodItem.fatsPer100g,
            sugarsPer100g: productData.foodItem.sugarsPer100g,
            ingredients: productData.additionalData?.ingredients,
            categories: productData.additionalData?.categories
          },
          userPreferences: {
            // Add user preferences if available
            // This could come from user profile in the future
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate recommendations');
      }

      const result = await response.json();
      console.log('✅ AI recommendations received:', result);

      const aiRecommendation = result.data;
      
      // Transform the AI response to match our frontend interface
      const transformedRecommendation: RecommendationData = {
        originalProduct: {
          barcode: productData.foodItem.barcode,
          name: productData.foodItem.name,
          brand: productData.additionalData?.brand,
          image: productData.additionalData?.imageUrl,
          nutrition: {
            calories: productData.foodItem.caloriesPer100g,
            fat: productData.foodItem.fatsPer100g,
            carbs: productData.foodItem.carbsPer100g,
            protein: productData.foodItem.proteinsPer100g,
            sugar: productData.foodItem.sugarsPer100g,
            fiber: 2, // Default values for missing data
            sodium: 200
          }
        },
        healthScore: aiRecommendation.healthScore,
        healthInsights: aiRecommendation.healthInsights,
        alternatives: aiRecommendation.alternatives,
        nutritionComparison: {
          betterIn: ['protein', 'fiber'],
          worseIn: ['sugar', 'sodium']
        }
      };

      setRecommendation(transformedRecommendation);

      if (result.source === 'fallback') {
        toast.warning('Using fallback recommendations - AI service temporarily unavailable');
      } else {
        toast.success('AI recommendations generated successfully!');
      }

    } catch (error: any) {
      console.error('Error generating AI recommendations:', error);
      
      // Fallback to local mock data if API fails
      const mockRecommendation: RecommendationData = {
        originalProduct: {
          barcode: productData.foodItem.barcode,
          name: productData.foodItem.name,
          brand: productData.additionalData?.brand,
          image: productData.additionalData?.imageUrl,
          nutrition: {
            calories: productData.foodItem.caloriesPer100g,
            fat: productData.foodItem.fatsPer100g,
            carbs: productData.foodItem.carbsPer100g,
            protein: productData.foodItem.proteinsPer100g,
            sugar: productData.foodItem.sugarsPer100g,
            fiber: 2,
            sodium: 200
          }
        },
        healthScore: calculateHealthScore(productData.foodItem),
        healthInsights: generateHealthInsights(productData.foodItem),
        alternatives: generateAlternatives(productData.foodItem),
        nutritionComparison: {
          betterIn: ['protein', 'fiber'],
          worseIn: ['sugar', 'sodium']
        }
      };

      setRecommendation(mockRecommendation);
      toast.error('Using offline recommendations - check your connection');
    } finally {
      setGenerating(false);
    }
  };

  const calculateHealthScore = (foodItem: any): number => {
    let score = 70; // Base score

    // Adjust based on nutrition
    if (foodItem.sugarsPer100g > 15) score -= 15;
    if (foodItem.sugarsPer100g < 5) score += 10;
    if (foodItem.proteinsPer100g > 10) score += 10;
    if (foodItem.fatsPer100g > 20) score -= 10;
    if (foodItem.caloriesPer100g < 100) score += 10;
    if (foodItem.caloriesPer100g > 400) score -= 15;

    return Math.max(20, Math.min(95, score));
  };

  const generateHealthInsights = (foodItem: any) => {
    const positive = [];
    const concerns = [];
    const recommendations = [];

    // Generate insights based on nutrition
    if (foodItem.proteinsPer100g > 10) {
      positive.push(`Good protein content (${foodItem.proteinsPer100g}g per 100g)`);
    }
    if (foodItem.caloriesPer100g < 200) {
      positive.push('Relatively low in calories');
    }
    if (foodItem.fatsPer100g < 5) {
      positive.push('Low fat content');
    }

    if (foodItem.sugarsPer100g > 15) {
      concerns.push(`High sugar content (${foodItem.sugarsPer100g}g per 100g)`);
    }
    if (foodItem.caloriesPer100g > 400) {
      concerns.push('High calorie density');
    }
    if (foodItem.fatsPer100g > 20) {
      concerns.push(`High fat content (${foodItem.fatsPer100g}g per 100g)`);
    }

    recommendations.push('Consider portion control when consuming this product');
    recommendations.push('Balance with fiber-rich vegetables and fruits');
    recommendations.push('Stay hydrated and maintain regular physical activity');

    return { positive, concerns, recommendations };
  };

  const generateAlternatives = (foodItem: any): AlternativeProduct[] => {
    // This would normally come from AI, but we'll generate smart alternatives
    const alternatives: AlternativeProduct[] = [
      {
        name: "Organic Whole Grain Alternative",
        brand: "Nature's Choice",
        nutrition: {
          calories: Math.max(100, foodItem.caloriesPer100g - 50),
          fat: Math.max(1, foodItem.fatsPer100g - 5),
          carbs: Math.max(10, foodItem.carbsPer100g - 10),
          protein: foodItem.proteinsPer100g + 3,
          sugar: Math.max(1, foodItem.sugarsPer100g - 8),
          fiber: 6,
          sodium: 150
        },
        healthScore: 85,
        whyBetter: [
          "50% less sugar content",
          "Higher fiber and protein",
          "Made with organic ingredients"
        ],
        availableAt: ["Whole Foods", "Target", "Local health stores"]
      },
      {
        name: "Plant-Based Protein Option",
        brand: "GreenLife",
        nutrition: {
          calories: Math.max(120, foodItem.caloriesPer100g - 30),
          fat: Math.max(2, foodItem.fatsPer100g - 3),
          carbs: Math.max(15, foodItem.carbsPer100g - 5),
          protein: foodItem.proteinsPer100g + 5,
          sugar: Math.max(2, foodItem.sugarsPer100g - 10),
          fiber: 8,
          sodium: 180
        },
        healthScore: 88,
        whyBetter: [
          "Plant-based protein source",
          "Higher fiber content",
          "No artificial additives"
        ],
        availableAt: ["Trader Joe's", "Amazon", "Local grocery stores"]
      },
      {
        name: "Low-Sodium Heart-Healthy Version",
        brand: "CardioWise",
        nutrition: {
          calories: foodItem.caloriesPer100g - 20,
          fat: Math.max(1, foodItem.fatsPer100g - 4),
          carbs: foodItem.carbsPer100g,
          protein: foodItem.proteinsPer100g + 2,
          sugar: Math.max(1, foodItem.sugarsPer100g - 5),
          fiber: 4,
          sodium: 80
        },
        healthScore: 82,
        whyBetter: [
          "75% less sodium",
          "Heart-healthy formulation",
          "Added omega-3 fatty acids"
        ],
        availableAt: ["CVS", "Walgreens", "Online pharmacies"]
      }
    ];

    return alternatives;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {loading ? (
        <>
          <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center h-16">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="mr-4"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Health Recommendations
                </h1>
              </div>
            </div>
          </header>

          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyzing Product</h3>
              <p className="text-gray-600">Generating personalized health recommendations...</p>
            </div>
          </div>
        </>
      ) : error || !recommendation ? (
        <>
          <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center h-16">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.back()}
                  className="mr-4"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Health Recommendations
                </h1>
              </div>
            </div>
          </header>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Card>
              <CardContent className="p-8 text-center">
                <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Unable to Generate Recommendations
                </h3>
                <p className="text-gray-600 mb-4">
                  {error || 'No product data available for analysis.'}
                </p>
                <Button onClick={() => router.push('/scan')}>
                  Scan Another Product
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <>
          {/* Header */}
          <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.back()}
                    className="mr-4"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Health Recommendations
                  </h1>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchRecommendations}
                  disabled={generating}
                >
                  {generating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Refresh
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            
            {/* Product Overview */}
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                      {recommendation.originalProduct.image ? (
                        <img 
                          src={recommendation.originalProduct.image} 
                          alt={recommendation.originalProduct.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl">🥗</span>
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-xl">{recommendation.originalProduct.name}</CardTitle>
                      {recommendation.originalProduct.brand && (
                        <p className="text-gray-600">{recommendation.originalProduct.brand}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={`text-lg px-3 py-1 ${getScoreBadgeColor(recommendation.healthScore)}`}>
                      Health Score: {recommendation.healthScore}/100
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{recommendation.originalProduct.nutrition.calories}</p>
                    <p className="text-sm text-gray-600">Calories</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{recommendation.originalProduct.nutrition.protein}g</p>
                    <p className="text-sm text-gray-600">Protein</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{recommendation.originalProduct.nutrition.carbs}g</p>
                    <p className="text-sm text-gray-600">Carbs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{recommendation.originalProduct.nutrition.fat}g</p>
                    <p className="text-sm text-gray-600">Fat</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Health Insights */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {/* Positive Aspects */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-green-700">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    What's Good
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {recommendation.healthInsights.positive.map((insight, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-sm text-gray-700">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Health Concerns */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-orange-700">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Health Concerns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {recommendation.healthInsights.concerns.map((concern, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-sm text-gray-700">{concern}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-blue-700">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Our Advice
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {recommendation.healthInsights.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-sm text-gray-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Healthier Alternatives */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-emerald-700">
                  <Sparkles className="h-5 w-5 mr-2" />
                  Healthier Alternatives
                </CardTitle>
                <p className="text-gray-600 mt-2">
                  Based on your product, here are some healthier alternatives we recommend:
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-6">
                  {recommendation.alternatives.map((alternative, index) => (
                    <Card key={index} className="border-2 border-emerald-100 hover:border-emerald-200 transition-colors">
                      <CardHeader>
                        <div className="flex items-center justify-between mb-2">
                          <CardTitle className="text-lg">{alternative.name}</CardTitle>
                          <Badge className={getScoreBadgeColor(alternative.healthScore)}>
                            {alternative.healthScore}/100
                          </Badge>
                        </div>
                        {alternative.brand && (
                          <p className="text-gray-600 text-sm">{alternative.brand}</p>
                        )}
                      </CardHeader>
                      <CardContent>
                        {/* Nutrition Comparison */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="text-center">
                            <p className="font-semibold text-gray-900">{alternative.nutrition.calories}</p>
                            <p className="text-xs text-gray-600">Calories</p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-gray-900">{alternative.nutrition.protein}g</p>
                            <p className="text-xs text-gray-600">Protein</p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-gray-900">{alternative.nutrition.sugar}g</p>
                            <p className="text-xs text-gray-600">Sugar</p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-gray-900">{alternative.nutrition.fiber}g</p>
                            <p className="text-xs text-gray-600">Fiber</p>
                          </div>
                        </div>

                        <Separator className="my-4" />

                        {/* Why It's Better */}
                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-900 mb-2">Why it's better:</h4>
                          <ul className="space-y-1">
                            {alternative.whyBetter.map((reason, reasonIndex) => (
                              <li key={reasonIndex} className="flex items-start">
                                <Heart className="h-3 w-3 text-red-500 mt-1 mr-2 flex-shrink-0" />
                                <span className="text-sm text-gray-700">{reason}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Where to Find */}
                        {alternative.availableAt && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Available at:</h4>
                            <div className="flex flex-wrap gap-1">
                              {alternative.availableAt.map((store, storeIndex) => (
                                <Badge key={storeIndex} variant="outline" className="text-xs">
                                  {store}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-center space-x-4 mt-8">
              <Button onClick={() => router.push('/scan')} className="bg-emerald-600 hover:bg-emerald-700">
                Scan Another Product
              </Button>
              <Button variant="outline" onClick={() => router.push('/')}>
                Back to Dashboard
              </Button>
            </div>
          </main>
        </>
      )}
    </div>
  );
};

export default RecommendationsPage; 