import { createClient } from '@supabase/supabase-js';

// Supabase 프로젝트 URL과 API 키는 환경 변수에서 가져오거나 직접 입력합니다.
// 실제 프로덕션에서는 환경 변수를 사용하는 것이 좋습니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY';

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseKey); 