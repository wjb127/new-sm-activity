'use client';

import { SMProvider } from '@/context/SMContext';
import SchedulerManager from '@/components/SchedulerManager';
import Link from 'next/link';

export default function SchedulerPage() {
  return (
    <SMProvider>
      <main className="min-h-screen bg-gray-100">
        <div className="container mx-auto py-4 px-3">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-800">스케줄러 관리</h1>
            <div className="space-x-2">
              <Link 
                href="/"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              >
                이력 등록
              </Link>
              <Link 
                href="/history"
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm font-medium"
              >
                이력 목록
              </Link>
              <Link 
                href="/files"
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm font-medium"
              >
                문서 관리
              </Link>
            </div>
          </div>
          
          <SchedulerManager />
        </div>
      </main>
    </SMProvider>
  );
}