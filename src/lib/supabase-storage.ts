import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface FileInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
  uploadedBy?: string;
}

const BUCKET_NAME = 'sm-documents';

// 스토리지 버킷 초기화 (필요시)
export async function initializeBucket() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some((bucket: any) => bucket.name === BUCKET_NAME);
    
    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: false, // 보안을 위해 private으로 설정
        allowedMimeTypes: [
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ],
        fileSizeLimit: 52428800 // 50MB
      });
      
      if (error) {
        console.error('버킷 생성 오류:', error);
      }
    }
  } catch (error) {
    console.error('버킷 초기화 오류:', error);
  }
}

// 파일 업로드
export async function uploadFile(file: File, folder: string = ''): Promise<FileInfo | null> {
  try {
    // 파일명에 타임스탬프 추가하여 중복 방지
    const timestamp = new Date().getTime();
    const fileExt = file.name.split('.').pop();
    const fileName = `${file.name.replace(/\.[^/.]+$/, "")}_${timestamp}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file);

    if (error) {
      throw error;
    }

    // 파일 정보를 데이터베이스에 저장
    const fileInfo: Omit<FileInfo, 'url'> = {
      id: data.path,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date().toISOString(),
    };

    const { error: dbError } = await supabase
      .from('file_uploads')
      .insert(fileInfo);

    if (dbError) {
      console.error('파일 정보 저장 오류:', dbError);
      // 파일은 업로드되었지만 DB 저장 실패시 파일 삭제
      await supabase.storage.from(BUCKET_NAME).remove([data.path]);
      throw dbError;
    }

    // 다운로드 URL 생성
    const { data: urlData } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(data.path, 3600); // 1시간 유효

    return {
      ...fileInfo,
      url: urlData?.signedUrl || ''
    };

  } catch (error) {
    console.error('파일 업로드 오류:', error);
    return null;
  }
}

// 파일 목록 조회
export async function getFileList(): Promise<FileInfo[]> {
  try {
    const { data, error } = await supabase
      .from('file_uploads')
      .select('*')
      .order('uploadedAt', { ascending: false });

    if (error) {
      throw error;
    }

    // 각 파일의 다운로드 URL 생성
    const filesWithUrls = await Promise.all(
              (data || []).map(async (file: any) => {
        const { data: urlData } = await supabase.storage
          .from(BUCKET_NAME)
          .createSignedUrl(file.id, 3600);

        return {
          ...file,
          url: urlData?.signedUrl || ''
        };
      })
    );

    return filesWithUrls;
  } catch (error) {
    console.error('파일 목록 조회 오류:', error);
    return [];
  }
}

// 파일 다운로드
export async function downloadFile(fileId: string, fileName: string) {
  try {
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

// 파일 삭제
export async function deleteFile(fileId: string): Promise<boolean> {
  try {
    // 스토리지에서 파일 삭제
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([fileId]);

    if (storageError) {
      throw storageError;
    }

    // 데이터베이스에서 파일 정보 삭제
    const { error: dbError } = await supabase
      .from('file_uploads')
      .delete()
      .eq('id', fileId);

    if (dbError) {
      throw dbError;
    }

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