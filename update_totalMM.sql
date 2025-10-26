-- =====================================================
-- SM 이력 totalMM 수정 쿼리
-- =====================================================
-- 작성일: 2025년
-- 목적: 크론잡으로 잘못 저장된 totalMM 값 수정
--
-- 문제: 30분 작업의 MM이 0.062로 잘못 저장됨
-- 해결: 올바른 계산식 적용 → 0.0029761905
--
-- 계산식: 30분 ÷ (60분 × 8시간 × 21일) = 0.0029761905
-- =====================================================

-- 1. 현재 잘못된 데이터 확인
SELECT
  id,
  category,
  taskno,
  "requestContent",
  "workTimeDays",
  "workTimeHours",
  "workTimeMinutes",
  totalmm,
  "receiptDate",
  "createdAt"
FROM sm_records
WHERE
  "workTimeMinutes" = '30'
  AND "workTimeHours" = '0'
  AND "workTimeDays" = '0'
  AND totalmm = '0.062'
ORDER BY "createdAt" DESC;

-- 2. 잘못된 totalMM 값 수정 (0.062 → 0.0029761905)
-- 주의: 아래 쿼리를 실행하기 전에 반드시 위의 SELECT 쿼리로 데이터를 확인하세요!

UPDATE sm_records
SET totalmm = '0.0029761905'
WHERE
  "workTimeMinutes" = '30'
  AND "workTimeHours" = '0'
  AND "workTimeDays" = '0'
  AND totalmm = '0.062';

-- 3. 수정 결과 확인
SELECT
  id,
  category,
  taskno,
  "requestContent",
  "workTimeDays",
  "workTimeHours",
  "workTimeMinutes",
  totalmm,
  "receiptDate",
  "createdAt"
FROM sm_records
WHERE
  "workTimeMinutes" = '30'
  AND "workTimeHours" = '0'
  AND "workTimeDays" = '0'
ORDER BY "createdAt" DESC;

-- 4. (선택사항) 특정 카테고리만 수정하고 싶은 경우
-- 대시보드 카테고리만 수정
UPDATE sm_records
SET totalmm = '0.0029761905'
WHERE
  category = '대시보드'
  AND "workTimeMinutes" = '30'
  AND "workTimeHours" = '0'
  AND "workTimeDays" = '0'
  AND totalmm = '0.062';

-- PLAN 카테고리만 수정
UPDATE sm_records
SET totalmm = '0.0029761905'
WHERE
  category = 'PLAN'
  AND "workTimeMinutes" = '30'
  AND "workTimeHours" = '0'
  AND "workTimeDays" = '0'
  AND totalmm = '0.062';

-- 5. 전체 통계 확인
SELECT
  category,
  COUNT(*) as count,
  SUM(CAST(totalmm AS DECIMAL)) as total_mm_sum
FROM sm_records
WHERE
  "workTimeMinutes" = '30'
  AND "workTimeHours" = '0'
  AND "workTimeDays" = '0'
GROUP BY category
ORDER BY category;

-- =====================================================
-- 실행 순서:
-- 1. 쿼리 1번 실행 → 수정 대상 데이터 확인
-- 2. 쿼리 2번 실행 → 전체 데이터 일괄 수정
-- 3. 쿼리 3번 실행 → 수정 결과 확인
-- 4. 쿼리 5번 실행 → 통계로 최종 확인
-- =====================================================
