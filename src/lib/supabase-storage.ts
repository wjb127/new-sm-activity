import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 환경 변수 디버깅
console.log('=== Supabase Storage 환경 변수 확인 ===');
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'undefined');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? `${supabaseKey.substring(0, 30)}...` : 'undefined');

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase 환경 변수가 설정되지 않았습니다!');
  throw new Error('Supabase 환경 변수가 누락되었습니다. .env.local 파일을 확인하세요.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Supabase 클라이언트 생성 완료');

export interface FileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
}

const BUCKET_NAME = 'ppt';

// 파일 업로드 (Storage만 사용, DB 연동 제거)
export async function uploadFile(file: File, folder: string = ''): Promise<FileInfo | null> {
  try {
    // 파일명에 타임스탬프 추가하여 중복 방지
    const timestamp = new Date().getTime();
    const fileExt = file.name.split('.').pop();
    const fileName = `${file.name.replace(/\.[^/.]+$/, "")}_${timestamp}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    console.log('Storage 업로드 시작:', filePath);

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file);

    if (error) {
      console.error('Storage 업로드 오류:', error);
      throw error;
    }

    console.log('Storage 업로드 성공:', data);

    // Public URL 생성
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    const fileInfo: FileInfo = {
      id: filePath,
      name: file.name,
      size: file.size,
      type: file.type,
      url: urlData.publicUrl,
      uploadedAt: new Date().toISOString(),
    };

    return fileInfo;

  } catch (error) {
    console.error('파일 업로드 오류:', error);
    return null;
  }
}

// 파일 목록 조회 (Storage만 사용)
export async function getFileList(): Promise<FileInfo[]> {
  try {
    console.log('Storage 파일 목록 조회 시작');

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', {
        limit: 100,
        offset: 0
      });

    if (error) {
      console.error('파일 목록 조회 오류:', error);
      throw error;
    }

    console.log('Storage 파일 목록:', data);

    // 파일 정보를 FileInfo 형식으로 변환
    const fileInfos: FileInfo[] = (data || []).map((file: any) => {
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(file.name);

      return {
        id: file.name,
        name: file.name,
        size: file.metadata?.size || 0,
        type: file.metadata?.mimetype || 'application/octet-stream',
        url: urlData.publicUrl,
        uploadedAt: file.created_at || new Date().toISOString(),
      };
    });

    return fileInfos;
  } catch (error) {
    console.error('파일 목록 조회 오류:', error);
    return [];
  }
}

// 파일 다운로드
export async function downloadFile(fileId: string, fileName: string) {
  try {
    console.log('Storage 파일 다운로드 시작:', fileId);

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(fileId);

    if (error) {
      throw error;
    }

    // 파일 다운로드
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('파일 다운로드 오류:', error);
    return false;
  }
}

// 파일 삭제 (Storage만 사용)
export async function deleteFile(fileId: string): Promise<boolean> {
  try {
    console.log('Storage 파일 삭제 시작:', fileId);

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([fileId]);

    if (error) {
      throw error;
    }

    console.log('Storage 파일 삭제 성공');
    return true;
  } catch (error) {
    console.error('파일 삭제 오류:', error);
    return false;
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