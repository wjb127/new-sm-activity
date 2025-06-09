'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  FileInfo, 
  uploadFile as uploadFileToStorage,
  getFileList,
  downloadFile as downloadFileFromStorage,
  deleteFile as deleteFileFromStorage,
  validateFileType,
  validateFileSize 
} from '@/lib/supabase-storage';

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (fileType: string): string => {
  if (fileType.includes('powerpoint') || fileType.includes('presentation')) {
    return '📊'; // PPT 아이콘
  } else if (fileType.includes('pdf')) {
    return '📄'; // PDF 아이콘
  } else if (fileType.includes('word') || fileType.includes('document')) {
    return '📝'; // Word 아이콘
  } else if (fileType.includes('excel') || fileType.includes('sheet')) {
    return '📈'; // Excel 아이콘
  }
  return '📁'; // 기본 파일 아이콘
};

export default function FileManager() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Storage에서 파일 목록 로드
  useEffect(() => {
    const loadFiles = async () => {
      try {
        setIsLoading(true);
        console.log('파일 목록 로드 시작...');
        
        const fileList = await getFileList();
        console.log('로드된 파일 목록:', fileList);
        
        setFiles(fileList);
        setIsLoading(false);
      } catch (error) {
        console.error('파일 목록 로드 오류:', error);
        setError(`파일 목록을 불러올 수 없습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        setIsLoading(false);
      }
    };

    loadFiles();
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      handleFiles(Array.from(selectedFiles));
    }
  };

  const handleFiles = async (selectedFiles: File[]) => {
    for (const file of selectedFiles) {
      if (!validateFileType(file)) {
        alert(`지원하지 않는 파일 형식입니다: ${file.name}\n지원 형식: PPT, PPTX, PDF, DOC, DOCX, XLS, XLSX`);
        continue;
      }

      if (!validateFileSize(file)) {
        alert(`파일 크기가 너무 큽니다: ${file.name}\n최대 크기: 50MB`);
        continue;
      }

      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    try {
      setIsUploading(true);
      setError(null);

      console.log('파일 업로드 시작:', file.name);

      const uploadedFile = await uploadFileToStorage(file);
      
      if (!uploadedFile) {
        throw new Error('파일 업로드에 실패했습니다.');
      }

      console.log('업로드 완료:', uploadedFile);

      setFiles(prev => [uploadedFile, ...prev]);
      alert(`${file.name} 파일이 성공적으로 업로드되었습니다!`);

    } catch (error) {
      console.error('파일 업로드 오류:', error);
      alert(`파일 업로드 중 오류가 발생했습니다: ${file.name}\n상세: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const downloadFile = async (file: FileInfo) => {
    try {
      console.log('파일 다운로드 시작:', file.name);
      
      const success = await downloadFileFromStorage(file.id, file.name);
      
      if (success) {
        console.log('다운로드 완료:', file.name);
      } else {
        throw new Error('다운로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('파일 다운로드 오류:', error);
      alert(`파일 다운로드 중 오류가 발생했습니다: ${file.name}`);
    }
  };

  const deleteFile = async (fileId: string, fileName: string) => {
    if (!confirm(`"${fileName}" 파일을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      console.log('파일 삭제 시작:', fileName);
      
      const success = await deleteFileFromStorage(fileId);
      
      if (success) {
        setFiles(prev => prev.filter(file => file.id !== fileId));
        alert(`"${fileName}" 파일이 삭제되었습니다.`);
      } else {
        throw new Error('삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('파일 삭제 오류:', error);
      alert(`파일 삭제 중 오류가 발생했습니다: ${fileName}`);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col items-center justify-center p-8">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 font-medium">파일 목록을 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex flex-col items-center justify-center p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-red-600 font-bold text-lg mb-2">파일 시스템 오류</p>
          <p className="text-gray-700 text-sm text-center mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
          >
            페이지 새로고침
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">문서 파일 관리</h2>
        <div className="text-sm text-gray-600">
          총 {files.length}개 파일
        </div>
      </div>

      {/* 파일 업로드 영역 */}
      <div 
        className={`border-2 border-dashed rounded-lg p-8 mb-6 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".ppt,.pptx,.pdf,.doc,.docx,.xls,.xlsx"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="space-y-4">
          <div className="text-6xl">📁</div>
          <div>
            <p className="text-lg font-medium text-gray-700 mb-2">
              파일을 여기로 드래그하거나 클릭하여 업로드
            </p>
            <p className="text-sm text-gray-500 mb-4">
              지원 형식: PPT, PPTX, PDF, DOC, DOCX, XLS, XLSX (최대 50MB)
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isUploading ? '업로드 중...' : '파일 선택'}
            </button>
          </div>
        </div>
      </div>

      {/* 파일 목록 */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">업로드된 파일</h3>
        
        {files.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📂</div>
            <p className="text-gray-500">업로드된 파일이 없습니다.</p>
            <p className="text-sm text-gray-400 mt-2">위의 영역에 파일을 드래그하거나 선택하여 업로드하세요.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {files.map((file) => (
              <div key={file.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="text-2xl">{getFileIcon(file.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                        <span>{formatFileSize(file.size)}</span>
                        <span>{new Date(file.uploadedAt).toLocaleDateString('ko-KR')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => downloadFile(file)}
                      className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                    >
                      다운로드
                    </button>
                    <button
                      onClick={() => deleteFile(file.id, file.name)}
                      className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 업로드 상태 표시 */}
      {isUploading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <span className="text-gray-700">파일을 업로드하는 중...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 