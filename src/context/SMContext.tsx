'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { SMRecord, SMRecordInput } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

// 기존 레코드 타입(category가 없을 수 있음)
interface LegacySMRecord extends Omit<SMRecord, 'category'> {
  category?: string;
}

interface SMContextType {
  records: SMRecord[];
  addRecord: (record: SMRecordInput) => void;
  deleteRecord: (id: string) => void;
  updateRecord: (id: string, record: SMRecordInput) => void;
  isLoading: boolean;
}

const SMContext = createContext<SMContextType | undefined>(undefined);

export function SMProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<SMRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 로컬 스토리지에서 데이터 불러오기
  useEffect(() => {
    try {
      setIsLoading(true);
      const savedRecords = localStorage.getItem('smRecords');
      if (savedRecords) {
        // 기존 데이터를 불러오면서 category 필드가 없는 경우 '대시보드'로 기본값 설정
        const parsedRecords = JSON.parse(savedRecords) as LegacySMRecord[];
        const updatedRecords = parsedRecords.map(record => ({
          ...record,
          category: record.category || '대시보드' // category 필드가 없으면 기본값 추가
        }));
        
        setRecords(updatedRecords as SMRecord[]);
      }
    } catch (error) {
      console.error('데이터 불러오기 오류:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 데이터 저장
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem('smRecords', JSON.stringify(records));
      } catch (error) {
        console.error('데이터 저장 오류:', error);
      }
    }
  }, [records, isLoading]);

  const addRecord = (record: SMRecordInput) => {
    const newRecord: SMRecord = {
      ...record,
      id: uuidv4(),
      createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    };
    setRecords(prevRecords => [...prevRecords, newRecord]);
  };

  const deleteRecord = (id: string) => {
    setRecords(prevRecords => prevRecords.filter(record => record.id !== id));
  };

  const updateRecord = (id: string, updatedRecord: SMRecordInput) => {
    setRecords(
      prevRecords => prevRecords.map(record => 
        record.id === id 
          ? { ...updatedRecord, id, createdAt: record.createdAt } 
          : record
      )
    );
  };

  return (
    <SMContext.Provider value={{ records, addRecord, deleteRecord, updateRecord, isLoading }}>
      {children}
    </SMContext.Provider>
  );
}

export function useSM() {
  const context = useContext(SMContext);
  if (context === undefined) {
    throw new Error('useSM must be used within a SMProvider');
  }
  return context;
} 