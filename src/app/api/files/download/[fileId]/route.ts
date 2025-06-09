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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;
    
    if (!fileId) {
      return NextResponse.json({ error: '파일 ID가 제공되지 않았습니다.' }, { status: 400 });
    }

    // 파일 다운로드
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(fileId);

    if (error) {
      console.error('파일 다운로드 오류:', error);
      return NextResponse.json({ 
        error: `다운로드 실패: ${error.message}` 
      }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: '파일을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 파일의 원본 이름 추출 (타임스탬프 제거)
    const originalName = fileId.replace(/_\d+\.([^.]+)$/, '.$1');

    // Response 헤더 설정
    const headers = new Headers();
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(originalName)}"`);
    headers.set('Content-Type', data.type || 'application/octet-stream');

    return new NextResponse(data, { headers });

  } catch (error) {
    console.error('파일 다운로드 API 오류:', error);
    return NextResponse.json({ 
      error: '서버 오류가 발생했습니다.' 
    }, { status: 500 });
  }
} 