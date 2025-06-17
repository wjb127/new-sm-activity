# SM 이력관리 시스템

SM(System Maintenance) 이력을 효율적으로 관리하기 위한 웹 애플리케이션입니다.

## 기능

- SM 이력 등록, 조회, 삭제
- 카테고리별 Task No 자동 생성
- 접수일자에 따른 연도, 월, 착수일자, 반영일자 자동 설정
- 이력 목록 검색 및 정렬
- 엑셀 다운로드

## 기술 스택

- Next.js
- React Hook Form
- TailwindCSS
- Supabase (데이터베이스)

## 설치 및 실행

1. 저장소 클론
```bash
git clone https://github.com/wjb127/new-sm-activity.git
cd new-sm-activity
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정
- `.env.local` 파일을 생성하고 Supabase 연결 정보를 입력합니다.
```
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

4. 개발 서버 실행
```bash
npm run dev
```

## Supabase 설정

1. [Supabase](https://supabase.com)에 가입하고 새 프로젝트를 생성합니다.
2. SQL 에디터에서 `src/lib/supabase-schema.sql` 파일의 내용을 실행하여 테이블을 생성합니다.
3. 프로젝트 설정에서 URL과 anon key를 복사하여 `.env.local` 파일에 붙여넣습니다.

## 배포

1. GitHub에 코드를 푸시합니다.
2. [Vercel](https://vercel.com)에서 GitHub 저장소를 연결하고 배포합니다.
3. 환경 변수 설정에서 Supabase URL과 anon key를 입력합니다.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 기능 소개

### 📋 SM 이력 관리
- SM 작업 이력 등록, 조회, 수정, 삭제
- 엑셀 파일 내보내기/가져오기
- 실시간 데이터베이스 연동 (Supabase)

### 📅 스케줄러 기능 (NEW!)
- **자동 데이터 생성**: 설정된 스케줄에 따라 DB에 자동으로 SM 이력 추가
- **Cron 표현식 지원**: 복잡한 스케줄링 패턴 설정 가능
- **미리 정의된 템플릿**: 주간 점검, 월간 보고서 등 자주 사용되는 작업 템플릿
- **실시간 관리**: 웹 UI에서 스케줄 추가/수정/삭제/활성화/비활성화
- **API 지원**: 외부 시스템에서 스케줄 작업 트리거 가능

### 📄 파일 관리
- 첨부 파일 업로드/다운로드
- 문서 관리 및 버전 관리

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### 스케줄러 사용법

1. **웹 UI에서 스케줄 설정**:
   - "스케줄러" 탭으로 이동
   - "새 스케줄 추가" 버튼 클릭
   - 템플릿 선택 또는 사용자 정의 설정
   - Cron 표현식 입력 (예: `0 9 * * 1` = 매주 월요일 오전 9시)

2. **API를 통한 수동 실행**:
   ```bash
   curl -X POST http://localhost:3000/api/scheduler \
     -H "Content-Type: application/json" \
     -d '{
       "taskName": "테스트 작업",
       "template": {
         "category": "기타",
         "slaSmActivity": "테스트"
       }
     }'
   ```

3. **스케줄 예제**:
   - `0 9 * * 1` - 매주 월요일 오전 9시
   - `0 17 1 * *` - 매월 1일 오후 5시
   - `0 8 * * *` - 매일 오전 8시
   - `*/30 * * * *` - 30분마다

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
