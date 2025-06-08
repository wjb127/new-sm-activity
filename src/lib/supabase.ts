// Supabase API를 직접 호출하는 함수들을 정의합니다.
import { SMRecord } from '@/types';

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

// Supabase 환경 변수가 설정되어 있는지 확인
const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseKey);
};

// SMRecord를 Record<string, unknown>으로 변환하는 함수
const convertSMRecordToRecord = (record: SMRecord): Record<string, unknown> => {
  return {
    id: record.id,
    category: record.category,
    taskno: record.taskNo,
    year: record.year,
    targetmonth: record.targetMonth,
    receiptdate: record.receiptDate,
    requestpath: record.requestPath,
    workbasisnumber: record.workBasisNumber,
    requestteam: record.requestTeam,
    requestorgtype: record.requestOrgType,
    requester: record.requester,
    lguplusteamname: record.lgUplusTeamName,
    systempart: record.systemPart,
    targetsystemname: record.targetSystemName,
    slasmactivity: record.slaSmActivity,
    slasmactivitydetail: record.slaSmActivityDetail,
    processtype: record.processType,
    requestcontent: record.requestContent,
    processcontent: record.processContent,
    note: record.note,
    smmanager: record.smManager,
    startdate: record.startDate,
    expecteddeploydate: record.expectedDeployDate,
    deploycompleted: record.deployCompleted,
    actualdeploydate: record.actualDeployDate,
    worktimedays: record.workTimeDays,
    worktimehours: record.workTimeHours,
    worktimeminutes: record.workTimeMinutes,
    totalmm: record.totalMM,
    monthlyactualbillingmm: record.monthlyActualBillingMM,
    errorfixrequired: record.errorFixRequired,
    workreviewtarget: record.workReviewTarget,
    workreviewweek: record.workReviewWeek,
    createdat: record.createdAt
  };
};

// 레코드 조회 함수
export async function fetchRecords(): Promise<Record<string, unknown>[]> {
  // 환경 변수가 설정되지 않았으면 빈 배열 반환
  if (!isSupabaseConfigured()) {
    console.warn('Supabase 환경 변수가 설정되지 않았습니다. 로컬 스토리지에서 데이터를 불러옵니다.');
    return [];
  }

  try {
    console.log('=== SM 이력 조회 API 호출 시작 ===');
    console.log('API 호출 URL:', `${supabaseUrl}/rest/v1/sm_records`);
    
    const response = await fetch(`${supabaseUrl}/rest/v1/sm_records`, {
      method: 'GET',
      headers: getHeaders()
    });
    
    console.log('API 응답 상태 코드:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API 응답 에러:', errorText);
      throw new Error(`Error fetching records: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('API 응답 데이터:', data);
    console.log('=== SM 이력 조회 API 호출 완료 ===');
    
    return data;
  } catch (error) {
    console.error('=== SM 이력 조회 API 오류 ===', error);
    return [];
  }
}

// 레코드 추가 함수
export async function addRecord(record: SMRecord): Promise<Record<string, unknown>> {
  // 환경 변수가 설정되지 않았으면 레코드 그대로 반환
  if (!isSupabaseConfigured()) {
    console.warn('Supabase 환경 변수가 설정되지 않았습니다. 로컬 스토리지에만 저장됩니다.');
    return convertSMRecordToRecord(record);
  }

  try {
    console.log('=== SM 이력 등록 API 호출 시작 ===');
    console.log('API 호출 URL:', `${supabaseUrl}/rest/v1/sm_records`);
    
    // SMRecord를 Record<string, unknown>으로 변환 후 필드 이름을 소문자로 변환
    const recordToSend = convertSMRecordToRecord(record);
    console.log('추가할 레코드(소문자 변환):', recordToSend);
    
    const response = await fetch(`${supabaseUrl}/rest/v1/sm_records`, {
      method: 'POST',
      headers: {
        ...getHeaders(),
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(recordToSend)
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
    return convertSMRecordToRecord(record);
  }
}

// 레코드 삭제 함수
export async function deleteRecord(id: string): Promise<boolean> {
  // 환경 변수가 설정되지 않았으면 true 반환 (로컬에서만 삭제)
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
export async function updateRecord(id: string, record: SMRecord): Promise<Record<string, unknown>> {
  // 환경 변수가 설정되지 않았으면 레코드 그대로 반환
  if (!isSupabaseConfigured()) {
    console.warn('Supabase 환경 변수가 설정되지 않았습니다. 로컬 스토리지에만 업데이트됩니다.');
    return convertSMRecordToRecord(record);
  }

  try {
    console.log('API 호출 URL:', `${supabaseUrl}/rest/v1/sm_records?id=eq.${id}`);
    
    // SMRecord를 Record<string, unknown>으로 변환 후 필드 이름을 소문자로 변환
    const recordToSend = convertSMRecordToRecord(record);
    console.log('업데이트할 레코드(소문자 변환):', recordToSend);
    
    const response = await fetch(`${supabaseUrl}/rest/v1/sm_records?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        ...getHeaders(),
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(recordToSend)
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
    return convertSMRecordToRecord(record);
  }
} 