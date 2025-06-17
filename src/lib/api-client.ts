export interface FileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
}

// 파일 업로드
export async function uploadFile(file: File): Promise<FileInfo> {
  console.log('🔄 [API-CLIENT] 업로드 요청 준비 중...');
  console.log('📄 [API-CLIENT] 파일 세부 정보:', {
    name: file.name,
    size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
    type: file.type
  });

  const formData = new FormData();
  formData.append('file', file);

  console.log('📤 [API-CLIENT] API 호출 시작: /api/files/upload');
  const startTime = Date.now();

  try {
    const response = await fetch('/api/files/upload', {
      method: 'POST',
      body: formData,
    });

    const fetchTime = Date.now() - startTime;
    console.log(`⏱️ [API-CLIENT] API 응답 시간: ${fetchTime}ms`);
    
    console.log('📊 [API-CLIENT] 응답 상태:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    const parseStartTime = Date.now();
    const result = await response.json();
    const parseTime = Date.now() - parseStartTime;
    
    console.log(`📝 [API-CLIENT] JSON 파싱 시간: ${parseTime}ms`);
    console.log('📋 [API-CLIENT] 응답 데이터:', result);

    if (!response.ok) {
      console.error('❌ [API-CLIENT] 업로드 실패:', result);
      throw new Error(result.error || '파일 업로드에 실패했습니다.');
    }

    const totalTime = Date.now() - startTime;
    console.log(`✅ [API-CLIENT] 업로드 성공 (총 ${totalTime}ms)`);

    return result.file;
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ [API-CLIENT] 업로드 오류 (${totalTime}ms):`, error);
    
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('네트워크 연결 오류: 서버에 연결할 수 없습니다.');
    }
    
    throw error;
  }
}

// 파일 목록 조회
export async function getFileList(): Promise<FileInfo[]> {
  console.log('🔄 [API-CLIENT] 파일 목록 조회 시작...');
  const startTime = Date.now();

  try {
    const response = await fetch('/api/files/list');
    
    const fetchTime = Date.now() - startTime;
    console.log(`⏱️ [API-CLIENT] 목록 조회 응답 시간: ${fetchTime}ms`);
    
    const parseStartTime = Date.now();
    const result = await response.json();
    const parseTime = Date.now() - parseStartTime;
    
    console.log(`📝 [API-CLIENT] JSON 파싱 시간: ${parseTime}ms`);

    if (!response.ok) {
      console.error('❌ [API-CLIENT] 목록 조회 실패:', result);
      throw new Error(result.error || '파일 목록 조회에 실패했습니다.');
    }

    const totalTime = Date.now() - startTime;
    console.log(`✅ [API-CLIENT] 목록 조회 성공 (총 ${totalTime}ms, 파일 ${result.files?.length || 0}개)`);

    return result.files;
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ [API-CLIENT] 목록 조회 오류 (${totalTime}ms):`, error);
    throw error;
  }
}

// 파일 다운로드
export async function downloadFile(fileId: string, fileName: string): Promise<void> {
  const response = await fetch(`/api/files/download/${encodeURIComponent(fileId)}`);

  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.error || '파일 다운로드에 실패했습니다.');
  }

  // 파일 다운로드
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 파일 삭제
export async function deleteFile(fileId: string): Promise<void> {
  const response = await fetch('/api/files/delete', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fileId }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || '파일 삭제에 실패했습니다.');
  }
}

// 파일 타입 검증
export function validateFileType(file: File): boolean {
  const allowedTypes = [
    'application/vnd.ms-powerpoint', // .ppt
    'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
    'application/pdf', // .pdf
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-excel', // .xls
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
  ];

  return allowedTypes.includes(file.type);
}

// 파일 크기 검증 (50MB)
export function validateFileSize(file: File): boolean {
  const maxSize = 50 * 1024 * 1024; // 50MB in bytes
  return file.size <= maxSize;
} 