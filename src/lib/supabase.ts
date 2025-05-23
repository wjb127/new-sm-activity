import { createClient } from '@supabase/supabase-js';

// Supabase 프로젝트 URL과 API 키는 환경 변수에서 가져옵니다.
// 환경 변수가 없는 경우 개발 환경에서만 사용할 더미 값을 사용합니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Supabase 클라이언트 생성
// 환경 변수가 없는 경우 빈 문자열을 사용하여 개발 환경에서만 오류 메시지를 표시합니다.
export const supabase = createClient(
  supabaseUrl || 'https://example.com',
  supabaseKey || 'dummy-key'
); 