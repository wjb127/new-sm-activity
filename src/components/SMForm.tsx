'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { SMRecordInput, TaskCategory } from '@/types';
import { useSM } from '@/context/SMContext';
import { format, parse } from 'date-fns';

// 입력 필드용 공통 스타일
const inputStyle = "w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-black font-medium text-sm";
const readOnlyInputStyle = "w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-100 text-black font-medium text-sm";
const textareaStyle = "w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-black font-medium text-sm";
const selectStyle = "w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-black font-medium text-sm";

// 카테고리 옵션
const categoryOptions: TaskCategory[] = ["대시보드", "PLAN", "기타"];

export default function SMForm() {
  const { addRecord, records, isLoading } = useSM();
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<SMRecordInput>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentYear, setCurrentYear] = useState('');
  const [currentMonth, setCurrentMonth] = useState('');
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
    setCurrentYear(new Date().getFullYear().toString());
    setCurrentMonth((new Date().getMonth() + 1).toString().padStart(2, '0'));
    setToday(format(new Date(), 'yyyy-MM-dd'));
  }, []);

  // 카테고리별 다음 Task No 계산
  useEffect(() => {
    if (records.length === 0) {
      // 초기 상태 유지
      return;
    }

    // 각 카테고리별 최대 번호 찾기
    const maxNumbers: Record<string, number> = {
      '대시보드': 0,
      'PLAN': 0,
      '기타': 0
    };

    // 기존 records에서 각 카테고리별 최대 번호 찾기
    records.forEach(record => {
      const numericPart = parseInt(record.taskNo, 10);
      if (!isNaN(numericPart)) {
        // 카테고리가 기존에 있으면 해당 카테고리의 최대값 업데이트
        if (record.category in maxNumbers) {
          maxNumbers[record.category] = Math.max(maxNumbers[record.category], numericPart);
        } else {
          // 새로운 카테고리라면 해당 카테고리에 대한 최대값 초기화
          maxNumbers[record.category] = numericPart;
        }
      }
    });

    // 각 카테고리별 다음 번호 계산 (최대값 + 1)
    const nextNumbers: Record<string, number> = {};
    Object.keys(maxNumbers).forEach(category => {
      nextNumbers[category] = maxNumbers[category] + 1;
    });

    // 기타 카테고리들에 대한 기본값도 설정
    setNextTaskNumbers(prev => ({
      ...prev,
      ...nextNumbers
    }));
  }, [records]);

  // 폼 초기값 설정
  useEffect(() => {
    if (currentYear && currentMonth && today) {
      setValue('year', currentYear);
      setValue('month', currentMonth);
      setValue('receiptDate', today);
      setValue('startDate', today);
      setValue('deployDate', today);
      setValue('smManager', '위승빈');
      setValue('category', '대시보드'); // 기본 카테고리 설정
      
      // 현재 선택된 카테고리에 맞는 번호 설정
      if (category && nextTaskNumbers[category]) {
        setValue('taskNo', nextTaskNumbers[category].toString());
      } else {
        setValue('taskNo', nextTaskNumbers['대시보드'].toString());
      }
    }
  }, [setValue, currentYear, currentMonth, today, nextTaskNumbers, category]);

  // 카테고리 변경 시 해당 카테고리의 다음 번호로 Task No 업데이트
  useEffect(() => {
    if (category && nextTaskNumbers[category]) {
      setValue('taskNo', nextTaskNumbers[category].toString());
    } else if (category === '기타' && customCategory) {
      // 기타 카테고리의 경우 커스텀 이름에 따라 다른 번호 부여
      if (nextTaskNumbers[customCategory]) {
        setValue('taskNo', nextTaskNumbers[customCategory].toString());
      } else {
        setValue('taskNo', '1'); // 새로운 커스텀 카테고리는 1부터 시작
      }
    }
  }, [category, customCategory, nextTaskNumbers, setValue]);

  // 접수일자 변경 시 연도, 월, 착수일자, 반영일자 자동 업데이트
  useEffect(() => {
    if (receiptDate) {
      try {
        const dateObj = parse(receiptDate, 'yyyy-MM-dd', new Date());
        const year = format(dateObj, 'yyyy');
        const month = format(dateObj, 'MM');
        
        setValue('year', year);
        setValue('month', month);
        setValue('startDate', receiptDate); // 착수일자도 접수일자와 같게 설정
        setValue('deployDate', receiptDate); // 반영일자도 접수일자와 같게 설정
      } catch (error) {
        console.error('날짜 파싱 중 오류:', error);
      }
    }
  }, [receiptDate, setValue]);

  const onSubmit = async (data: SMRecordInput) => {
    setIsSubmitting(true);
    try {
      // 기타 카테고리인 경우 customCategory 사용
      const finalCategory = data.category === '기타' ? customCategory : data.category;
      
      const finalData = {
        ...data,
        category: finalCategory
      };
      
      addRecord(finalData);
      
      // 제출 후 해당 카테고리의 다음 번호 증가
      setNextTaskNumbers(prev => ({
        ...prev,
        [finalCategory]: (prev[finalCategory] || 0) + 1
      }));
      
      // 다음 번호 계산
      const nextNumber = nextTaskNumbers[finalCategory] ? nextTaskNumbers[finalCategory] + 1 : 1;
      
      reset({
        category: data.category,
        taskNo: nextNumber.toString(),
        year: data.year,
        month: data.month,
        receiptDate: data.receiptDate,
        requestPath: '',
        requestTeam: '',
        requester: '',
        requestContent: '',
        processContent: '',
        note: '',
        smManager: '위승빈',
        startDate: data.receiptDate,
        deployDate: data.receiptDate,
      });
      
      alert('SM 이력이 성공적으로 등록되었습니다.');
    } catch (error) {
      console.error('등록 중 오류가 발생했습니다:', error);
      alert('등록 중 오류가 발생했습니다.');
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
          <p className="text-gray-600 font-medium">데이터를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  // 카테고리와 Task No 결합하여 표시
  const getFullTaskNo = () => {
    const displayCategory = category === '기타' ? customCategory : category;
    const taskNo = category ? nextTaskNumbers[category === '기타' ? customCategory : category] : '';
    return displayCategory && taskNo ? `${displayCategory}-${taskNo}` : '';
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md max-w-5xl mx-auto">
      <h2 className="text-xl font-bold mb-3 text-gray-800">SM 이력 등록</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {/* 카테고리 및 Task No 섹션 */}
        <div className="bg-gray-50 p-2 rounded-md mb-2">
          <h3 className="text-sm font-medium text-gray-700 mb-2">기본 정보</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {/* 카테고리 선택 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">카테고리</label>
              <select
                {...register('category', { required: '카테고리는 필수입니다' })}
                className={selectStyle}
              >
                {categoryOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
            </div>

            {/* 기타 카테고리 입력 필드 */}
            {showCustomCategory && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">커스텀 카테고리</label>
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className={inputStyle}
                  placeholder="카테고리 이름 입력"
                  required
                />
              </div>
            )}

            {/* Task No 표시 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">번호</label>
              <input
                type="text"
                {...register('taskNo', { required: '번호는 필수입니다' })}
                className={readOnlyInputStyle}
                readOnly
              />
            </div>

            {/* 전체 Task No 미리보기 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">전체 Task No</label>
              <input
                type="text"
                value={getFullTaskNo()}
                className={readOnlyInputStyle}
                readOnly
              />
            </div>
          </div>
        </div>

        {/* 날짜 정보 섹션 */}
        <div className="bg-gray-50 p-2 rounded-md mb-2">
          <h3 className="text-sm font-medium text-gray-700 mb-2">날짜 정보</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {/* 접수일자 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">접수일자</label>
              <input
                type="date"
                {...register('receiptDate', { required: '접수일자는 필수입니다' })}
                className={inputStyle}
              />
              {errors.receiptDate && <p className="text-red-500 text-xs mt-1">{errors.receiptDate.message}</p>}
            </div>

            {/* 연도 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">연도</label>
              <input
                type="text"
                {...register('year', { required: '연도는 필수입니다' })}
                className={readOnlyInputStyle}
                readOnly
              />
            </div>

            {/* 월 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">월</label>
              <input
                type="text"
                {...register('month', { required: '월은 필수입니다' })}
                className={readOnlyInputStyle}
                readOnly
              />
            </div>

            {/* 착수일자 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">착수일자</label>
              <input
                type="date"
                {...register('startDate')}
                className={inputStyle}
                readOnly
              />
            </div>

            {/* 반영일자 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">반영일자</label>
              <input
                type="date"
                {...register('deployDate')}
                className={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* 요청 정보 섹션 */}
        <div className="bg-gray-50 p-2 rounded-md mb-2">
          <h3 className="text-sm font-medium text-gray-700 mb-2">요청 정보</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {/* 요청경로 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">요청경로</label>
              <input
                type="text"
                {...register('requestPath')}
                className={inputStyle}
                placeholder="예: 이메일, 전화, 회의 등"
              />
            </div>

            {/* 요청팀 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">요청팀</label>
              <input
                type="text"
                {...register('requestTeam')}
                className={inputStyle}
                placeholder="요청한 팀명"
              />
            </div>

            {/* 요청자 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">요청자</label>
              <input
                type="text"
                {...register('requester')}
                className={inputStyle}
                placeholder="요청자명"
              />
            </div>

            {/* SM 담당자 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">SM 담당자</label>
              <input
                type="text"
                {...register('smManager')}
                className={inputStyle}
                placeholder="담당자명"
                defaultValue="위승빈"
              />
            </div>
          </div>
        </div>

        {/* 내용 섹션 */}
        <div className="bg-gray-50 p-2 rounded-md mb-2">
          <h3 className="text-sm font-medium text-gray-700 mb-2">내용</h3>
          <div className="space-y-2">
            {/* 요청내용 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">요청내용</label>
              <textarea
                {...register('requestContent', { required: '요청내용은 필수입니다' })}
                rows={2}
                className={textareaStyle}
                placeholder="요청 내용을 입력하세요"
              ></textarea>
              {errors.requestContent && <p className="text-red-500 text-xs mt-1">{errors.requestContent.message}</p>}
            </div>

            {/* 처리내용 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">처리내용</label>
              <textarea
                {...register('processContent')}
                rows={2}
                className={textareaStyle}
                placeholder="처리 내용을 입력하세요"
              ></textarea>
            </div>

            {/* 비고 */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">비고</label>
              <textarea
                {...register('note')}
                rows={1}
                className={textareaStyle}
                placeholder="추가 정보가 있으면 입력하세요"
              ></textarea>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? '등록 중...' : 'SM 이력 등록'}
          </button>
        </div>
      </form>
    </div>
  );
} 