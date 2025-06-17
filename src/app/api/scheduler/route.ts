import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { SMRecord } from '@/types';
import { addRecord } from '@/lib/supabase';

// POST: 수동으로 스케줄 작업 실행 (테스트용)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskName, template } = body;

    if (!taskName) {
      return NextResponse.json(
        { error: '작업 이름이 필요합니다.' },
        { status: 400 }
      );
    }

    // 스케줄된 레코드 생성
    const now = new Date();
    const currentYear = format(now, 'yyyy');
    const currentMonth = format(now, 'yyyy-MM');
    const currentDate = format(now, 'yyyy-MM-dd');
    
    // 고유한 TASK NO 생성
    const taskNo = `API-${format(now, 'yyyyMMdd')}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    console.log(`🚀 [API-SCHEDULER] 스케줄 작업 실행 시작: ${taskName}`);
    console.log(`📋 [API-SCHEDULER] 입력된 템플릿:`, template);

    const newRecord: SMRecord = {
      id: uuidv4(),
      category: template?.category || '',
      taskNo: taskNo,
      year: currentYear,
      targetMonth: currentMonth,
      receiptDate: currentDate,
      requestPath: template?.requestPath || '',
      workBasisNumber: template?.workBasisNumber || '',
      requestTeam: template?.requestTeam || '',
      requestOrgType: template?.requestOrgType || '',
      requester: template?.requester || '',
      lgUplusTeamName: template?.lgUplusTeamName || '',
      systemPart: template?.systemPart || '',
      targetSystemName: template?.targetSystemName || '',
      slaSmActivity: template?.slaSmActivity || '',
      slaSmActivityDetail: template?.slaSmActivityDetail || '',
      processType: template?.processType || '',
      requestContent: template?.requestContent || '',
      processContent: template?.processContent || '',
      note: template?.note || '',
      smManager: template?.smManager || '',
      startDate: template?.startDate || currentDate,
      expectedDeployDate: template?.expectedDeployDate || currentDate,
      deployCompleted: template?.deployCompleted || '',
      actualDeployDate: template?.actualDeployDate || currentDate,
      workTimeDays: template?.workTimeDays || '',
      workTimeHours: template?.workTimeHours || '',
      workTimeMinutes: template?.workTimeMinutes || '',
      totalMM: template?.totalMM || '',
      monthlyActualBillingMM: template?.monthlyActualBillingMM || '',
      errorFixRequired: template?.errorFixRequired || '',
      workReviewTarget: template?.workReviewTarget || '',
      workReviewWeek: template?.workReviewWeek || '',
      createdAt: new Date().toISOString()
    };

    console.log(`📝 [API-SCHEDULER] 생성될 레코드:`, newRecord);

    // DB에 레코드 추가
    const result = await addRecord(newRecord);

    console.log(`✅ [API-SCHEDULER] 스케줄된 작업 완료: ${taskName} (ID: ${newRecord.id})`);

    return NextResponse.json({
      success: true,
      message: `스케줄 작업 '${taskName}' 실행 완료`,
      recordId: newRecord.id,
      taskNo: newRecord.taskNo,
      createdAt: newRecord.createdAt,
      data: result
    });

  } catch (error) {
    console.error('스케줄 API 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '스케줄 작업 실행 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      },
      { status: 500 }
    );
  }
}

// GET: 현재 실행중인 스케줄 상태 확인
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      message: '스케줄러 API가 정상 작동 중입니다.',
      timestamp: new Date().toISOString(),
      endpoints: {
        manual_trigger: 'POST /api/scheduler - 수동으로 스케줄 작업 실행',
        health_check: 'GET /api/scheduler - 상태 확인'
      },
      example_request: {
        method: 'POST',
        body: {
          taskName: '테스트 작업',
          template: {
            category: '기타',
            slaSmActivity: '테스트',
            requestTeam: '개발팀'
          }
        }
      }
    });
  } catch (error) {
    console.error('스케줄러 상태 확인 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '스케줄러 상태 확인 중 오류가 발생했습니다.' 
      },
      { status: 500 }
    );
  }
} 