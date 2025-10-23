'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ScanBarcode, History, BarChart3 } from 'lucide-react';

const BottomNavigation = () => {
  const pathname = usePathname();
  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: ScanBarcode, label: 'Scan', path: '/scan' },
    { icon: History, label: 'History', path: '/history' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = pathname === path;
          return (
            <Link
              key={path}
              href={path}
              className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                isActive
                  ? 'text-emerald-600 bg-emerald-50'
                  : 'text-gray-600 hover:text-emerald-600'
              }`}
            >
              <Icon size={24} />
              <span className="text-xs mt-1 font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
