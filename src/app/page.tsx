'use client';

import { useState } from 'react';
import { SMProvider } from '@/context/SMContext';
import SMForm from '@/components/SMForm';
import SMList from '@/components/SMList';
import FileManager from '@/components/FileManager';
import SchedulerManager from '@/components/SchedulerManager';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'form' | 'list' | 'files' | 'scheduler'>('form');

  return (
    <SMProvider>
      <main className="min-h-screen bg-gray-100">
        <div className="container mx-auto py-4 px-3">
          <h1 className="text-2xl font-bold text-center mb-4 text-gray-800">SM 이력관리 시스템</h1>
          
          <div className="mb-4">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('form')}
                  className={`w-1/4 py-3 px-1 text-center border-b-2 font-medium text-sm ${
                    activeTab === 'form'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  이력 등록
                </button>
                <button
                  onClick={() => setActiveTab('list')}
                  className={`w-1/4 py-3 px-1 text-center border-b-2 font-medium text-sm ${
                    activeTab === 'list'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  이력 목록
                </button>
                <button
                  onClick={() => setActiveTab('files')}
                  className={`w-1/4 py-3 px-1 text-center border-b-2 font-medium text-sm ${
                    activeTab === 'files'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  문서 관리
                </button>
                <button
                  onClick={() => setActiveTab('scheduler')}
                  className={`w-1/4 py-3 px-1 text-center border-b-2 font-medium text-sm ${
                    activeTab === 'scheduler'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  스케줄러
                </button>
              </nav>
            </div>
          </div>

          <div className="mt-3">
            {activeTab === 'form' && <SMForm />}
            {activeTab === 'list' && <SMList />}
            {activeTab === 'files' && <FileManager />}
            {activeTab === 'scheduler' && <SchedulerManager />}
          </div>
        </div>
      </main>
    </SMProvider>
  )
}
