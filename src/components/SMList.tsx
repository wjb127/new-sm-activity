'use client';

import { useState } from 'react';
import { useSM } from '@/context/SMContext';
import { SMRecord } from '@/types';

// 테이블 스타일 상수
const thStyle = "px-2 py-1 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer";
const tdStyle = "px-2 py-1 whitespace-nowrap text-xs font-medium text-gray-900";
const tdContentStyle = "px-2 py-1 text-xs text-gray-900 max-w-[150px] truncate";

export default function SMList() {
  const { records, deleteRecord, isLoading } = useSM();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof SMRecord>('receiptDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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

  // 카테고리와 Task No 결합
  const getFullTaskNo = (record: SMRecord) => {
    return `${record.category}-${record.taskNo}`;
  };

  // 엑셀 다운로드 함수
  const downloadExcel = () => {
    // CSV 형식의 데이터 생성
    const headers = [
      '카테고리', 'Task No', '접수일자', '요청팀', '요청자', '요청내용', 
      '처리내용', '비고', '담당자', '착수일자', '반영일자'
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
        record.receiptDate,
        wrapIfComma(record.requestTeam),
        wrapIfComma(record.requester),
        wrapIfComma(record.requestContent),
        wrapIfComma(record.processContent || ''),
        wrapIfComma(record.note || ''),
        wrapIfComma(record.smManager),
        record.startDate || '',
        record.deployDate || ''
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
      <div className="bg-white p-4 rounded-lg shadow-md max-w-5xl mx-auto">
        <div className="flex flex-col items-center justify-center p-4">
          <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-2"></div>
          <p className="text-gray-600 font-medium text-sm">데이터를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md max-w-5xl mx-auto">
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
        <table className="min-w-full divide-y divide-gray-200 table-fixed">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className={`${thStyle} w-[8%]`}
                onClick={() => handleSort('category')}
              >
                카테고리
                {sortField === 'category' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th
                scope="col"
                className={`${thStyle} w-[8%]`}
                onClick={() => handleSort('taskNo')}
              >
                Task No
                {sortField === 'taskNo' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th
                scope="col"
                className={`${thStyle} w-[8%]`}
                onClick={() => handleSort('receiptDate')}
              >
                접수일자
                {sortField === 'receiptDate' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th
                scope="col"
                className={`${thStyle} w-[8%]`}
                onClick={() => handleSort('requestTeam')}
              >
                요청팀
                {sortField === 'requestTeam' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th
                scope="col"
                className={`${thStyle} w-[15%]`}
              >
                요청내용
              </th>
              <th
                scope="col"
                className={`${thStyle} w-[15%]`}
              >
                처리내용
              </th>
              <th
                scope="col"
                className={`${thStyle} w-[10%]`}
              >
                비고
              </th>
              <th
                scope="col"
                className={`${thStyle} w-[8%]`}
                onClick={() => handleSort('smManager')}
              >
                담당자
                {sortField === 'smManager' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th
                scope="col"
                className={`${thStyle} w-[8%]`}
                onClick={() => handleSort('deployDate')}
              >
                반영일자
                {sortField === 'deployDate' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th scope="col" className="relative px-2 py-1 w-[5%]">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredRecords.length > 0 ? (
              filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className={tdStyle}>
                    {record.category}
                  </td>
                  <td className={tdStyle}>
                    {getFullTaskNo(record)}
                  </td>
                  <td className={tdStyle}>
                    {record.receiptDate}
                  </td>
                  <td className={tdStyle}>
                    {record.requestTeam}
                  </td>
                  <td className={tdContentStyle}>
                    {record.requestContent}
                  </td>
                  <td className={tdContentStyle}>
                    {record.processContent || '-'}
                  </td>
                  <td className={tdContentStyle}>
                    {record.note || '-'}
                  </td>
                  <td className={tdStyle}>
                    {record.smManager}
                  </td>
                  <td className={tdStyle}>
                    {record.deployDate || '-'}
                  </td>
                  <td className="px-2 py-1 whitespace-nowrap text-right text-xs">
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
                <td colSpan={10} className="px-2 py-2 text-center text-xs font-medium text-gray-800">
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
  );
} 