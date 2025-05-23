-- 기존 테이블 삭제 (주의: 모든 데이터가 삭제됩니다)
DROP TABLE IF EXISTS sm_records;

-- SM 이력 테이블 생성 (모든 컬럼명 소문자로 변경)
CREATE TABLE sm_records (
  id UUID PRIMARY KEY,
  category TEXT NOT NULL,
  taskno TEXT NOT NULL,
  year TEXT NOT NULL,
  month TEXT NOT NULL,
  receiptdate TEXT NOT NULL,
  requestpath TEXT,
  requestteam TEXT,
  requester TEXT,
  requestcontent TEXT NOT NULL,
  processcontent TEXT,
  note TEXT,
  smmanager TEXT NOT NULL,
  startdate TEXT,
  deploydate TEXT,
  createdat TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security 설정
ALTER TABLE sm_records ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽을 수 있도록 정책 생성
CREATE POLICY "모든 사용자가 SM 이력을 볼 수 있음" ON sm_records
  FOR SELECT USING (true);

-- 인증된 사용자만 추가/수정/삭제할 수 있도록 정책 생성
CREATE POLICY "인증된 사용자만 SM 이력을 추가할 수 있음" ON sm_records
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "인증된 사용자만 SM 이력을 수정할 수 있음" ON sm_records
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "인증된 사용자만 SM 이력을 삭제할 수 있음" ON sm_records
  FOR DELETE USING (auth.role() = 'authenticated');

-- 인덱스 생성
CREATE INDEX idx_sm_records_category ON sm_records(category);
CREATE INDEX idx_sm_records_receiptdate ON sm_records(receiptdate);
CREATE INDEX idx_sm_records_createdat ON sm_records(createdat); 

-- 모든 사용자에게 권한 부여 (개발 환경용, 실제 환경에서는 필요에 따라 조정)
ALTER TABLE sm_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_access" ON sm_records FOR ALL USING (true) WITH CHECK (true); 