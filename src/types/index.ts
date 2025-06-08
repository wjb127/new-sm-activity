export interface SMRecord {
  id: string;
  category: string; // 1. 카테고리
  taskNo: string; // 2. TASK NO
  year: string; // 3. 연도(접수일자 기반으로 자동생성)
  targetMonth: string; // 4. 대상 월(접수일자 기반으로 자동생성)
  receiptDate: string; // 5. 접수일자
  requestPath: string; // 6. 요청경로
  workBasisNumber: string; // 7. 작업근거 번호
  requestTeam: string; // 8. 요청팀
  requestOrgType: string; // 9. 요청조직구분
  requester: string; // 10. 요청자
  lgUplusTeamName: string; // 11. LG U+팀명
  systemPart: string; // 12. 시스템(파트)
  targetSystemName: string; // 13. 대상 시스템명
  slaSmActivity: string; // 14. SLA SM Activity
  slaSmActivityDetail: string; // 15. SLA SM Activity(상세)
  processType: string; // 16. 처리구분 ('SM운영'으로 기본값)
  requestContent: string; // 17. 요청 내용
  processContent: string; // 18. 처리 내용
  note: string; // 19. 비고
  smManager: string; // 20. SM 담당자
  startDate: string; // 21. 착수 일자
  expectedDeployDate: string; // 22. 반영(예상)일자
  deployCompleted: string; // 23. 반영(종료) 여부
  actualDeployDate: string; // 24. 반영(종료) 일자
  workTimeDays: string; // 25. 소요시간 일(day)
  workTimeHours: string; // 26. 소요시간 시(hour)
  workTimeMinutes: string; // 27. 소요시간 분(min)
  totalMM: string; // 28. 최종합(MM)
  monthlyActualBillingMM: string; // 29. 월별 실제 청구 MM
  errorFixRequired: string; // 30. 오류 수정 여부
  workReviewTarget: string; // 31. 작업리뷰 보고대상
  workReviewWeek: string; // 32. 작업리뷰 주차
  createdAt: string;
}

export type SMRecordInput = Omit<SMRecord, 'id' | 'createdAt'>;

export type TaskCategory = "대시보드" | "PLAN" | "기타"; 