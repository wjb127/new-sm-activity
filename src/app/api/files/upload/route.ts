import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service Role Key를 사용하여 권한 문제 우회
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const BUCKET_NAME = 'ppt';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: '파일이 제공되지 않았습니다.' }, { status: 400 });
    }

    // 파일 검증
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: '파일 크기가 50MB를 초과합니다.' }, { status: 400 });
    }

    const allowedTypes = [
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: '지원하지 않는 파일 형식입니다.' }, { status: 400 });
    }

    // 파일명에 타임스탬프 추가하여 중복 방지
    const timestamp = new Date().getTime();
    const fileExt = file.name.split('.').pop();
    const fileName = `${file.name.replace(/\.[^/.]+$/, "")}_${timestamp}.${fileExt}`;

    // 파일을 ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Supabase Storage에 업로드
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType: file.type,
        duplex: 'half'
      });

    if (error) {
      console.error('Storage 업로드 오류:', error);
      return NextResponse.json({ 
        error: `업로드 실패: ${error.message}` 
      }, { status: 500 });
    }

    // Public URL 생성
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    const fileInfo = {
      id: fileName,
      name: file.name,
      size: file.size,
      type: file.type,
      url: urlData.publicUrl,
      uploadedAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, file: fileInfo });

  } catch (error) {
    console.error('파일 업로드 API 오류:', error);
    return NextResponse.json({ 
      error: '서버 오류가 발생했습니다.' 
    }, { status: 500 });
  }
} 