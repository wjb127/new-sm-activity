'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { SMRecord, SMRecordInput } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { supabase } from '@/lib/supabase';

// 기존 레코드 타입(category가 없을 수 있음)
interface LegacySMRecord extends Omit<SMRecord, 'category'> {
  category?: string;
}

interface SMContextType {
  records: SMRecord[];
  addRecord: (record: SMRecordInput) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  updateRecord: (id: string, record: SMRecordInput) => Promise<void>;
  isLoading: boolean;
}

const SMContext = createContext<SMContextType | undefined>(undefined);

export function SMProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<SMRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Supabase에서 데이터 불러오기
  useEffect(() => {
    async function fetchRecords() {
      try {
        setIsLoading(true);
        
        // Supabase에서 데이터 가져오기
        const { data, error } = await supabase
          .from('sm_records')
          .select('*')
          .order('createdAt', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        if (data) {
          setRecords(data as SMRecord[]);
        }
      } catch (error) {
        console.error('데이터 불러오기 오류:', error);
        
        // Supabase 연결 실패 시 로컬 스토리지에서 백업 데이터 불러오기
        try {
          const savedRecords = localStorage.getItem('smRecords');
          if (savedRecords) {
            const parsedRecords = JSON.parse(savedRecords) as LegacySMRecord[];
            const updatedRecords = parsedRecords.map(record => ({
              ...record,
              category: record.category || '대시보드'
            }));
            
            setRecords(updatedRecords as SMRecord[]);
          }
        } catch (localError) {
          console.error('로컬 데이터 불러오기 오류:', localError);
        }
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchRecords();
  }, []);

  // 로컬 스토리지에 백업 데이터 저장
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem('smRecords', JSON.stringify(records));
      } catch (error) {
        console.error('로컬 데이터 저장 오류:', error);
      }
    }
  }, [records, isLoading]);

  const addRecord = async (record: SMRecordInput) => {
    try {
      const newRecord: SMRecord = {
        ...record,
        id: uuidv4(),
        createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      };
      
      // Supabase에 데이터 추가
      const { error } = await supabase
        .from('sm_records')
        .insert(newRecord);
      
      if (error) {
        throw error;
      }
      
      setRecords(prevRecords => [...prevRecords, newRecord]);
    } catch (error) {
      console.error('레코드 추가 오류:', error);
      throw error;
    }
  };

  const deleteRecord = async (id: string) => {
    try {
      // Supabase에서 데이터 삭제
      const { error } = await supabase
        .from('sm_records')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      setRecords(prevRecords => prevRecords.filter(record => record.id !== id));
    } catch (error) {
      console.error('레코드 삭제 오류:', error);
      throw error;
    }
  };

  const updateRecord = async (id: string, updatedRecord: SMRecordInput) => {
    try {
      const recordToUpdate = {
        ...updatedRecord,
        id,
        // createdAt은 변경하지 않음
      };
      
      // Supabase에서 데이터 업데이트
      const { error } = await supabase
        .from('sm_records')
        .update(recordToUpdate)
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      setRecords(
        prevRecords => prevRecords.map(record => 
          record.id === id 
            ? { ...recordToUpdate, createdAt: record.createdAt } 
            : record
        )
      );
    } catch (error) {
      console.error('레코드 업데이트 오류:', error);
      throw error;
    }
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