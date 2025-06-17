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
  const now = new Date();
  const currentYear = format(now, 'yyyy');
  const currentMonth = format(now, 'yyyy-MM');
  const currentDate = format(now, 'yyyy-MM-dd');
  
  // 고유한 TASK NO 생성
  const taskNo = `AUTO-${format(now, 'yyyyMMdd')}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  
  const newRecord: SMRecord = {
    id: uuidv4(),
    category: template.category || '기타',
    taskNo: taskNo,
    year: currentYear,
    targetMonth: currentMonth,
    receiptDate: currentDate,
    requestPath: template.requestPath || '자동생성',
    workBasisNumber: template.workBasisNumber || `AUTO-${currentYear}`,
    requestTeam: template.requestTeam || '시스템팀',
    requestOrgType: template.requestOrgType || '내부',
    requester: template.requester || '시스템',
    lgUplusTeamName: template.lgUplusTeamName || 'LG U+ 운영팀',
    systemPart: template.systemPart || '전체',
    targetSystemName: template.targetSystemName || '통합시스템',
    slaSmActivity: template.slaSmActivity || '자동작업',
    slaSmActivityDetail: template.slaSmActivityDetail || taskName,
    processType: template.processType || 'SM운영',
    requestContent: template.requestContent || `[자동생성] ${taskName} - ${currentDate}`,
    processContent: template.processContent || '스케줄에 따른 자동 생성',
    note: template.note || `자동 스케줄러에 의해 생성됨 (${currentDate})`,
    smManager: template.smManager || '시스템',
    startDate: currentDate,
    expectedDeployDate: template.expectedDeployDate || currentDate,
    deployCompleted: template.deployCompleted || 'N',
    actualDeployDate: template.actualDeployDate || '',
    workTimeDays: template.workTimeDays || '1',
    workTimeHours: template.workTimeHours || '8',
    workTimeMinutes: template.workTimeMinutes || '0',
    totalMM: template.totalMM || '1.0',
    monthlyActualBillingMM: template.monthlyActualBillingMM || '1.0',
    errorFixRequired: template.errorFixRequired || 'N',
    workReviewTarget: template.workReviewTarget || 'Y',
    workReviewWeek: template.workReviewWeek || format(now, 'yyyy-ww'),
    createdAt: new Date().toISOString()
  };

  try {
    await addRecord(newRecord);
    console.log(`✅ 스케줄된 작업 완료: ${taskName} (ID: ${newRecord.id})`);
  } catch (error) {
    console.error(`❌ 스케줄된 작업 실패: ${taskName}`, error);
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