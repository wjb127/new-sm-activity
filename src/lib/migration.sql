-- SM 이력 테이블 마이그레이션 스크립트
-- 기존 테이블을 새로운 32개 컬럼 구조로 업데이트

-- 1. 기존 컬럼명 변경 (camelCase -> lowercase)
ALTER TABLE sm_records RENAME COLUMN "taskNo" TO taskno;
ALTER TABLE sm_records RENAME COLUMN "receiptDate" TO receiptdate;
ALTER TABLE sm_records RENAME COLUMN "requestPath" TO requestpath;
ALTER TABLE sm_records RENAME COLUMN "requestTeam" TO requestteam;
ALTER TABLE sm_records RENAME COLUMN "requestContent" TO requestcontent;
ALTER TABLE sm_records RENAME COLUMN "processContent" TO processcontent;
ALTER TABLE sm_records RENAME COLUMN "smManager" TO smmanager;
ALTER TABLE sm_records RENAME COLUMN "startDate" TO startdate;
ALTER TABLE sm_records RENAME COLUMN "deployDate" TO deploydate;
ALTER TABLE sm_records RENAME COLUMN "createdAt" TO createdat;

-- 2. 기존 month 컬럼을 targetmonth로 변경
ALTER TABLE sm_records RENAME COLUMN month TO targetmonth;

-- 3. 새로운 컬럼들 추가
ALTER TABLE sm_records ADD COLUMN IF NOT EXISTS workbasisnumber TEXT;
ALTER TABLE sm_records ADD COLUMN IF NOT EXISTS requestorgtype TEXT;
ALTER TABLE sm_records ADD COLUMN IF NOT EXISTS lguplusteamname TEXT;
ALTER TABLE sm_records ADD COLUMN IF NOT EXISTS systempart TEXT;
ALTER TABLE sm_records ADD COLUMN IF NOT EXISTS targetsystemname TEXT;
ALTER TABLE sm_records ADD COLUMN IF NOT EXISTS slasmactivity TEXT;
ALTER TABLE sm_records ADD COLUMN IF NOT EXISTS slasmactivitydetail TEXT;
ALTER TABLE sm_records ADD COLUMN IF NOT EXISTS processtype TEXT DEFAULT 'SM운영';
ALTER TABLE sm_records ADD COLUMN IF NOT EXISTS expecteddeploydate TEXT;
ALTER TABLE sm_records ADD COLUMN IF NOT EXISTS deploycompleted TEXT;
ALTER TABLE sm_records ADD COLUMN IF NOT EXISTS actualdeploydate TEXT;
ALTER TABLE sm_records ADD COLUMN IF NOT EXISTS worktimedays TEXT;
ALTER TABLE sm_records ADD COLUMN IF NOT EXISTS worktimehours TEXT;
ALTER TABLE sm_records ADD COLUMN IF NOT EXISTS worktimeminutes TEXT;
ALTER TABLE sm_records ADD COLUMN IF NOT EXISTS totalmm TEXT;
ALTER TABLE sm_records ADD COLUMN IF NOT EXISTS monthlyactualbillingmm TEXT;
ALTER TABLE sm_records ADD COLUMN IF NOT EXISTS errorfixrequired TEXT;
ALTER TABLE sm_records ADD COLUMN IF NOT EXISTS workreviewtarget TEXT;
ALTER TABLE sm_records ADD COLUMN IF NOT EXISTS workreviewweek TEXT;

-- 4. 기존 deploydate 데이터를 expecteddeploydate로 복사
UPDATE sm_records SET expecteddeploydate = deploydate WHERE deploydate IS NOT NULL;

-- 5. 기존 deploydate 컬럼 삭제 (더 이상 사용하지 않음)
ALTER TABLE sm_records DROP COLUMN IF EXISTS deploydate;

-- 6. 새로운 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_sm_records_year ON sm_records(year);
CREATE INDEX IF NOT EXISTS idx_sm_records_targetmonth ON sm_records(targetmonth);
CREATE INDEX IF NOT EXISTS idx_sm_records_requestteam ON sm_records(requestteam);
CREATE INDEX IF NOT EXISTS idx_sm_records_smmanager ON sm_records(smmanager);

-- 7. 기존 데이터의 processtype을 'SM운영'으로 설정
UPDATE sm_records SET processtype = 'SM운영' WHERE processtype IS NULL;

-- 8. 테이블 구조 확인 쿼리 (실행 후 확인용)
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'sm_records' 
-- ORDER BY ordinal_position; 