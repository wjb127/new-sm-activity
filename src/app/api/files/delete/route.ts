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

export async function DELETE(request: NextRequest) {
  try {
    const { fileId } = await request.json();
    
    if (!fileId) {
      return NextResponse.json({ error: '파일 ID가 제공되지 않았습니다.' }, { status: 400 });
    }

    // 파일 삭제
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([fileId]);

    if (error) {
      console.error('파일 삭제 오류:', error);
      return NextResponse.json({ 
        error: `삭제 실패: ${error.message}` 
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: '파일이 성공적으로 삭제되었습니다.' });

  } catch (error) {
    console.error('파일 삭제 API 오류:', error);
    return NextResponse.json({ 
      error: '서버 오류가 발생했습니다.' 
    }, { status: 500 });
  }
} 