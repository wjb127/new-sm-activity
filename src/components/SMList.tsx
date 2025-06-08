'use client';

import { useState, useEffect } from 'react';
import { useSM } from '@/context/SMContext';
import { SMRecord, SMRecordInput } from '@/types';
import { useForm } from 'react-hook-form';

// 테이블 스타일 상수
const thStyle = "px-2 py-1 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer";
const tdStyle = "px-2 py-1 whitespace-nowrap text-xs font-medium text-gray-900";
const tdContentStyle = "px-2 py-1 text-xs text-gray-900 max-w-[100px] truncate";

// 수정 모달 컴포넌트
function EditModal({ record, isOpen, onClose, onSave }: {
  record: SMRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: SMRecordInput) => Promise<void>;
}) {
  const { register, handleSubmit, reset, setValue, watch } = useForm<SMRecordInput>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 소요시간 필드들 watch (실시간 계산용)
  const workTimeDays = watch('workTimeDays');
  const workTimeHours = watch('workTimeHours');
  const workTimeMinutes = watch('workTimeMinutes');

  // 모달이 열릴 때 폼에 기존 데이터 설정
  useEffect(() => {
    if (record && isOpen) {
      Object.keys(record).forEach((key) => {
        if (key !== 'id' && key !== 'createdAt') {
          setValue(key as keyof SMRecordInput, record[key as keyof SMRecord] || '');
        }
      });
    }
  }, [record, isOpen, setValue]);

  // 소요시간 변경 시 최종합(MM) 자동 계산
  useEffect(() => {
    const days = parseFloat(workTimeDays) || 0;
    const hours = parseFloat(workTimeHours) || 0;
    const minutes = parseFloat(workTimeMinutes) || 0;
    
    // 최종합 = 일/21 + 시/21/8 + 분/21/8/60
    const totalMM = days / 21 + hours / (21 * 8) + minutes / (21 * 8 * 60);
    
    // 소수점 3자리까지 반올림
    const roundedTotalMM = Math.round(totalMM * 1000) / 1000;
    
    setValue('totalMM', roundedTotalMM.toString());
  }, [workTimeDays, workTimeHours, workTimeMinutes, setValue]);

  const onSubmit = async (data: SMRecordInput) => {
    if (!record) return;
    
    setIsSubmitting(true);
    try {
      await onSave(record.id, data);
      onClose();
      reset();
    } catch (error) {
      console.error('수정 중 오류:', error);
      alert('수정 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">SM 이력 수정</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-red-600 mb-1">카테고리</label>
                <input {...register('category')} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">TASK NO</label>
                <input {...register('taskNo')} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">연도</label>
                <input {...register('year')} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">대상 월</label>
                <input {...register('targetMonth')} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-red-600 mb-1">접수일자</label>
                <input {...register('receiptDate')} type="date" className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-red-600 mb-1">요청경로</label>
                <input {...register('requestPath')} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">작업근거 번호</label>
                <input {...register('workBasisNumber')} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-red-600 mb-1">요청팀</label>
                <input {...register('requestTeam')} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">요청조직구분</label>
                <input {...register('requestOrgType')} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-red-600 mb-1">요청자</label>
                <input {...register('requester')} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LG U+팀명</label>
                <input {...register('lgUplusTeamName')} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">시스템(파트)</label>
                <input {...register('systemPart')} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">대상 시스템명</label>
                <input {...register('targetSystemName')} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SLA SM Activity</label>
                <input {...register('slaSmActivity')} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SLA SM Activity(상세)</label>
                <input {...register('slaSmActivityDetail')} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">처리구분</label>
                <input {...register('processType')} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" defaultValue="SM운영" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-red-600 mb-1">요청 내용</label>
                <textarea {...register('requestContent')} rows={3} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-red-600 mb-1">처리 내용</label>
                <textarea {...register('processContent')} rows={3} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">비고</label>
                <textarea {...register('note')} rows={2} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SM 담당자</label>
                <input {...register('smManager')} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">착수 일자</label>
                <input {...register('startDate')} type="date" className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">반영(예상)일자</label>
                <input {...register('expectedDeployDate')} type="date" className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">반영(종료) 여부</label>
                <select {...register('deployCompleted')} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm">
                  <option value="">선택</option>
                  <option value="반영(처리)완료">반영(처리)완료</option>
                  <option value="진행중">진행중</option>
                  <option value="대기">대기</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">반영(종료) 일자</label>
                <input {...register('actualDeployDate')} type="date" className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">소요시간 일(day)</label>
                <input {...register('workTimeDays')} type="number" className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-red-600 mb-1">소요시간 시(hour)</label>
                <input {...register('workTimeHours')} type="number" className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-red-600 mb-1">소요시간 분(min)</label>
                <input {...register('workTimeMinutes')} type="number" className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">최종합(MM)</label>
                <input {...register('totalMM')} type="number" step="0.001" className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-gray-100" readOnly />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">월별 실제 청구 MM</label>
                <input {...register('monthlyActualBillingMM')} type="number" step="0.01" className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">오류 수정 여부</label>
                <select {...register('errorFixRequired')} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm">
                  <option value="">선택</option>
                  <option value="예">예</option>
                  <option value="아니오">아니오</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">작업리뷰 보고대상</label>
                <input {...register('workReviewTarget')} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">작업리뷰 주차</label>
                <input {...register('workReviewWeek')} className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm" />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? '저장 중...' : '저장'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function SMList() {
  const { records, deleteRecord, updateRecord, isLoading, error } = useSM();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof SMRecord>('receiptDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [editingRecord, setEditingRecord] = useState<SMRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // 검색 및 정렬 기능
  const filteredRecords = records
    .filter(record => {
      const searchLower = searchTerm.toLowerCase();
      return (
        record.taskNo.toLowerCase().includes(searchLower) ||
        record.category.toLowerCase().includes(searchLower) ||
        record.requestTeam.toLowerCase().includes(searchLower) ||
        record.requester.toLowerCase().includes(searchLower) ||
        record.requestContent.toLowerCase().includes(searchLower) ||
        record.processContent?.toLowerCase().includes(searchLower) ||
        record.note?.toLowerCase().includes(searchLower) ||
        record.smManager.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      const fieldA = a[sortField] || '';
      const fieldB = b[sortField] || '';
      
      if (sortDirection === 'asc') {
        return fieldA.localeCompare(fieldB);
      } else {
        return fieldB.localeCompare(fieldA);
      }
    });

  // 정렬 변경 함수
  const handleSort = (field: keyof SMRecord) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 삭제 확인 함수
  const handleDelete = async (id: string) => {
    if (window.confirm('정말로 이 SM 이력을 삭제하시겠습니까?')) {
      try {
        await deleteRecord(id);
      } catch (error) {
        console.error('삭제 중 오류가 발생했습니다:', error);
        alert('삭제 중 오류가 발생했습니다.');
      }
    }
  };

  // 수정 모달 열기
  const handleEdit = (record: SMRecord) => {
    setEditingRecord(record);
    setIsEditModalOpen(true);
  };

  // 수정 모달 닫기
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingRecord(null);
  };

  // 수정 저장
  const handleSaveEdit = async (id: string, data: SMRecordInput) => {
    await updateRecord(id, data);
  };

  // 카테고리와 Task No 결합
  const getFullTaskNo = (record: SMRecord) => {
    return `${record.category}-${record.taskNo}`;
  };

  // 엑셀 다운로드 함수
  const downloadExcel = () => {
    // CSV 형식의 데이터 생성
    const headers = [
      '카테고리', 'TASK NO', '연도', '대상 월', '접수일자', '요청경로', '작업근거 번호',
      '요청팀', '요청조직구분', '요청자', 'LG U+팀명', '시스템(파트)', '대상 시스템명',
      'SLA SM Activity', 'SLA SM Activity(상세)', '처리구분', '요청 내용', '처리 내용',
      '비고', 'SM 담당자', '착수 일자', '반영(예상)일자', '반영(종료) 여부', '반영(종료) 일자',
      '소요시간 일(day)', '소요시간 시(hour)', '소요시간 분(min)', '최종합(MM)',
      '월별 실제 청구 MM', '오류 수정 여부', '작업리뷰 보고대상', '작업리뷰 주차'
    ];
    
    let csvContent = '\uFEFF'; // BOM for UTF-8 encoding
    csvContent += headers.join(',') + '\n';
    
    filteredRecords.forEach(record => {
      // 쉼표가 포함된 필드는 따옴표로 감싸기
      const wrapIfComma = (text: string) => {
        if (!text) return '';
        return text.includes(',') ? `"${text}"` : text;
      };
      
      const row = [
        wrapIfComma(record.category),
        getFullTaskNo(record),
        record.year,
        record.targetMonth,
        record.receiptDate,
        wrapIfComma(record.requestPath || ''),
        wrapIfComma(record.workBasisNumber || ''),
        wrapIfComma(record.requestTeam),
        wrapIfComma(record.requestOrgType || ''),
        wrapIfComma(record.requester),
        wrapIfComma(record.lgUplusTeamName || ''),
        wrapIfComma(record.systemPart || ''),
        wrapIfComma(record.targetSystemName || ''),
        wrapIfComma(record.slaSmActivity || ''),
        wrapIfComma(record.slaSmActivityDetail || ''),
        wrapIfComma(record.processType || 'SM운영'),
        wrapIfComma(record.requestContent),
        wrapIfComma(record.processContent || ''),
        wrapIfComma(record.note || ''),
        wrapIfComma(record.smManager),
        record.startDate || '',
        record.expectedDeployDate || '',
        record.deployCompleted || '',
        record.actualDeployDate || '',
        record.workTimeDays || '',
        record.workTimeHours || '',
        record.workTimeMinutes || '',
        record.totalMM || '',
        record.monthlyActualBillingMM || '',
        record.errorFixRequired || '',
        wrapIfComma(record.workReviewTarget || ''),
        wrapIfComma(record.workReviewWeek || '')
      ];
      
      csvContent += row.join(',') + '\n';
    });
    
    // CSV 파일 다운로드
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `SM이력_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 로딩 중일 때 표시
  if (isLoading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md max-w-full mx-auto">
        <div className="flex flex-col items-center justify-center p-4">
          <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-2"></div>
          <p className="text-gray-600 font-medium text-sm">데이터를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  // 오류가 있을 때 표시
  if (error) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md max-w-full mx-auto">
        <div className="flex flex-col items-center justify-center p-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-red-600 font-medium text-base mb-1">데이터베이스 연결 오류</p>
          <p className="text-gray-600 text-sm text-center">{error}</p>
          <p className="text-gray-600 text-xs mt-2 text-center">
            .env.local 파일에 올바른 Supabase 연결 정보가 설정되어 있는지 확인하세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white p-4 rounded-lg shadow-md max-w-full mx-auto">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold text-gray-800">SM 이력 목록</h2>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="검색..."
              className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-black font-medium text-xs"
            />
            <button 
              onClick={downloadExcel}
              className="px-2 py-1 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              엑셀 다운로드
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-md border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className={`${thStyle} w-[60px]`} onClick={() => handleSort('category')}>
                  카테고리 {sortField === 'category' && <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                </th>
                <th className={`${thStyle} w-[80px]`} onClick={() => handleSort('taskNo')}>
                  TASK NO {sortField === 'taskNo' && <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                </th>
                <th className={`${thStyle} w-[50px]`} onClick={() => handleSort('year')}>
                  연도 {sortField === 'year' && <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                </th>
                <th className={`${thStyle} w-[50px]`} onClick={() => handleSort('targetMonth')}>
                  대상월 {sortField === 'targetMonth' && <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                </th>
                <th className={`${thStyle} w-[80px]`} onClick={() => handleSort('receiptDate')}>
                  접수일자 {sortField === 'receiptDate' && <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                </th>
                <th className={`${thStyle} w-[80px]`}>요청경로</th>
                <th className={`${thStyle} w-[80px]`}>작업근거번호</th>
                <th className={`${thStyle} w-[80px]`} onClick={() => handleSort('requestTeam')}>
                  요청팀 {sortField === 'requestTeam' && <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                </th>
                <th className={`${thStyle} w-[80px]`}>요청조직구분</th>
                <th className={`${thStyle} w-[80px]`} onClick={() => handleSort('requester')}>
                  요청자 {sortField === 'requester' && <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                </th>
                <th className={`${thStyle} w-[80px]`}>LG U+팀명</th>
                <th className={`${thStyle} w-[80px]`}>시스템(파트)</th>
                <th className={`${thStyle} w-[100px]`}>대상시스템명</th>
                <th className={`${thStyle} w-[100px]`}>SLA SM Activity</th>
                <th className={`${thStyle} w-[120px]`}>SLA SM Activity(상세)</th>
                <th className={`${thStyle} w-[80px]`}>처리구분</th>
                <th className={`${thStyle} w-[150px]`}>요청내용</th>
                <th className={`${thStyle} w-[150px]`}>처리내용</th>
                <th className={`${thStyle} w-[100px]`}>비고</th>
                <th className={`${thStyle} w-[80px]`} onClick={() => handleSort('smManager')}>
                  SM담당자 {sortField === 'smManager' && <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                </th>
                <th className={`${thStyle} w-[80px]`} onClick={() => handleSort('startDate')}>
                  착수일자 {sortField === 'startDate' && <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                </th>
                <th className={`${thStyle} w-[80px]`}>반영(예상)일자</th>
                <th className={`${thStyle} w-[80px]`}>반영(종료)여부</th>
                <th className={`${thStyle} w-[80px]`}>반영(종료)일자</th>
                <th className={`${thStyle} w-[60px]`}>소요시간(일)</th>
                <th className={`${thStyle} w-[60px]`}>소요시간(시)</th>
                <th className={`${thStyle} w-[60px]`}>소요시간(분)</th>
                <th className={`${thStyle} w-[80px]`}>최종합(MM)</th>
                <th className={`${thStyle} w-[80px]`}>월별실제청구MM</th>
                <th className={`${thStyle} w-[80px]`}>오류수정여부</th>
                <th className={`${thStyle} w-[100px]`}>작업리뷰보고대상</th>
                <th className={`${thStyle} w-[80px]`}>작업리뷰주차</th>
                <th className="relative px-2 py-1 w-[100px]">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className={tdStyle}>{record.category}</td>
                    <td className={tdStyle}>{getFullTaskNo(record)}</td>
                    <td className={tdStyle}>{record.year}</td>
                    <td className={tdStyle}>{record.targetMonth}</td>
                    <td className={tdStyle}>{record.receiptDate}</td>
                    <td className={tdContentStyle}>{record.requestPath || '-'}</td>
                    <td className={tdContentStyle}>{record.workBasisNumber || '-'}</td>
                    <td className={tdStyle}>{record.requestTeam}</td>
                    <td className={tdContentStyle}>{record.requestOrgType || '-'}</td>
                    <td className={tdStyle}>{record.requester}</td>
                    <td className={tdContentStyle}>{record.lgUplusTeamName || '-'}</td>
                    <td className={tdContentStyle}>{record.systemPart || '-'}</td>
                    <td className={tdContentStyle}>{record.targetSystemName || '-'}</td>
                    <td className={tdContentStyle}>{record.slaSmActivity || '-'}</td>
                    <td className={tdContentStyle}>{record.slaSmActivityDetail || '-'}</td>
                    <td className={tdStyle}>{record.processType || 'SM운영'}</td>
                    <td className={tdContentStyle}>{record.requestContent}</td>
                    <td className={tdContentStyle}>{record.processContent || '-'}</td>
                    <td className={tdContentStyle}>{record.note || '-'}</td>
                    <td className={tdStyle}>{record.smManager}</td>
                    <td className={tdStyle}>{record.startDate || '-'}</td>
                    <td className={tdStyle}>{record.expectedDeployDate || '-'}</td>
                    <td className={tdStyle}>{record.deployCompleted || '-'}</td>
                    <td className={tdStyle}>{record.actualDeployDate || '-'}</td>
                    <td className={tdStyle}>{record.workTimeDays || '-'}</td>
                    <td className={tdStyle}>{record.workTimeHours || '-'}</td>
                    <td className={tdStyle}>{record.workTimeMinutes || '-'}</td>
                    <td className={tdStyle}>{record.totalMM || '-'}</td>
                    <td className={tdStyle}>{record.monthlyActualBillingMM || '-'}</td>
                    <td className={tdStyle}>{record.errorFixRequired || '-'}</td>
                    <td className={tdContentStyle}>{record.workReviewTarget || '-'}</td>
                    <td className={tdStyle}>{record.workReviewWeek || '-'}</td>
                    <td className="px-2 py-1 whitespace-nowrap text-right text-xs space-x-1">
                      <button
                        onClick={() => handleEdit(record)}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(record.id)}
                        className="text-red-600 hover:text-red-900 font-medium"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={33} className="px-2 py-2 text-center text-xs font-medium text-gray-800">
                    {searchTerm ? '검색 결과가 없습니다.' : 'SM 이력이 없습니다. 새로운 이력을 등록해주세요.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          총 {filteredRecords.length}개의 이력이 있습니다.
        </div>
      </div>

      {/* 수정 모달 */}
      <EditModal
        record={editingRecord}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSaveEdit}
      />
    </>
  );
} 