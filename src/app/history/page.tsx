'use client';

import { SMProvider } from '@/context/SMContext';
import SMList from '@/components/SMList';
import Link from 'next/link';

export default function HistoryPage() {
  return (
    <SMProvider>
      <main className="min-h-screen bg-gray-100">
        <div className="container mx-auto py-4 px-3">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-gray-800">SM 이력 목록</h1>
            <Link 
              href="/"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
            >
              이력 등록으로 이동
            </Link>
          </div>
          
          <SMList />
        </div>
      </main>
    </SMProvider>
  );
}