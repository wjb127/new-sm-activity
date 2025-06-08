'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { SMRecord, SMRecordInput } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { fetchRecords, addRecord as addRecordApi, deleteRecord as deleteRecordApi, updateRecord as updateRecordApi } from '@/lib/supabase';

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
  error: string | null;
}

const SMContext = createContext<SMContextType | undefined>(undefined);

export function SMProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<SMRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // API를 통해 데이터 불러오기
  useEffect(() => {
    async function loadRecords() {
      try {
        setIsLoading(true);
        setError(null);
        console.log('데이터 로딩 시작...');
        
        // API를 통해 데이터 가져오기
        const data = await fetchRecords();
        console.log('API에서 가져온 데이터:', data);
        
        // API 호출이 성공하고 데이터가 있는 경우
        if (data && data.length > 0) {
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
          console.log('API 데이터 로드 성공, 레코드 수:', mappedData.length);
          
          // 백업 저장
          localStorage.setItem('smRecords', JSON.stringify(mappedData));
          console.log('로컬 스토리지에 백업 저장 완료');
        } 
        // API 호출은 성공했지만 데이터가 없는 경우 로컬 스토리지에서 불러오기
        else {
          console.log('API에서 데이터를 찾을 수 없음, 로컬 스토리지에서 불러오기 시도');
          try {
            const savedRecords = localStorage.getItem('smRecords');
            if (savedRecords) {
              const parsedRecords = JSON.parse(savedRecords) as LegacySMRecord[];
              console.log('로컬 스토리지에서 불러온 데이터:', parsedRecords);
              
              const updatedRecords = parsedRecords.map(record => ({
                ...record,
                category: record.category || '대시보드'
              }));
              
              setRecords(updatedRecords as SMRecord[]);
              console.log('로컬 스토리지에서 데이터 로드 성공, 레코드 수:', updatedRecords.length);
            } else {
              console.log('로컬 스토리지에 데이터가 없음');
            }
          } catch (localError) {
            console.error('로컬 데이터 불러오기 오류:', localError);
          }
        }
      } catch (error) {
        console.error('데이터 불러오기 오류:', error);
        
        // API 연결 실패 시 로컬 스토리지에서 백업 데이터 불러오기
        console.log('API 연결 실패, 로컬 스토리지에서 불러오기 시도');
        try {
          const savedRecords = localStorage.getItem('smRecords');
          if (savedRecords) {
            const parsedRecords = JSON.parse(savedRecords) as LegacySMRecord[];
            console.log('로컬 스토리지에서 불러온 데이터:', parsedRecords);
            
            const updatedRecords = parsedRecords.map(record => ({
              ...record,
              category: record.category || '대시보드'
            }));
            
            setRecords(updatedRecords as SMRecord[]);
            console.log('로컬 스토리지에서 데이터 로드 성공, 레코드 수:', updatedRecords.length);
          } else {
            console.log('로컬 스토리지에 데이터가 없음');
            setError('데이터를 불러올 수 없습니다. 로컬 스토리지에도 데이터가 없습니다.');
          }
        } catch (localError) {
          console.error('로컬 데이터 불러오기 오류:', localError);
          setError('데이터를 불러올 수 없습니다. 로컬 스토리지 접근에도 실패했습니다.');
        }
      } finally {
        setIsLoading(false);
        console.log('데이터 로딩 완료');
      }
    }
    
    loadRecords();
  }, []);

  // 로컬 스토리지에 백업 데이터 저장
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem('smRecords', JSON.stringify(records));
        console.log('레코드 상태 변경, 로컬 스토리지에 백업 저장 완료');
      } catch (error) {
        console.error('로컬 데이터 저장 오류:', error);
      }
    }
  }, [records, isLoading]);

  const addRecord = async (record: SMRecordInput) => {
    try {
      setError(null);
      console.log('=== SM 이력 등록 시작 ===');
      console.log('입력된 레코드 데이터:', record);
      
      const newRecord: SMRecord = {
        ...record,
        id: uuidv4(),
        createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      };
      
      console.log('생성된 새 레코드 (ID 포함):', newRecord);
      
      // API를 통해 데이터 추가
      const result = await addRecordApi(newRecord);
      console.log('API 추가 결과 반환값:', result);
      
      // 결과가 성공적으로 반환되었는지 확인
      if (result) {
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
        console.log('=== SM 이력 등록 성공 ===');
        console.log('현재 총 레코드 수:', records.length + 1);
      } else {
        console.error('=== API에서 레코드 추가 실패 ===');
        // API 실패 시에도 로컬에는 추가
        setRecords(prevRecords => [...prevRecords, newRecord]);
      }
    } catch (error) {
      console.error('=== SM 이력 등록 오류 ===', error);
      // 오류 발생 시에도 로컬에 추가
      const newRecord: SMRecord = {
        ...record,
        id: uuidv4(),
        createdAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      };
      setRecords(prevRecords => [...prevRecords, newRecord]);
      setError('API 연결에 실패했습니다. 데이터는 로컬 스토리지에만 저장됩니다.');
    }
  };

  const deleteRecord = async (id: string) => {
    try {
      setError(null);
      console.log('레코드 삭제 시작, ID:', id);
      
      // API를 통해 데이터 삭제
      const success = await deleteRecordApi(id);
      console.log('API 삭제 결과:', success);
      
      if (success) {
        setRecords(prevRecords => prevRecords.filter(record => record.id !== id));
        console.log('레코드 삭제 성공');
      } else {
        console.error('API에서 레코드 삭제 실패');
        // API 실패 시에도 로컬에서는 삭제
        setRecords(prevRecords => prevRecords.filter(record => record.id !== id));
      }
    } catch (error) {
      console.error('레코드 삭제 오류:', error);
      // 오류 발생 시에도 로컬에서 삭제
      setRecords(prevRecords => prevRecords.filter(record => record.id !== id));
      setError('API 연결에 실패했습니다. 데이터는 로컬 스토리지에서만 삭제됩니다.');
    }
  };

  const updateRecord = async (id: string, updatedRecord: SMRecordInput) => {
    try {
      setError(null);
      console.log('레코드 업데이트 시작, ID:', id, '데이터:', updatedRecord);
      
      const existingRecord = records.find(r => r.id === id);
      const recordToUpdate: SMRecord = {
        ...updatedRecord,
        id,
        createdAt: existingRecord ? existingRecord.createdAt : format(new Date(), 'yyyy-MM-dd HH:mm:ss')
      };
      
      // API를 통해 데이터 업데이트
      const result = await updateRecordApi(id, recordToUpdate);
      console.log('API 업데이트 결과:', result);
      
      if (result) {
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
        console.log('레코드 업데이트 성공');
      } else {
        console.error('API에서 레코드 업데이트 실패');
        // API 실패 시에도 로컬에서는 업데이트
        setRecords(
          prevRecords => prevRecords.map(record => 
            record.id === id 
              ? { 
                  ...recordToUpdate, 
                  createdAt: existingRecord ? existingRecord.createdAt : new Date().toISOString() 
                } 
              : record
          )
        );
      }
    } catch (error) {
      console.error('레코드 업데이트 오류:', error);
      // 오류 발생 시에도 로컬에서 업데이트
      const existingRecord = records.find(r => r.id === id);
      const recordToUpdate: SMRecord = {
        ...updatedRecord,
        id,
        createdAt: existingRecord ? existingRecord.createdAt : format(new Date(), 'yyyy-MM-dd HH:mm:ss')
      };
      setRecords(
        prevRecords => prevRecords.map(record => 
          record.id === id 
            ? { 
                ...recordToUpdate, 
                createdAt: existingRecord ? existingRecord.createdAt : new Date().toISOString() 
              } 
            : record
        )
      );
      setError('API 연결에 실패했습니다. 데이터는 로컬 스토리지에서만 업데이트됩니다.');
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