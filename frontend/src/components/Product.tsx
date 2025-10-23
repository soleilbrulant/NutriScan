'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function Product() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setProduct({
        name: 'Granola Bar',
        brand: 'Brand A',
        image: '/lovable-uploads/d3e42d99-008f-428c-afa5-f43a24ee1c20.png',
        calories: 190,
        nutrients: {
          totalFat: { value: 3, unit: 'g', percentage: 15 },
          carbs: { value: 24, unit: 'g', percentage: 8 },
          fiber: { value: 4, unit: 'g', percentage: 14 },
          protein: { value: 3, unit: 'g', percentage: 6 },
        },
        tags: ['High Sugar', 'Moderate Sodium'],
      });
      setLoading(false);
    }, 1500);
  }, []);

  const addToLog = () => {
    // Add to localStorage
    const logs = JSON.parse(localStorage.getItem('nutritionLogs') || '[]');
    logs.unshift({
      ...product,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem('nutritionLogs', JSON.stringify(logs.slice(0, 50)));
    
    toast.success('Added to daily log!');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product information...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-gray-600 mb-4">Product not found</p>
          <button
            onClick={() => router.push('/scan')}
            className="bg-emerald-500 text-white px-6 py-2 rounded-lg"
          >
            Scan Another Product
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <button onClick={() => router.back()}>
            <ArrowLeft className="text-gray-600" size={24} />
          </button>
          <h1 className="text-lg font-semibold">Nutrition Details</h1>
          <div></div>
        </div>
      </header>

      {/* Content */}
      <main className="px-6 py-6 space-y-6">
        {/* Product Image */}
        <div className="flex justify-center">
          <div className="w-32 h-20 bg-orange-200 rounded-lg flex items-center justify-center overflow-hidden">
            <div className="bg-orange-300 px-4 py-2 rounded">
              <div className="flex space-x-1">
                {Array.from({ length: 15 }, (_, i) => (
                  <div key={i} className={`w-1 bg-black ${i % 2 === 0 ? 'h-8' : 'h-6'}`}></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Product Info */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{product.name}</h2>
          <p className="text-gray-600">{product.brand}</p>
        </div>

        {/* Calories */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 mb-1">{product.calories}</div>
            <div className="text-gray-600">Calories</div>
            <div className="w-full bg-emerald-200 rounded-full h-2 mt-4">
              <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '10%' }}></div>
            </div>
            <div className="text-sm text-gray-600 mt-2">10%</div>
          </div>
        </div>

        {/* Nutrition Facts */}
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
          {Object.entries(product.nutrients).map(([key, nutrient]: [string, any]) => (
            <div key={key}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium capitalize">
                  {key === 'totalFat' ? 'Total Fat' : key}
                </span>
                <div className="text-right">
                  <span className="font-semibold">{nutrient.value}{nutrient.unit}</span>
                  <span className="text-sm text-gray-600 ml-2">{nutrient.percentage}%</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gray-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${nutrient.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Tags */}
        <div className="flex gap-2">
          {product.tags.map((tag: string) => (
            <span 
              key={tag}
              className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                tag === 'High Sugar' ? 'bg-orange-100 text-orange-700' :
                'bg-red-100 text-red-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${
                tag === 'High Sugar' ? 'bg-orange-500' :
                'bg-red-500'
              }`}></span>
              {tag}
            </span>
          ))}
        </div>

        {/* Add to Log Button */}
        <button
          onClick={addToLog}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-xl font-semibold text-lg shadow-sm hover:shadow-md transition-all duration-200"
        >
          Add to Daily Log
        </button>
      </main>
    </div>
  );
} 