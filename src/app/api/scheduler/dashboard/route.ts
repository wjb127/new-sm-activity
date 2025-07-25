import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { SMRecord } from '@/types';
import { addRecord } from '@/lib/supabase';

// 대시보드 조간점검 전용 Cron 엔드포인트
export async function GET() {
  try {
    console.log('🚀 [VERCEL-CRON] 대시보드 조간점검 cron 실행 시작');

    // 스케줄된 레코드 생성
    const now = new Date();
    const currentYear = format(now, 'yyyy');
    const currentMonth = format(now, 'yyyy-MM');
    const currentDate = format(now, 'yyyy-MM-dd');
    
    // 고유한 TASK NO 생성
    const taskNo = `CRON-${format(now, 'yyyyMMdd')}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    const template = {
      category: '대시보드',
      requestTeam: '경영지원시스템팀',
      requestOrgType: 'SM운영조직(LGCNS/협력업체)',
      requester: '한상명',
      lgUplusTeamName: '경영분석팀',
      systemPart: '경영관리시스템',
      targetSystemName: '경영관리 시스템(USIS)',
      processType: 'SM운영',
      requestContent: '대시보드/결합/채권재고 조간점검',
      processContent: '대시보드/결합/채권재고 조간점검',
      smManager: '위승빈 선임',
      deployCompleted: '반영(처리)완료',
      workTimeDays: '0',
      workTimeHours: '0',
      workTimeMinutes: '30',
      totalMM: '0.062'
    };

    console.log('📋 [VERCEL-CRON] 대시보드 템플릿:', template);

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
      note: '',
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

    console.log('📝 [VERCEL-CRON] 생성될 레코드:', newRecord);

    // DB에 레코드 추가
    const result = await addRecord(newRecord);

    console.log('✅ [VERCEL-CRON] 대시보드 조간점검 cron 완료 (ID:', newRecord.id, ')');

    return NextResponse.json({
      success: true,
      message: '대시보드 조간점검 cron 실행 완료',
      recordId: newRecord.id,
      taskNo: newRecord.taskNo,
      createdAt: newRecord.createdAt,
      data: result
    });

  } catch (error) {
    console.error('❌ [VERCEL-CRON] 대시보드 조간점검 cron 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '대시보드 조간점검 cron 실행 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
} 