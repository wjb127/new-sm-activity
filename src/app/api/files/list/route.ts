import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

console.log('=== 파일 목록 API 환경 변수 확인 ===');
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

export async function GET() {
  try {
    const startTime = Date.now();
    console.log('🚀 [파일 목록] API 호출 시작');

    // 직접 파일 목록 조회 (버킷 존재 확인 생략하여 속도 향상)
    console.log('📂 [파일 목록] 파일 목록 조회 시작...');
    const listStartTime = Date.now();
    
    const { data: files, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    const listTime = Date.now() - listStartTime;
    console.log(`⏱️ [파일 목록] Storage 조회 시간: ${listTime}ms`);

    if (error) {
      console.error('❌ [파일 목록] 파일 목록 조회 실패:', error);
      
      // 버킷이 없는 경우 빈 목록 반환
      if (error.message?.includes('not found') || error.message?.includes('does not exist')) {
        console.log('⚠️ [파일 목록] 버킷이 존재하지 않음 - 빈 목록 반환');
        return NextResponse.json({ 
          success: true,
          files: [], 
          totalCount: 0,
          message: '파일 버킷이 아직 생성되지 않았습니다.' 
        });
      }
      
      return NextResponse.json({ 
        error: `파일 목록 조회 실패: ${error.message}`,
        details: error
      }, { status: 500 });
    }

    console.log('📁 [파일 목록] 조회된 파일 수:', files?.length || 0);

    // 파일 정보 변환 최적화
    const transformStartTime = Date.now();
    const fileInfos = (files || [])
      .filter(file => file.name && !file.name.endsWith('/')) // 폴더 제외
      .map((file) => {
        // Public URL 생성 (캐시된 결과 사용 가능)
        const { data: urlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(file.name);

        // 타임스탬프 제거하여 원본 파일명 복원
        const originalName = file.name.replace(/_\d{13}\./, '.');

        return {
          id: file.name,
          name: originalName,
          size: file.metadata?.size || 0,
          type: file.metadata?.mimetype || 'application/octet-stream',
          url: urlData.publicUrl,
          uploadedAt: file.created_at || new Date().toISOString(),
        };
      });

    const transformTime = Date.now() - transformStartTime;
    console.log(`⏱️ [파일 목록] 데이터 변환 시간: ${transformTime}ms`);

    const totalTime = Date.now() - startTime;
    console.log(`✅ [파일 목록] 전체 처리 완료 (${totalTime}ms) - 파일 ${fileInfos.length}개`);

    return NextResponse.json({ 
      success: true, 
      files: fileInfos,
      totalCount: fileInfos.length,
      processingTime: totalTime
    });

  } catch (error) {
    console.error('❌ [파일 목록] API 오류:', error);
    console.error('❌ [파일 목록] 오류 상세:', JSON.stringify(error, null, 2));
    return NextResponse.json({ 
      error: '파일 목록 조회 중 서버 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
} 