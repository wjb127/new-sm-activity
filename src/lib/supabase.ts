// Supabase API를 직접 호출하는 함수들을 정의합니다.
import { SMRecord } from '@/types';

// Supabase 프로젝트 URL과 API 키는 환경 변수에서 가져옵니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.com';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-key';

// API 요청에 사용할 기본 헤더
const getHeaders = () => ({
  'apikey': supabaseKey,
  'Authorization': `Bearer ${supabaseKey}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
});

// 레코드 조회 함수
export async function fetchRecords(): Promise<SMRecord[]> {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/sm_records?order=createdAt.desc`, {
      method: 'GET',
      headers: getHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Error fetching records: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API 조회 오류:', error);
    throw error;
  }
}

// 레코드 추가 함수
export async function addRecord(record: SMRecord): Promise<SMRecord> {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/sm_records`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(record)
    });
    
    if (!response.ok) {
      throw new Error(`Error adding record: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API 추가 오류:', error);
    throw error;
  }
}

// 레코드 삭제 함수
export async function deleteRecord(id: string): Promise<boolean> {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/sm_records?id=eq.${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Error deleting record: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error('API 삭제 오류:', error);
    throw error;
  }
}

// 레코드 업데이트 함수
export async function updateRecord(id: string, record: Partial<SMRecord>): Promise<SMRecord> {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/sm_records?id=eq.${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(record)
    });
    
    if (!response.ok) {
      throw new Error(`Error updating record: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API 업데이트 오류:', error);
    throw error;
  }
} 