import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { SMRecord } from '@/types';
import { addRecord } from '@/lib/supabase';

// GET: Vercel Cron에서 호출되는 일일 자동 스케줄
export async function GET() {
  try {
    console.log('🌙 [일일-자동스케줄] 매일 00:10 자동 실행 시작');
    
    const now = new Date();
    const currentYear = format(now, 'yyyy');
    const currentMonth = format(now, 'yyyy-MM');
    const currentDate = format(now, 'yyyy-MM-dd');
    
    // 고유한 TASK NO 생성
    const taskNo = `DAILY-${format(now, 'yyyyMMdd')}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    // 일일 자동 생성용 템플릿
    const template = {
      category: '기타',
      requestTeam: '시스템운영팀',
      requestOrgType: 'SM운영조직(LGCNS/협력업체)',
      requester: '자동시스템',
      lgUplusTeamName: '시스템운영팀',
      systemPart: '전체시스템',
      targetSystemName: '통합관리시스템',
      processType: 'SM운영',
      requestContent: '일일 시스템 모니터링 및 상태 점검',
      processContent: '시스템 정상 운영 확인 및 로그 점검 완료',
      smManager: '위승빈 선임',
      deployCompleted: '반영(처리)완료',
      workTimeDays: '0',
      workTimeHours: '1',
      workTimeMinutes: '0',
      totalMM: '0.006' // 1시간 = 1/(21*8) = 0.006 MM
    };

    const newRecord: SMRecord = {
      id: uuidv4(),
      category: template.category,
      taskNo: taskNo,
      year: currentYear,
      targetMonth: currentMonth,
      receiptDate: currentDate,
      requestPath: '',
      workBasisNumber: '',
      requestTeam: template.requestTeam,
      requestOrgType: template.requestOrgType,
      requester: template.requester,
      lgUplusTeamName: template.lgUplusTeamName,
      systemPart: template.systemPart,
      targetSystemName: template.targetSystemName,
      slaSmActivity: '',
      slaSmActivityDetail: '',
      processType: template.processType,
      requestContent: template.requestContent,
      processContent: template.processContent,
      note: '자동 생성된 일일 점검 이력',
      smManager: template.smManager,
      startDate: currentDate,
      expectedDeployDate: currentDate,
      deployCompleted: template.deployCompleted,
      actualDeployDate: currentDate,
      workTimeDays: template.workTimeDays,
      workTimeHours: template.workTimeHours,
      workTimeMinutes: template.workTimeMinutes,
      totalMM: template.totalMM,
      monthlyActualBillingMM: '',
      errorFixRequired: '',
      workReviewTarget: '',
      workReviewWeek: '',
      createdAt: new Date().toISOString()
    };

    console.log('📝 [일일-자동스케줄] 생성될 레코드:', {
      taskNo: newRecord.taskNo,
      category: newRecord.category,
      requestContent: newRecord.requestContent,
      processContent: newRecord.processContent
    });

    // DB에 레코드 추가
    const result = await addRecord(newRecord);

    console.log('✅ [일일-자동스케줄] 완료:', {
      id: newRecord.id,
      taskNo: newRecord.taskNo,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: '일일 자동 SM 이력 생성 완료',
      recordId: newRecord.id,
      taskNo: newRecord.taskNo,
      createdAt: newRecord.createdAt,
      schedule: '매일 00:10 실행',
      data: result
    });

  } catch (error) {
    console.error('❌ [일일-자동스케줄] 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '일일 자동 스케줄 실행 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// POST: 수동 테스트용
export async function POST() {
  console.log('🧪 [일일-자동스케줄] 수동 테스트 실행');
  return GET(); // GET과 동일한 로직 실행
} 