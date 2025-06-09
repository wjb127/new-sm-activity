'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { SMRecord, SMRecordInput } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { fetchRecords, addRecord as addRecordApi, deleteRecord as deleteRecordApi, updateRecord as updateRecordApi } from '@/lib/supabase';

interface SMContextType {
  records: SMRecord[];
  addRecord: (record: SMRecordInput) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  updateRecord: (id: string, record: SMRecordInput) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const SMContext = createContext<SMContextType | undefined>(undefined);

export function SMProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<SMRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Supabase에서만 데이터 불러오기 (로컬 스토리지 제거)
  useEffect(() => {
    async function loadRecords() {
      try {
        setIsLoading(true);
        setError(null);
        console.log('=== Supabase에서 데이터 로딩 시작 ===');
        
        // Supabase 환경 변수 확인
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          throw new Error('Supabase 환경 변수가 설정되지 않았습니다. .env.local 파일을 확인하세요.');
        }
        
        console.log('Supabase URL:', supabaseUrl);
        console.log('API 호출 시작...');
        
        // Supabase API를 통해 데이터 가져오기
        const data = await fetchRecords();
        console.log('API 응답 데이터:', data);
        
        if (!Array.isArray(data)) {
          throw new Error('Supabase에서 올바르지 않은 데이터 형식을 받았습니다.');
        }
        
        // 데이터베이스에서 받은 데이터를 SMRecord 타입으로 변환
        const mappedData = data.map((item: Record<string, unknown>) => ({
          id: String(item.id || ''),
          category: String(item.category || '대시보드'),
          taskNo: String(item.taskno || ''),
          year: String(item.year || ''),
          targetMonth: String(item.targetmonth || ''),
          receiptDate: String(item.receiptdate || ''),
          requestPath: String(item.requestpath || ''),
          workBasisNumber: String(item.workbasisnumber || ''),
          requestTeam: String(item.requestteam || ''),
          requestOrgType: String(item.requestorgtype || ''),
          requester: String(item.requester || ''),
          lgUplusTeamName: String(item.lguplusteamname || ''),
          systemPart: String(item.systempart || ''),
          targetSystemName: String(item.targetsystemname || ''),
          slaSmActivity: String(item.slasmactivity || ''),
          slaSmActivityDetail: String(item.slasmactivitydetail || ''),
          processType: String(item.processtype || 'SM운영'),
          requestContent: String(item.requestcontent || ''),
          processContent: String(item.processcontent || ''),
          note: String(item.note || ''),
          smManager: String(item.smmanager || ''),
          startDate: String(item.startdate || ''),
          expectedDeployDate: String(item.expecteddeploydate || ''),
          deployCompleted: String(item.deploycompleted || ''),
          actualDeployDate: String(item.actualdeploydate || ''),
          workTimeDays: String(item.worktimedays || ''),
          workTimeHours: String(item.worktimehours || ''),
          workTimeMinutes: String(item.worktimeminutes || ''),
          totalMM: String(item.totalmm || ''),
          monthlyActualBillingMM: String(item.monthlyactualbillingmm || ''),
          errorFixRequired: String(item.errorfixrequired || ''),
          workReviewTarget: String(item.workreviewtarget || ''),
          workReviewWeek: String(item.workreviewweek || ''),
          createdAt: String(item.createdat || new Date().toISOString())
        })) as SMRecord[];
        
        setRecords(mappedData);
        console.log('=== Supabase 데이터 로드 성공 ===');
        console.log('총 레코드 수:', mappedData.length);
        
      } catch (error) {
        console.error('=== Supabase 연결 오류 ===', error);
        
        let errorMessage = 'Supabase 데이터베이스 연결에 실패했습니다.';
        
        if (error instanceof Error) {
          if (error.message.includes('환경 변수')) {
            errorMessage = 'Supabase 환경 변수가 설정되지 않았습니다. .env.local 파일에 NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 설정하세요.';
          } else if (error.message.includes('fetch')) {
            errorMessage = 'Supabase 서버에 연결할 수 없습니다. 인터넷 연결을 확인하거나 Supabase 서비스 상태를 확인하세요.';
          } else if (error.message.includes('401')) {
            errorMessage = 'Supabase 인증에 실패했습니다. API 키가 올바른지 확인하세요.';
          } else if (error.message.includes('403')) {
            errorMessage = 'Supabase 접근 권한이 없습니다. 데이터베이스 정책을 확인하세요.';
          } else {
            errorMessage = `Supabase 오류: ${error.message}`;
          }
        }
        
        setError(errorMessage);
        setRecords([]); // 빈 배열로 설정
      } finally {
        setIsLoading(false);
        console.log('=== 데이터 로딩 완료 ===');
      }
    }
    
    loadRecords();
  }, []);

  const addRecord = async (record: SMRecordInput) => {
    try {
      setError(null);
      console.log('=== Supabase에 SM 이력 등록 시작 ===');
      console.log('입력된 레코드 데이터:', record);
      
      const newRecord: SMRecord = {
        ...record,
        id: uuidv4(),
        createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      };
      
      console.log('생성된 새 레코드 (ID 포함):', newRecord);
      
      // Supabase API를 통해 데이터 추가
      const result = await addRecordApi(newRecord);
      console.log('Supabase 추가 결과:', result);
      
      if (!result) {
        throw new Error('Supabase에서 레코드 추가에 실패했습니다.');
      }
      
      // 데이터베이스에서 받은 데이터를 SMRecord 타입으로 변환
      const mappedResult: SMRecord = {
        id: String(result.id || newRecord.id),
        category: String(result.category || newRecord.category),
        taskNo: String(result.taskno || newRecord.taskNo),
        year: String(result.year || newRecord.year),
        targetMonth: String(result.targetmonth || newRecord.targetMonth),
        receiptDate: String(result.receiptdate || newRecord.receiptDate),
        requestPath: String(result.requestpath || newRecord.requestPath),
        workBasisNumber: String(result.workbasisnumber || newRecord.workBasisNumber),
        requestTeam: String(result.requestteam || newRecord.requestTeam),
        requestOrgType: String(result.requestorgtype || newRecord.requestOrgType),
        requester: String(result.requester || newRecord.requester),
        lgUplusTeamName: String(result.lguplusteamname || newRecord.lgUplusTeamName),
        systemPart: String(result.systempart || newRecord.systemPart),
        targetSystemName: String(result.targetsystemname || newRecord.targetSystemName),
        slaSmActivity: String(result.slasmactivity || newRecord.slaSmActivity),
        slaSmActivityDetail: String(result.slasmactivitydetail || newRecord.slaSmActivityDetail),
        processType: String(result.processtype || newRecord.processType),
        requestContent: String(result.requestcontent || newRecord.requestContent),
        processContent: String(result.processcontent || newRecord.processContent),
        note: String(result.note || newRecord.note),
        smManager: String(result.smmanager || newRecord.smManager),
        startDate: String(result.startdate || newRecord.startDate),
        expectedDeployDate: String(result.expecteddeploydate || newRecord.expectedDeployDate),
        deployCompleted: String(result.deploycompleted || newRecord.deployCompleted),
        actualDeployDate: String(result.actualdeploydate || newRecord.actualDeployDate),
        workTimeDays: String(result.worktimedays || newRecord.workTimeDays),
        workTimeHours: String(result.worktimehours || newRecord.workTimeHours),
        workTimeMinutes: String(result.worktimeminutes || newRecord.workTimeMinutes),
        totalMM: String(result.totalmm || newRecord.totalMM),
        monthlyActualBillingMM: String(result.monthlyactualbillingmm || newRecord.monthlyActualBillingMM),
        errorFixRequired: String(result.errorfixrequired || newRecord.errorFixRequired),
        workReviewTarget: String(result.workreviewtarget || newRecord.workReviewTarget),
        workReviewWeek: String(result.workreviewweek || newRecord.workReviewWeek),
        createdAt: String(result.createdat || newRecord.createdAt)
      };
      
      setRecords(prevRecords => [...prevRecords, mappedResult]);
      console.log('=== Supabase SM 이력 등록 성공 ===');
      console.log('현재 총 레코드 수:', records.length + 1);
      
    } catch (error) {
      console.error('=== Supabase SM 이력 등록 오류 ===', error);
      
      let errorMessage = 'Supabase에 데이터를 저장하는데 실패했습니다.';
      if (error instanceof Error) {
        errorMessage = `Supabase 저장 오류: ${error.message}`;
      }
      
      setError(errorMessage);
      throw error; // 에러를 다시 던져서 UI에서 처리할 수 있도록 함
    }
  };

  const deleteRecord = async (id: string) => {
    try {
      setError(null);
      console.log('=== Supabase에서 레코드 삭제 시작, ID:', id, '===');
      
      // Supabase API를 통해 데이터 삭제
      const success = await deleteRecordApi(id);
      console.log('Supabase 삭제 결과:', success);
      
      if (!success) {
        throw new Error('Supabase에서 레코드 삭제에 실패했습니다.');
      }
      
      setRecords(prevRecords => prevRecords.filter(record => record.id !== id));
      console.log('=== Supabase 레코드 삭제 성공 ===');
      
    } catch (error) {
      console.error('=== Supabase 레코드 삭제 오류 ===', error);
      
      let errorMessage = 'Supabase에서 데이터를 삭제하는데 실패했습니다.';
      if (error instanceof Error) {
        errorMessage = `Supabase 삭제 오류: ${error.message}`;
      }
      
      setError(errorMessage);
      throw error; // 에러를 다시 던져서 UI에서 처리할 수 있도록 함
    }
  };

  const updateRecord = async (id: string, updatedRecord: SMRecordInput) => {
    try {
      setError(null);
      console.log('=== Supabase에서 레코드 업데이트 시작, ID:', id, '===');
      console.log('업데이트 데이터:', updatedRecord);
      
      const existingRecord = records.find(r => r.id === id);
      const recordToUpdate: SMRecord = {
        ...updatedRecord,
        id,
        createdAt: existingRecord ? existingRecord.createdAt : format(new Date(), 'yyyy-MM-dd HH:mm:ss')
      };
      
      // Supabase API를 통해 데이터 업데이트
      const result = await updateRecordApi(id, recordToUpdate);
      console.log('Supabase 업데이트 결과:', result);
      
      if (!result) {
        throw new Error('Supabase에서 레코드 업데이트에 실패했습니다.');
      }
      
      // 데이터베이스에서 받은 데이터를 SMRecord 타입으로 변환
      const mappedResult: SMRecord = {
        id: String(result.id || id),
        category: String(result.category || updatedRecord.category),
        taskNo: String(result.taskno || updatedRecord.taskNo),
        year: String(result.year || updatedRecord.year),
        targetMonth: String(result.targetmonth || updatedRecord.targetMonth),
        receiptDate: String(result.receiptdate || updatedRecord.receiptDate),
        requestPath: String(result.requestpath || updatedRecord.requestPath),
        workBasisNumber: String(result.workbasisnumber || updatedRecord.workBasisNumber),
        requestTeam: String(result.requestteam || updatedRecord.requestTeam),
        requestOrgType: String(result.requestorgtype || updatedRecord.requestOrgType),
        requester: String(result.requester || updatedRecord.requester),
        lgUplusTeamName: String(result.lguplusteamname || updatedRecord.lgUplusTeamName),
        systemPart: String(result.systempart || updatedRecord.systemPart),
        targetSystemName: String(result.targetsystemname || updatedRecord.targetSystemName),
        slaSmActivity: String(result.slasmactivity || updatedRecord.slaSmActivity),
        slaSmActivityDetail: String(result.slasmactivitydetail || updatedRecord.slaSmActivityDetail),
        processType: String(result.processtype || updatedRecord.processType),
        requestContent: String(result.requestcontent || updatedRecord.requestContent),
        processContent: String(result.processcontent || updatedRecord.processContent),
        note: String(result.note || updatedRecord.note),
        smManager: String(result.smmanager || updatedRecord.smManager),
        startDate: String(result.startdate || updatedRecord.startDate),
        expectedDeployDate: String(result.expecteddeploydate || updatedRecord.expectedDeployDate),
        deployCompleted: String(result.deploycompleted || updatedRecord.deployCompleted),
        actualDeployDate: String(result.actualdeploydate || updatedRecord.actualDeployDate),
        workTimeDays: String(result.worktimedays || updatedRecord.workTimeDays),
        workTimeHours: String(result.worktimehours || updatedRecord.workTimeHours),
        workTimeMinutes: String(result.worktimeminutes || updatedRecord.workTimeMinutes),
        totalMM: String(result.totalmm || updatedRecord.totalMM),
        monthlyActualBillingMM: String(result.monthlyactualbillingmm || updatedRecord.monthlyActualBillingMM),
        errorFixRequired: String(result.errorfixrequired || updatedRecord.errorFixRequired),
        workReviewTarget: String(result.workreviewtarget || updatedRecord.workReviewTarget),
        workReviewWeek: String(result.workreviewweek || updatedRecord.workReviewWeek),
        createdAt: String(result.createdat || (existingRecord ? existingRecord.createdAt : new Date().toISOString()))
      };
      
      setRecords(
        prevRecords => prevRecords.map(record => 
          record.id === id ? mappedResult : record
        )
      );
      console.log('=== Supabase 레코드 업데이트 성공 ===');
      
    } catch (error) {
      console.error('=== Supabase 레코드 업데이트 오류 ===', error);
      
      let errorMessage = 'Supabase에서 데이터를 업데이트하는데 실패했습니다.';
      if (error instanceof Error) {
        errorMessage = `Supabase 업데이트 오류: ${error.message}`;
      }
      
      setError(errorMessage);
      throw error; // 에러를 다시 던져서 UI에서 처리할 수 있도록 함
    }
  };

  return (
    <SMContext.Provider value={{ records, addRecord, deleteRecord, updateRecord, isLoading, error }}>
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