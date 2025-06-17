import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

console.log('=== 파일 업로드 API 환경 변수 확인 ===');
console.log('SUPABASE_URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'undefined');
console.log('SERVICE_KEY 설정됨:', !!supabaseServiceKey);

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
    console.log('🚀 [파일 업로드] API 호출 시작');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.error('❌ [파일 업로드] 파일이 제공되지 않음');
      return NextResponse.json({ error: '파일이 제공되지 않았습니다.' }, { status: 400 });
    }

    console.log('📁 [파일 업로드] 파일 정보:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // 파일 검증
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      console.error('❌ [파일 업로드] 파일 크기 초과:', file.size);
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
      console.error('❌ [파일 업로드] 지원하지 않는 파일 형식:', file.type);
      return NextResponse.json({ error: '지원하지 않는 파일 형식입니다.' }, { status: 400 });
    }

    // 버킷 존재 확인
    console.log('🔍 [파일 업로드] 버킷 존재 확인...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ [파일 업로드] 버킷 목록 조회 실패:', listError);
    } else {
      console.log('📋 [파일 업로드] 사용 가능한 버킷들:', buckets?.map(b => b.name));
      const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
      
      if (!bucketExists) {
        console.log('⚠️ [파일 업로드] 버킷이 존재하지 않음. 생성 시도...');
        const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
          public: true,
          allowedMimeTypes: allowedTypes,
          fileSizeLimit: maxSize
        });
        
        if (createError) {
          console.error('❌ [파일 업로드] 버킷 생성 실패:', createError);
        } else {
          console.log('✅ [파일 업로드] 버킷 생성 성공');
        }
      } else {
        console.log('✅ [파일 업로드] 버킷 존재 확인됨');
      }
    }

    // 파일명에 타임스탬프 추가하여 중복 방지
    const timestamp = new Date().getTime();
    const fileExt = file.name.split('.').pop();
    const fileName = `${file.name.replace(/\.[^/.]+$/, "")}_${timestamp}.${fileExt}`;

    console.log('📤 [파일 업로드] Storage 업로드 시작:', fileName);

    // 파일을 ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Supabase Storage에 업로드
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType: file.type,
        duplex: 'half'
      });

    if (error) {
      console.error('❌ [파일 업로드] Storage 업로드 오류:', error);
      console.error('❌ [파일 업로드] 상세 오류:', JSON.stringify(error, null, 2));
      return NextResponse.json({ 
        error: `업로드 실패: ${error.message}`,
        details: error
      }, { status: 500 });
    }

    console.log('✅ [파일 업로드] Storage 업로드 성공:', data);

    // Public URL 생성
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    console.log('🔗 [파일 업로드] Public URL 생성:', urlData.publicUrl);

    const fileInfo = {
      id: fileName,
      name: file.name,
      size: file.size,
      type: file.type,
      url: urlData.publicUrl,
      uploadedAt: new Date().toISOString(),
    };

    console.log('✅ [파일 업로드] 업로드 완료:', fileInfo);

    return NextResponse.json({ success: true, file: fileInfo });

  } catch (error) {
    console.error('❌ [파일 업로드] API 오류:', error);
    console.error('❌ [파일 업로드] 오류 상세:', JSON.stringify(error, null, 2));
    return NextResponse.json({ 
      error: '서버 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
} 