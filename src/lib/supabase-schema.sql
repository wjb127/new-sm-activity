-- SM 이력 테이블 생성
CREATE TABLE sm_records (
  id UUID PRIMARY KEY,
  category TEXT NOT NULL,
  taskNo TEXT NOT NULL,
  year TEXT NOT NULL,
  month TEXT NOT NULL,
  receiptDate TEXT NOT NULL,
  requestPath TEXT,
  requestTeam TEXT,
  requester TEXT,
  requestContent TEXT NOT NULL,
  processContent TEXT,
  note TEXT,
  smManager TEXT NOT NULL,
  startDate TEXT,
  deployDate TEXT,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
CREATE INDEX idx_sm_records_receiptDate ON sm_records(receiptDate);
CREATE INDEX idx_sm_records_createdAt ON sm_records(createdAt); 