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
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/files/upload', {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || '파일 업로드에 실패했습니다.');
  }

  return result.file;
}

// 파일 목록 조회
export async function getFileList(): Promise<FileInfo[]> {
  const response = await fetch('/api/files/list');
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || '파일 목록 조회에 실패했습니다.');
  }

  return result.files;
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