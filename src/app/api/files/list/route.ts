import { NextResponse } from 'next/server';
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

export async function GET() {
  try {
    // 파일 목록 조회
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', {
        limit: 100,
        offset: 0
      });

    if (error) {
      console.error('파일 목록 조회 오류:', error);
      return NextResponse.json({ 
        error: `목록 조회 실패: ${error.message}` 
      }, { status: 500 });
    }

    // 파일 정보를 표준 형식으로 변환
    const fileInfos = (data || []).map((file) => {
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

    return NextResponse.json({ success: true, files: fileInfos });

  } catch (error) {
    console.error('파일 목록 조회 API 오류:', error);
    return NextResponse.json({ 
      error: '서버 오류가 발생했습니다.' 
    }, { status: 500 });
  }
} 