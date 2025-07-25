-- SM 이력 테이블 생성 (새로운 32개 컬럼 구조)
CREATE TABLE sm_records (
  id UUID PRIMARY KEY,
  category TEXT NOT NULL, -- 1. 카테고리
  taskno TEXT NOT NULL, -- 2. TASK NO
  year TEXT NOT NULL, -- 3. 연도(접수일자 기반으로 자동생성)
  targetmonth TEXT NOT NULL, -- 4. 대상 월(접수일자 기반으로 자동생성)
  receiptdate TEXT NOT NULL, -- 5. 접수일자
  requestpath TEXT, -- 6. 요청경로
  workbasisnumber TEXT, -- 7. 작업근거 번호
  requestteam TEXT, -- 8. 요청팀
  requestorgtype TEXT, -- 9. 요청조직구분
  requester TEXT, -- 10. 요청자
  lguplusteamname TEXT, -- 11. LG U+팀명
  systempart TEXT, -- 12. 시스템(파트)
  targetsystemname TEXT, -- 13. 대상 시스템명
  slasmactivity TEXT, -- 14. SLA SM Activity
  slasmactivitydetail TEXT, -- 15. SLA SM Activity(상세)
  processtype TEXT DEFAULT 'SM운영', -- 16. 처리구분 ('SM운영'으로 기본값)
  requestcontent TEXT NOT NULL, -- 17. 요청 내용
  processcontent TEXT, -- 18. 처리 내용
  note TEXT, -- 19. 비고
  smmanager TEXT NOT NULL, -- 20. SM 담당자
  startdate TEXT, -- 21. 착수 일자
  expecteddeploydate TEXT, -- 22. 반영(예상)일자
  deploycompleted TEXT, -- 23. 반영(종료) 여부
  actualdeploydate TEXT, -- 24. 반영(종료) 일자
  worktimedays TEXT, -- 25. 소요시간 일(day)
  worktimehours TEXT, -- 26. 소요시간 시(hour)
  worktimeminutes TEXT, -- 27. 소요시간 분(min)
  totalmm TEXT, -- 28. 최종합(MM)
  monthlyactualbillingmm TEXT, -- 29. 월별 실제 청구 MM
  errorfixrequired TEXT, -- 30. 오류 수정 여부
  workreviewtarget TEXT, -- 31. 작업리뷰 보고대상
  workreviewweek TEXT, -- 32. 작업리뷰 주차
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

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_sm_records_category ON sm_records(category);
CREATE INDEX idx_sm_records_receiptdate ON sm_records(receiptdate);
CREATE INDEX idx_sm_records_year ON sm_records(year);
CREATE INDEX idx_sm_records_targetmonth ON sm_records(targetmonth);
CREATE INDEX idx_sm_records_requestteam ON sm_records(requestteam);
CREATE INDEX idx_sm_records_smmanager ON sm_records(smmanager);
CREATE INDEX idx_sm_records_createdat ON sm_records(createdat); 