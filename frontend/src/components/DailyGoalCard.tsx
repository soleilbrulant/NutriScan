'use client';

import React from 'react';

interface DailyGoalCardProps {
  title: string;
  current: number;
  target: number;
  unit: string;
  color: 'emerald' | 'blue' | 'orange' | 'purple';
}

const DailyGoalCard = ({ title, current, target, unit, color }: DailyGoalCardProps) => {
  const percentage = (current / target) * 100;
  
  const colorClasses = {
    emerald: {
      bg: 'from-emerald-400 to-emerald-500',
      bar: 'bg-white',
      text: 'text-white'
    },
    blue: {
      bg: 'from-blue-400 to-blue-500',
      bar: 'bg-white',
      text: 'text-white'
    },
    orange: {
      bg: 'from-orange-400 to-orange-500',
      bar: 'bg-white',
      text: 'text-white'
    },
    purple: {
      bg: 'from-purple-400 to-purple-500',
      bar: 'bg-white',
      text: 'text-white'
    }
  };

  const colorClass = colorClasses[color];

  return (
    <div className={`bg-gradient-to-br ${colorClass.bg} rounded-2xl p-6 ${colorClass.text} shadow-lg`}>
      <h3 className="text-lg font-bold mb-4">{title}</h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold">{current}</span>
          <span className="text-sm opacity-90">/ {target} {unit}</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${colorClass.bar}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <div className="text-sm opacity-90">
          {percentage.toFixed(0)}% of daily goal
        </div>
      </div>
    </div>
  );
};

export default DailyGoalCard;
