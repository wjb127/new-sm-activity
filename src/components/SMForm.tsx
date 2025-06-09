'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { SMRecordInput, TaskCategory } from '@/types';
import { useSM } from '@/context/SMContext';
import { format } from 'date-fns';

// 입력 필드용 공통 스타일 (크기 절반으로 축소)
const inputStyle = "w-full px-1 py-0.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-black font-medium text-xs";
const readOnlyInputStyle = "w-full px-1 py-0.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-100 text-black font-medium text-xs";
const selectStyle = "w-full px-1 py-0.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-black font-medium text-xs";

// 카테고리 옵션
const categoryOptions: TaskCategory[] = ["대시보드", "PLAN", "기타"];

export default function SMForm() {
  const { addRecord, records, isLoading, error } = useSM();
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<SMRecordInput>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [today, setToday] = useState('');
  const [nextTaskNumbers, setNextTaskNumbers] = useState<Record<string, number>>({
    '대시보드': 1,
    'PLAN': 1,
    '기타': 1
  });
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);

  // 접수일자와 카테고리 watch
  const receiptDate = watch('receiptDate');
  const category = watch('category');
  
  // 소요시간 필드들 watch (실시간 계산용)
  const workTimeDays = watch('workTimeDays');
  const workTimeHours = watch('workTimeHours');
  const workTimeMinutes = watch('workTimeMinutes');

  // 기타 카테고리 선택 시 커스텀 카테고리 입력 필드 표시
  useEffect(() => {
    if (category === '기타') {
      setShowCustomCategory(true);
    } else {
      setShowCustomCategory(false);
      setCustomCategory('');
    }
  }, [category]);

  // 컴포넌트 마운트 시 기본값 설정
  useEffect(() => {
    // 클라이언트 측에서만 날짜 계산
    setToday(format(new Date(), 'yyyy-MM-dd'));
  }, []);

  // 접수일자 변경 시 연도, 대상월, 착수일자, 반영(예상)일자, 반영(종료) 일자 자동 설정
  useEffect(() => {
    if (receiptDate) {
      try {
        const date = new Date(receiptDate);
        const year = date.getFullYear().toString();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        
        setValue('year', year);
        setValue('targetMonth', month);
        setValue('startDate', receiptDate);
        setValue('expectedDeployDate', receiptDate);
        setValue('actualDeployDate', receiptDate);
      } catch (error) {
        console.error('날짜 파싱 오류:', error);
      }
    }
  }, [receiptDate, setValue]);

  // 기존 레코드에서 다음 Task No 계산
  useEffect(() => {
    const taskNumbers: Record<string, number> = {
      '대시보드': 1,
      'PLAN': 1,
      '기타': 1
    };

    records.forEach(record => {
      const taskNoNum = parseInt(record.taskNo, 10);
      if (!isNaN(taskNoNum)) {
        if (taskNumbers[record.category] <= taskNoNum) {
          taskNumbers[record.category] = taskNoNum + 1;
        }
      }
    });

    setNextTaskNumbers(taskNumbers);
  }, [records]);

  // 카테고리 변경 시 Task No 자동 설정
  useEffect(() => {
    if (category && nextTaskNumbers[category]) {
      setValue('taskNo', nextTaskNumbers[category].toString());
    }
  }, [category, nextTaskNumbers, setValue]);

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

  // 폼 초기값 설정
  useEffect(() => {
    if (today) {
      setValue('receiptDate', today);
      setValue('startDate', today);
      setValue('expectedDeployDate', today);
      setValue('smManager', '위승빈');
      setValue('processType', 'SM운영');
    }
  }, [today, setValue]);

  const onSubmit = async (data: SMRecordInput) => {
    try {
      setIsSubmitting(true);
      console.log('폼 제출 데이터:', data);
      
      await addRecord(data);
      
      // 성공 시 폼 초기화 (기본값 유지)
      const nextTaskNo = nextTaskNumbers[data.category] ? (nextTaskNumbers[data.category] + 1).toString() : '1';
      
      reset({
        category: data.category, // 카테고리 유지
        taskNo: nextTaskNo, // 다음 번호로 자동 증가
        year: data.year, // 연도 유지
        targetMonth: data.targetMonth, // 대상월 유지
        receiptDate: data.receiptDate, // 접수일자 유지
        requestPath: data.requestPath, // 요청경로 유지
        workBasisNumber: '', // 작업근거번호는 초기화
        requestTeam: data.requestTeam, // 요청팀 유지
        requestOrgType: data.requestOrgType, // 요청조직구분 유지
        requester: data.requester, // 요청자 유지
        lgUplusTeamName: data.lgUplusTeamName, // LG U+팀명 유지
        systemPart: data.systemPart, // 시스템(파트) 유지
        targetSystemName: data.targetSystemName, // 대상 시스템명 유지
        slaSmActivity: data.slaSmActivity, // SLA SM Activity 유지
        slaSmActivityDetail: data.slaSmActivityDetail, // SLA SM Activity(상세) 유지
        processType: data.processType, // 처리구분 유지
        requestContent: data.requestContent, // 요청 내용 유지
        processContent: data.processContent, // 처리 내용 유지
        note: data.note, // 비고 유지
        smManager: data.smManager, // SM 담당자 유지
        startDate: data.receiptDate, // 착수일자는 접수일자와 동일
        expectedDeployDate: data.receiptDate, // 반영(예상)일자는 접수일자와 동일
        deployCompleted: data.deployCompleted, // 반영(종료) 여부 유지
        actualDeployDate: data.receiptDate, // 반영(종료) 일자는 접수일자와 동일
        workTimeDays: data.workTimeDays, // 소요시간 유지
        workTimeHours: data.workTimeHours, // 소요시간 유지
        workTimeMinutes: data.workTimeMinutes, // 소요시간 유지
        totalMM: data.totalMM, // 최종합(MM) 유지
        monthlyActualBillingMM: data.monthlyActualBillingMM, // 월별 실제 청구 MM 유지
        errorFixRequired: data.errorFixRequired, // 오류 수정 여부 유지
        workReviewTarget: data.workReviewTarget, // 작업리뷰 보고대상 유지
        workReviewWeek: data.workReviewWeek // 작업리뷰 주차 유지
      });
      
      // Task No 증가
      setNextTaskNumbers(prev => ({
        ...prev,
        [data.category]: (prev[data.category] || 0) + 1
      }));
      
      alert('SM 이력이 성공적으로 등록되었습니다!');
      
    } catch (error) {
      console.error('등록 중 오류가 발생했습니다:', error);
      
      let errorMessage = 'SM 이력 등록에 실패했습니다.';
      if (error instanceof Error) {
        if (error.message.includes('Supabase')) {
          errorMessage = `데이터베이스 오류: ${error.message}`;
        } else if (error.message.includes('환경 변수')) {
          errorMessage = 'Supabase 설정이 올바르지 않습니다. 관리자에게 문의하세요.';
        } else if (error.message.includes('네트워크') || error.message.includes('fetch')) {
          errorMessage = '네트워크 연결을 확인하고 다시 시도해주세요.';
        } else {
          errorMessage = error.message;
        }
      }
      
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 로딩 중일 때 표시
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col items-center justify-center p-8">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 font-medium">Supabase 연결 중입니다...</p>
          <p className="text-gray-500 text-sm mt-2">데이터베이스에서 정보를 불러오고 있습니다.</p>
        </div>
      </div>
    );
  }

  // 오류가 있을 때 표시
  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col items-center justify-center p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-red-600 font-bold text-lg mb-2">Supabase 연결 실패</p>
          <p className="text-gray-700 text-sm text-center mb-4 max-w-md">{error}</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md">
            <p className="text-yellow-800 text-xs font-medium mb-2">해결 방법:</p>
            <ul className="text-yellow-700 text-xs space-y-1">
              <li>• 인터넷 연결 상태를 확인하세요</li>
              <li>• .env.local 파일의 Supabase 설정을 확인하세요</li>
              <li>• 페이지를 새로고침해보세요</li>
              <li>• 문제가 지속되면 관리자에게 문의하세요</li>
            </ul>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            페이지 새로고침
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-3 rounded-lg shadow-md max-w-6xl mx-auto">
      <h2 className="text-lg font-bold text-gray-800 mb-3">SM 이력 등록</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {/* 기본 정보 섹션 */}
        <div className="border-b border-gray-200 pb-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">기본 정보</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
                          <div>
                <label className="block text-xs font-medium text-red-600 mb-0.5">카테고리 *</label>
              <select
                {...register('category', { required: '카테고리를 선택해주세요' })}
                className={selectStyle}
              >
                <option value="">카테고리 선택</option>
                {categoryOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
            </div>

            {showCustomCategory && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">커스텀 카테고리 *</label>
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className={inputStyle}
                  placeholder="카테고리명 입력"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">TASK NO *</label>
              <input
                {...register('taskNo', { required: 'Task No를 입력해주세요' })}
                className={readOnlyInputStyle}
                readOnly
              />
              {errors.taskNo && <p className="text-red-500 text-xs mt-1">{errors.taskNo.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">연도</label>
              <input
                {...register('year')}
                className={readOnlyInputStyle}
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">대상 월</label>
              <input
                {...register('targetMonth')}
                className={readOnlyInputStyle}
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-red-600 mb-1">접수일자 *</label>
              <input
                {...register('receiptDate', { required: '접수일자를 선택해주세요' })}
                type="date"
                className={inputStyle}
              />
              {errors.receiptDate && <p className="text-red-500 text-xs mt-1">{errors.receiptDate.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-red-600 mb-1">요청경로</label>
              <input
                {...register('requestPath')}
                className={inputStyle}
                placeholder="요청경로 입력"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">작업근거 번호</label>
              <input
                {...register('workBasisNumber')}
                className={inputStyle}
                placeholder="작업근거 번호 입력"
              />
            </div>
          </div>
        </div>

        {/* 요청자 정보 섹션 */}
        <div className="border-b border-gray-200 pb-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">요청자 정보</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
            <div>
              <label className="block text-sm font-medium text-red-600 mb-1">요청팀 *</label>
              <input
                {...register('requestTeam', { required: '요청팀을 입력해주세요' })}
                className={inputStyle}
                defaultValue="경영지원시스템팀"
                placeholder="요청팀 입력"
              />
              {errors.requestTeam && <p className="text-red-500 text-xs mt-1">{errors.requestTeam.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">요청조직구분</label>
              <input
                {...register('requestOrgType')}
                className={inputStyle}
                defaultValue="SM운영조직(LGCNS/협력업체)"
                placeholder="요청조직구분 입력"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-red-600 mb-1">요청자 *</label>
              <input
                {...register('requester', { required: '요청자를 입력해주세요' })}
                className={inputStyle}
                defaultValue="한상명"
                placeholder="요청자 입력"
              />
              {errors.requester && <p className="text-red-500 text-xs mt-1">{errors.requester.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LG U+팀명</label>
              <input
                {...register('lgUplusTeamName')}
                className={inputStyle}
                defaultValue="경영분석팀"
                placeholder="LG U+팀명 입력"
              />
            </div>
          </div>
        </div>

        {/* 시스템 정보 섹션 */}
        <div className="border-b border-gray-200 pb-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">시스템 정보</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">시스템(파트)</label>
              <input
                {...register('systemPart')}
                className={inputStyle}
                defaultValue="경영관리시스템"
                placeholder="시스템(파트) 입력"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">대상 시스템명</label>
              <input
                {...register('targetSystemName')}
                className={inputStyle}
                defaultValue="경영관리 시스템(USIS)"
                placeholder="대상 시스템명 입력"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SLA SM Activity</label>
              <input
                {...register('slaSmActivity')}
                className={inputStyle}
                placeholder="SLA SM Activity 입력"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SLA SM Activity(상세)</label>
              <input
                {...register('slaSmActivityDetail')}
                className={inputStyle}
                placeholder="SLA SM Activity 상세 입력"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">처리구분</label>
              <input
                {...register('processType')}
                className={readOnlyInputStyle}
                value="SM운영"
                readOnly
              />
            </div>
          </div>
        </div>

        {/* 작업 내용 섹션 */}
        <div className="border-b border-gray-200 pb-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">작업 내용</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-red-600 mb-1">요청 내용 *</label>
              <input
                {...register('requestContent', { required: '요청 내용을 입력해주세요' })}
                className={inputStyle}
                placeholder="요청 내용을 입력해주세요"
                list="requestContentOptions"
              />
              <datalist id="requestContentOptions">
                <option value="시스템 오류 수정 요청" />
                <option value="데이터 수정 요청" />
                <option value="화면 개선 요청" />
                <option value="신규 기능 개발 요청" />
                <option value="배치 프로그램 수정 요청" />
                <option value="권한 설정 요청" />
                <option value="인터페이스 오류 수정" />
                <option value="성능 개선 요청" />
                <option value="보고서 수정 요청" />
                <option value="메뉴 추가/수정 요청" />
                <option value="코드 관리 요청" />
                <option value="DB 스키마 변경 요청" />
                <option value="시스템 설정 변경 요청" />
                <option value="사용자 매뉴얼 업데이트 요청" />
                <option value="테스트 환경 구성 요청" />
              </datalist>
              {errors.requestContent && <p className="text-red-500 text-xs mt-1">{errors.requestContent.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-red-600 mb-1">처리 내용</label>
              <input
                {...register('processContent')}
                className={inputStyle}
                placeholder="처리 내용을 입력해주세요"
                list="processContentOptions"
              />
              <datalist id="processContentOptions">
                <option value="시스템 오류 수정 완료" />
                <option value="데이터 수정 완료" />
                <option value="화면 개선 완료" />
                <option value="신규 기능 개발 완료" />
                <option value="배치 프로그램 수정 완료" />
                <option value="권한 설정 완료" />
                <option value="인터페이스 오류 수정 완료" />
                <option value="성능 개선 완료" />
                <option value="보고서 수정 완료" />
                <option value="메뉴 추가/수정 완료" />
                <option value="코드 관리 완료" />
                <option value="DB 스키마 변경 완료" />
                <option value="시스템 설정 변경 완료" />
                <option value="사용자 매뉴얼 업데이트 완료" />
                <option value="테스트 환경 구성 완료" />
                <option value="검토 중" />
                <option value="개발 진행 중" />
                <option value="테스트 진행 중" />
                <option value="승인 대기 중" />
                <option value="배포 예정" />
              </datalist>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">비고</label>
              <input
                {...register('note')}
                className={inputStyle}
                placeholder="추가 사항이나 특이사항을 입력해주세요"
                list="noteOptions"
              />
              <datalist id="noteOptions">
                <option value="긴급 처리 요청" />
                <option value="정기 점검 시 처리" />
                <option value="사용자 교육 필요" />
                <option value="추가 테스트 필요" />
                <option value="관련 부서 협의 필요" />
                <option value="보안 검토 필요" />
                <option value="성능 테스트 필요" />
                <option value="문서화 필요" />
                <option value="백업 후 처리" />
                <option value="야간 작업 예정" />
              </datalist>
            </div>
          </div>
        </div>

        {/* 일정 및 담당자 섹션 */}
        <div className="border-b border-gray-200 pb-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">일정 및 담당자</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SM 담당자 *</label>
              <input
                {...register('smManager', { required: 'SM 담당자를 입력해주세요' })}
                className={inputStyle}
                placeholder="SM 담당자 입력"
              />
              {errors.smManager && <p className="text-red-500 text-xs mt-1">{errors.smManager.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">착수 일자</label>
              <input
                {...register('startDate')}
                type="date"
                className={readOnlyInputStyle}
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">반영(예상)일자</label>
              <input
                {...register('expectedDeployDate')}
                type="date"
                className={readOnlyInputStyle}
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">반영(종료) 여부</label>
              <select
                {...register('deployCompleted')}
                className={selectStyle}
                defaultValue="반영(처리)완료"
              >
                <option value="">선택</option>
                <option value="반영(처리)완료">반영(처리)완료</option>
                <option value="진행중">진행중</option>
                <option value="대기">대기</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">반영(종료) 일자</label>
              <input
                {...register('actualDeployDate')}
                type="date"
                className={readOnlyInputStyle}
                readOnly
              />
            </div>
          </div>
        </div>

        {/* 소요시간 및 MM 섹션 */}
        <div className="border-b border-gray-200 pb-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">소요시간 및 MM</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">소요시간 일(day)</label>
              <input
                {...register('workTimeDays')}
                type="number"
                min="0"
                className={inputStyle}
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-red-600 mb-1">소요시간 시(hour)</label>
              <input
                {...register('workTimeHours')}
                type="number"
                min="0"
                max="23"
                className={inputStyle}
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-red-600 mb-1">소요시간 분(min)</label>
              <input
                {...register('workTimeMinutes')}
                type="number"
                min="0"
                max="59"
                className={inputStyle}
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">최종합(MM)</label>
              <input
                {...register('totalMM')}
                type="number"
                step="0.001"
                min="0"
                className={readOnlyInputStyle}
                placeholder="0.000"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">월별 실제 청구 MM</label>
              <input
                {...register('monthlyActualBillingMM')}
                type="number"
                step="0.01"
                min="0"
                className={inputStyle}
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">오류 수정 여부</label>
              <select
                {...register('errorFixRequired')}
                className={selectStyle}
              >
                <option value="">선택</option>
                <option value="예">예</option>
                <option value="아니오">아니오</option>
              </select>
            </div>
          </div>
        </div>

        {/* 작업리뷰 섹션 */}
        <div className="pb-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">작업리뷰</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">작업리뷰 보고대상</label>
              <input
                {...register('workReviewTarget')}
                className={inputStyle}
                defaultValue="비대상"
                placeholder="작업리뷰 보고대상 입력"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">작업리뷰 주차</label>
              <input
                {...register('workReviewWeek')}
                className={inputStyle}
                placeholder="작업리뷰 주차 입력 (예: 2024-01주차)"
              />
            </div>
          </div>
        </div>

        {/* 제출 버튼 */}
        <div className="flex justify-end space-x-2 pt-3 border-t border-gray-200">
          <button
            type="button"
            onClick={() => reset()}
            className="px-3 py-1 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 text-xs"
          >
            초기화
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
          >
            {isSubmitting ? '등록 중...' : 'SM 이력 등록'}
          </button>
        </div>
      </form>
    </div>
  );
} 