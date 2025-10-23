'use client';

import React from 'react';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';

interface ProductCardProps {
  id: string;
  name: string;
  image?: string;
  calories: number;
  tags?: string[];
  onClick?: () => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ id, name, image, calories, tags, onClick }) => {
  return (
    <div 
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
          {image ? (
            <Image 
              src={image} 
              alt={name}
              width={48}
              height={48}
              className="w-full h-full object-cover"
              loading="lazy"
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R7Dh5zTr79Y2de7gw=="
              unoptimized={image.startsWith('data:')} // Don't optimize data URLs
            />
          ) : (
            <span className="text-2xl">🥗</span>
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">{name}</h3>
          <p className="text-sm text-gray-600">{calories} cal</p>
          {tags && (
            <div className="flex gap-1 mt-1">
              {tags.map((tag) => (
                <span 
                  key={tag}
                  className={`text-xs px-2 py-1 rounded-full ${
                    tag === 'High Fiber' ? 'bg-green-100 text-green-700' :
                    tag === 'High Sugar' ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-700'
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        
        <ChevronRight className="text-gray-400" size={20} />
      </div>
    </div>
  );
};

export default ProductCard;
