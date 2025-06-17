import * as cron from 'node-cron';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { SMRecord } from '@/types';
import { addRecord } from './supabase';

// 스케줄 작업 타입 정의
export interface ScheduledTask {
  id: string;
  name: string;
  cronExpression: string; // cron 표현식 (예: '0 9 * * 1' = 매주 월요일 오전 9시)
  isActive: boolean;
  template: Partial<SMRecord>; // 생성할 데이터 템플릿
  lastRun?: string;
  nextRun?: string;
}

// 기본 템플릿들
export const DEFAULT_TEMPLATES = {
  weekly_maintenance: {
    category: '기타',
    processType: 'SM운영',
    slaSmActivity: '정기점검',
    slaSmActivityDetail: '주간 시스템 점검',
    requestTeam: '시스템운영팀',
    requestOrgType: '내부',
    systemPart: '전체시스템',
    workReviewTarget: 'Y',
  },
  monthly_report: {
    category: 'PLAN',
    processType: 'SM운영',
    slaSmActivity: '보고서작성',
    slaSmActivityDetail: '월간 운영 보고서',
    requestTeam: '관리팀',
    requestOrgType: '내부',
    systemPart: '관리시스템',
    workReviewTarget: 'Y',
  },
  dashboard_check: {
    category: '대시보드',
    processType: 'SM운영',
    slaSmActivity: '조간점검',
    slaSmActivityDetail: '대시보드/결합/채권재고 조간점검',
    requestTeam: '경영지원시스템팀',
    requestOrgType: 'SM운영조직(LGCNS/협력업체)',
    systemPart: '경영관리시스템',
    requestContent: '대시보드/결합/채권재고 조간점검',
    processContent: '대시보드/결합/채권재고 조간점검',
    workTimeDays: '0',
    workTimeHours: '0',
    workTimeMinutes: '30',
    totalMM: '0.062',

  },
  uplan_check: {
    category: 'PLAN',
    requestTeam: '경영지원시스템팀',
    requestOrgType: 'SM운영조직(LGCNS/협력업체)',
    requester: '한상명',
    lgUplusTeamName: '경영분석팀',
    systemPart: '경영관리시스템',
    targetSystemName: '경영관리 시스템(USIS)',
    processType: 'SM운영',
    requestContent: 'U+PLAN 조간점검',
    processContent: 'U+PLAN 조간점검',
    smManager: '위승빈',
    deployCompleted: '반영(처리)완료',
    workTimeDays: '0',
    workTimeHours: '0',
    workTimeMinutes: '30',
    totalMM: '0.062'
  }
};

// 저장된 스케줄 작업들
let scheduledTasks: ScheduledTask[] = [];
const runningJobs: Map<string, cron.ScheduledTask> = new Map();

// 로컬 스토리지에서 스케줄 작업 불러오기
export function loadScheduledTasks(): ScheduledTask[] {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('scheduledTasks');
    if (stored) {
      scheduledTasks = JSON.parse(stored);
    }
  }
  return scheduledTasks;
}

// 로컬 스토리지에 스케줄 작업 저장
export function saveScheduledTasks(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('scheduledTasks', JSON.stringify(scheduledTasks));
  }
}

// 자동 데이터 생성 함수
async function createScheduledRecord(template: Partial<SMRecord>, taskName: string): Promise<void> {
  console.log(`🚀 [SCHEDULER] 스케줄 작업 실행 시작: ${taskName}`);
  console.log(`📋 [SCHEDULER] 입력된 템플릿:`, template);
  
  const now = new Date();
  const currentYear = format(now, 'yyyy');
  const currentMonth = format(now, 'yyyy-MM');
  const currentDate = format(now, 'yyyy-MM-dd');
  
  // 고유한 TASK NO 생성
  const taskNo = `AUTO-${format(now, 'yyyyMMdd')}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  
  const newRecord: SMRecord = {
    id: uuidv4(),
    category: template.category || '',
    taskNo: taskNo,
    year: currentYear,
    targetMonth: currentMonth,
    receiptDate: currentDate,
    requestPath: template.requestPath || '',
    workBasisNumber: template.workBasisNumber || '',
    requestTeam: template.requestTeam || '',
    requestOrgType: template.requestOrgType || '',
    requester: template.requester || '',
    lgUplusTeamName: template.lgUplusTeamName || '',
    systemPart: template.systemPart || '',
    targetSystemName: template.targetSystemName || '',
    slaSmActivity: template.slaSmActivity || '',
    slaSmActivityDetail: template.slaSmActivityDetail || '',
    processType: template.processType || '',
    requestContent: template.requestContent || '',
    processContent: template.processContent || '',
    note: template.note || '',
    smManager: template.smManager || '',
    startDate: template.startDate || '',
    expectedDeployDate: template.expectedDeployDate || '',
    deployCompleted: template.deployCompleted || '',
    actualDeployDate: template.actualDeployDate || '',
    workTimeDays: template.workTimeDays || '',
    workTimeHours: template.workTimeHours || '',
    workTimeMinutes: template.workTimeMinutes || '',
    totalMM: template.totalMM || '',
    monthlyActualBillingMM: template.monthlyActualBillingMM || '',
    errorFixRequired: template.errorFixRequired || '',
    workReviewTarget: template.workReviewTarget || '',
    workReviewWeek: template.workReviewWeek || '',
    createdAt: new Date().toISOString()
  };

  console.log(`📝 [SCHEDULER] 생성될 레코드:`, newRecord);

  try {
    await addRecord(newRecord);
    console.log(`✅ [SCHEDULER] 스케줄된 작업 완료: ${taskName} (ID: ${newRecord.id})`);
  } catch (error) {
    console.error(`❌ [SCHEDULER] 스케줄된 작업 실패: ${taskName}`, error);
  }
}

// 스케줄 작업 추가
export function addScheduledTask(task: Omit<ScheduledTask, 'id'>): string {
  const newTask: ScheduledTask = {
    id: uuidv4(),
    ...task
  };
  
  scheduledTasks.push(newTask);
  saveScheduledTasks();
  
  if (newTask.isActive) {
    startScheduledTask(newTask.id);
  }
  
  return newTask.id;
}

// 스케줄 작업 시작
export function startScheduledTask(taskId: string): boolean {
  const task = scheduledTasks.find(t => t.id === taskId);
  if (!task || !cron.validate(task.cronExpression)) {
    console.error(`잘못된 스케줄 작업: ${taskId}`);
    return false;
  }
  
  // 이미 실행 중인 작업이 있으면 중지
  if (runningJobs.has(taskId)) {
    runningJobs.get(taskId)?.stop();
  }
  
  // 새 cron 작업 생성
  const job = cron.schedule(task.cronExpression, async () => {
    console.log(`🔄 스케줄 작업 실행: ${task.name}`);
    task.lastRun = new Date().toISOString();
    await createScheduledRecord(task.template, task.name);
    saveScheduledTasks();
  }, {
    timezone: 'Asia/Seoul'
  });
  
  // 작업 시작
  job.start();
  runningJobs.set(taskId, job);
  
  // 다음 실행 시간 계산 (근사치)
  task.nextRun = new Date(Date.now() + 60000).toISOString(); // 임시로 1분 후
  saveScheduledTasks();
  
  console.log(`✅ 스케줄 작업 시작: ${task.name}`);
  return true;
}

// 스케줄 작업 중지
export function stopScheduledTask(taskId: string): boolean {
  const job = runningJobs.get(taskId);
  if (job) {
    job.stop();
    runningJobs.delete(taskId);
    
    const task = scheduledTasks.find(t => t.id === taskId);
    if (task) {
      task.isActive = false;
      task.nextRun = undefined;
      saveScheduledTasks();
    }
    
    console.log(`⏹️ 스케줄 작업 중지: ${taskId}`);
    return true;
  }
  return false;
}

// 스케줄 작업 삭제
export function deleteScheduledTask(taskId: string): boolean {
  stopScheduledTask(taskId);
  const index = scheduledTasks.findIndex(t => t.id === taskId);
  if (index !== -1) {
    scheduledTasks.splice(index, 1);
    saveScheduledTasks();
    return true;
  }
  return false;
}

// 모든 스케줄 작업 가져오기
export function getScheduledTasks(): ScheduledTask[] {
  return [...scheduledTasks];
}

// 스케줄 작업 수동 실행
export async function executeScheduledTaskNow(taskId: string): Promise<boolean> {
  const task = scheduledTasks.find(t => t.id === taskId);
  if (!task) {
    console.error(`[SCHEDULER] 스케줄 작업을 찾을 수 없습니다: ${taskId}`);
    return false;
  }

  try {
    console.log(`🔄 [SCHEDULER] 수동 실행 시작: ${task.name}`);
    console.log(`📋 [SCHEDULER] 작업 템플릿:`, task.template);
    task.lastRun = new Date().toISOString();
    await createScheduledRecord(task.template, task.name);
    saveScheduledTasks();
    console.log(`✅ [SCHEDULER] 수동 실행 완료: ${task.name}`);
    return true;
  } catch (error) {
    console.error(`❌ [SCHEDULER] 수동 실행 실패: ${task.name}`, error);
    return false;
  }
}

// 스케줄러 초기화
export function initializeScheduler(): void {
  loadScheduledTasks();
  
  // 활성화된 모든 작업 시작
  scheduledTasks.forEach(task => {
    if (task.isActive) {
      startScheduledTask(task.id);
    }
  });
  
  console.log(`📅 스케줄러 초기화 완료. ${scheduledTasks.length}개 작업 로드됨`);
}

// 스케줄러 정리
export function cleanupScheduler(): void {
  runningJobs.forEach((job, taskId) => {
    job.stop();
    console.log(`🧹 스케줄 작업 정리: ${taskId}`);
  });
  runningJobs.clear();
}

// 미리 정의된 스케줄 작업들
export const PRESET_SCHEDULES = [
  {
    name: '대시보드 조간점검',
    cronExpression: '0 9 * * *', // 매일 오전 9시
    template: DEFAULT_TEMPLATES.dashboard_check,
    description: '매일 오전 9시에 대시보드/결합/채권재고 조간점검 작업을 생성합니다.'
  },
  {
    name: 'U+PLAN 조간점검',
    cronExpression: '0 9 * * 1-5', // 평일 매일 오전 9시
    template: DEFAULT_TEMPLATES.uplan_check,
    description: '평일 매일 오전 9시에 U+PLAN 조간점검 작업을 생성합니다.'
  },
  {
    name: '주간 시스템 점검',
    cronExpression: '0 9 * * 1', // 매주 월요일 오전 9시
    template: DEFAULT_TEMPLATES.weekly_maintenance,
    description: '매주 월요일 오전 9시에 자동으로 시스템 점검 작업을 생성합니다.'
  },
  {
    name: '월간 보고서 작성',
    cronExpression: '0 17 1 * *', // 매월 1일 오후 5시
    template: DEFAULT_TEMPLATES.monthly_report,
    description: '매월 1일 오후 5시에 월간 보고서 작성 작업을 생성합니다.'
  },
  {
    name: '일일 백업 확인',
    cronExpression: '0 8 * * *', // 매일 오전 8시
    template: {
      ...DEFAULT_TEMPLATES.weekly_maintenance,
      slaSmActivity: '백업확인',
      slaSmActivityDetail: '일일 백업 상태 확인',
    },
    description: '매일 오전 8시에 백업 확인 작업을 생성합니다.'
  }
]; 