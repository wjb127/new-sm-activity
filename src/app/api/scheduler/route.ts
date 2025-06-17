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
    
    const newRecord: SMRecord = {
      id: uuidv4(),
      category: template?.category || '기타',
      taskNo: taskNo,
      year: currentYear,
      targetMonth: currentMonth,
      receiptDate: currentDate,
      requestPath: template?.requestPath || 'API 호출',
      workBasisNumber: template?.workBasisNumber || `API-${currentYear}`,
      requestTeam: template?.requestTeam || '시스템팀',
      requestOrgType: template?.requestOrgType || '내부',
      requester: template?.requester || 'API',
      lgUplusTeamName: template?.lgUplusTeamName || 'LG U+ 운영팀',
      systemPart: template?.systemPart || '전체',
      targetSystemName: template?.targetSystemName || '통합시스템',
      slaSmActivity: template?.slaSmActivity || '자동작업',
      slaSmActivityDetail: template?.slaSmActivityDetail || taskName,
      processType: template?.processType || 'SM운영',
      requestContent: template?.requestContent || `[API 생성] ${taskName} - ${currentDate}`,
      processContent: template?.processContent || 'API를 통한 자동 생성',
      note: template?.note || `API 호출에 의해 생성됨 (${currentDate})`,
      smManager: template?.smManager || '시스템',
      startDate: currentDate,
      expectedDeployDate: template?.expectedDeployDate || currentDate,
      deployCompleted: template?.deployCompleted || 'N',
      actualDeployDate: template?.actualDeployDate || '',
      workTimeDays: template?.workTimeDays || '1',
      workTimeHours: template?.workTimeHours || '8',
      workTimeMinutes: template?.workTimeMinutes || '0',
      totalMM: template?.totalMM || '1.0',
      monthlyActualBillingMM: template?.monthlyActualBillingMM || '1.0',
      errorFixRequired: template?.errorFixRequired || 'N',
      workReviewTarget: template?.workReviewTarget || 'Y',
      workReviewWeek: template?.workReviewWeek || format(now, 'yyyy-ww'),
      createdAt: new Date().toISOString()
    };

    // DB에 레코드 추가
    const result = await addRecord(newRecord);

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