// Supabase API를 직접 호출하는 함수들을 정의합니다.
import { SMRecord } from '@/types';

// 데이터베이스 레코드 타입 (PostgreSQL은 소문자 컬럼명 사용)
interface DBRecord {
  id: string;
  category: string;
  taskNo: string;
  year: string;
  month: string;
  receiptDate: string;
  requestPath: string;
  requestTeam: string;
  requester: string;
  requestContent: string;
  processContent: string;
  note: string;
  smManager: string;
  startDate: string;
  deployDate: string;
  createdat?: string;
}

// Supabase 프로젝트 URL과 API 키는 환경 변수에서 가져옵니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// API 요청에 사용할 기본 헤더
const getHeaders = () => ({
  'apikey': supabaseKey || '',
  'Authorization': `Bearer ${supabaseKey || ''}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal'
});

// 환경 변수가 설정되었는지 확인하는 함수
const isSupabaseConfigured = () => {
  return supabaseUrl && supabaseKey && supabaseUrl !== 'https://your-supabase-project-url.supabase.co';
};

// 필드 이름을 모두 소문자로 변환하는 함수
const convertFieldsToLowercase = (record: Record<string, any>): Record<string, any> => {
  const result: Record<string, any> = {};
  
  Object.keys(record).forEach(key => {
    // 키를 소문자로 변환하여 저장
    result[key.toLowerCase()] = record[key];
  });
  
  return result;
};

// 레코드 조회 함수
export async function fetchRecords(): Promise<any[]> {
  // 환경 변수가 설정되지 않았으면 빈 배열 반환
  if (!isSupabaseConfigured()) {
    console.warn('Supabase 환경 변수가 설정되지 않았습니다. 로컬 스토리지를 사용합니다.');
    return [];
  }

  try {
    console.log('API 호출 URL:', `${supabaseUrl}/rest/v1/sm_records?order=createdat.desc`);
    
    const response = await fetch(`${supabaseUrl}/rest/v1/sm_records?order=createdat.desc`, {
      method: 'GET',
      headers: getHeaders(),
      cache: 'no-cache'
    });
    
    console.log('API 응답 상태:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API 응답 에러:', errorText);
      throw new Error(`Error fetching records: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('API 응답 데이터:', data);
    
    return data;
  } catch (error) {
    console.error('API 조회 오류:', error);
    return [];
  }
}

// 레코드 추가 함수
export async function addRecord(record: any): Promise<any> {
  // 환경 변수가 설정되지 않았으면 레코드 그대로 반환
  if (!isSupabaseConfigured()) {
    console.warn('Supabase 환경 변수가 설정되지 않았습니다. 로컬 스토리지에만 저장됩니다.');
    return record;
  }

  try {
    console.log('=== SM 이력 등록 API 호출 시작 ===');
    console.log('API 호출 URL:', `${supabaseUrl}/rest/v1/sm_records`);
    
    // 필드 이름을 소문자로 변환
    const lowercaseRecord = convertFieldsToLowercase(record);
    console.log('추가할 레코드(소문자 변환):', lowercaseRecord);
    
    const response = await fetch(`${supabaseUrl}/rest/v1/sm_records`, {
      method: 'POST',
      headers: {
        ...getHeaders(),
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(lowercaseRecord)
    });
    
    console.log('API 응답 상태 코드:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API 응답 에러:', errorText);
      throw new Error(`Error adding record: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('API 응답 데이터:', data);
    console.log('=== SM 이력 등록 API 호출 완료 ===');
    
    return data[0] || record;
  } catch (error) {
    console.error('=== SM 이력 등록 API 오류 ===', error);
    return record;
  }
}

// 레코드 삭제 함수
export async function deleteRecord(id: string): Promise<boolean> {
  // 환경 변수가 설정되지 않았으면 성공으로 처리
  if (!isSupabaseConfigured()) {
    console.warn('Supabase 환경 변수가 설정되지 않았습니다. 로컬 스토리지에서만 삭제됩니다.');
    return true;
  }

  try {
    console.log('API 호출 URL:', `${supabaseUrl}/rest/v1/sm_records?id=eq.${id}`);
    
    const response = await fetch(`${supabaseUrl}/rest/v1/sm_records?id=eq.${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    
    console.log('API 응답 상태:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API 응답 에러:', errorText);
      throw new Error(`Error deleting record: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error('API 삭제 오류:', error);
    return false;
  }
}

// 레코드 업데이트 함수
export async function updateRecord(id: string, record: any): Promise<any> {
  // 환경 변수가 설정되지 않았으면 레코드 그대로 반환
  if (!isSupabaseConfigured()) {
    console.warn('Supabase 환경 변수가 설정되지 않았습니다. 로컬 스토리지에만 업데이트됩니다.');
    return record;
  }

  try {
    console.log('API 호출 URL:', `${supabaseUrl}/rest/v1/sm_records?id=eq.${id}`);
    
    // 필드 이름을 소문자로 변환
    const lowercaseRecord = convertFieldsToLowercase(record);
    console.log('업데이트할 레코드(소문자 변환):', lowercaseRecord);
    
    const response = await fetch(`${supabaseUrl}/rest/v1/sm_records?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        ...getHeaders(),
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(lowercaseRecord)
    });
    
    console.log('API 응답 상태:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API 응답 에러:', errorText);
      throw new Error(`Error updating record: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('API 응답 데이터:', data);
    
    return data[0] || record;
  } catch (error) {
    console.error('API 업데이트 오류:', error);
    return record;
  }
} 