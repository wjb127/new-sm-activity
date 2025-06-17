'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

// 스케줄 작업 타입 정의 (클라이언트용)
export interface ScheduledTask {
  id: string;
  name: string;
  cronExpression: string;
  isActive: boolean;
  template: Record<string, unknown>;
  lastRun?: string;
  nextRun?: string;
}

// 미리 정의된 스케줄 템플릿
const PRESET_SCHEDULES = [
  {
    name: '대시보드 조간점검',
    description: '매일 오전 9시',
    cronExpression: '0 9 * * *',
    template: {
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

    }
  },
  {
    name: '주간 정기점검',
    description: '매주 월요일 오전 9시',
    cronExpression: '0 9 * * 1',
    template: {
      category: '기타',
      processType: 'SM운영',
      slaSmActivity: '정기점검',
      slaSmActivityDetail: '주간 시스템 점검',
      requestTeam: '시스템운영팀',
      requestOrgType: '내부',
      systemPart: '전체시스템',
      workReviewTarget: 'Y',
    }
  },
  {
    name: '월간 보고서',
    description: '매월 1일 오후 5시',
    cronExpression: '0 17 1 * *',
    template: {
      category: 'PLAN',
      processType: 'SM운영',
      slaSmActivity: '보고서작성',
      slaSmActivityDetail: '월간 운영 보고서',
      requestTeam: '관리팀',
      requestOrgType: '내부',
      systemPart: '관리시스템',
      workReviewTarget: 'Y',
    }
  },
  {
    name: '일일 백업',
    description: '매일 자정',
    cronExpression: '0 0 * * *',
    template: {
      category: '기타',
      processType: 'SM운영',
      slaSmActivity: '백업',
      slaSmActivityDetail: '일일 시스템 백업',
      requestTeam: '시스템운영팀',
      requestOrgType: '내부',
      systemPart: '전체시스템',
      workReviewTarget: 'N',
    }
  }
];

export default function SchedulerManager() {
  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('');
  const [newTask, setNewTask] = useState({
    name: '',
    cronExpression: '',
    isActive: false,
    template: {}
  });
  const [loading, setLoading] = useState(false);

  // 컴포넌트 마운트 시 태스크 로드
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = () => {
    // 로컬 스토리지에서 스케줄 작업 불러오기
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('scheduledTasks');
      if (stored) {
        setTasks(JSON.parse(stored));
      }
    }
  };

  const saveTasks = (updatedTasks: ScheduledTask[]) => {
    // 로컬 스토리지에 저장
    if (typeof window !== 'undefined') {
      localStorage.setItem('scheduledTasks', JSON.stringify(updatedTasks));
    }
    setTasks(updatedTasks);
  };

  const handleAddTask = () => {
    if (!newTask.name || !newTask.cronExpression) {
      alert('작업 이름과 cron 표현식을 입력해주세요.');
      return;
    }

    try {
      const newScheduledTask: ScheduledTask = {
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: newTask.name,
        cronExpression: newTask.cronExpression,
        isActive: newTask.isActive,
        template: newTask.template
      };
      
      const updatedTasks = [...tasks, newScheduledTask];
      saveTasks(updatedTasks);
      
      setShowAddForm(false);
      setNewTask({ name: '', cronExpression: '', isActive: false, template: {} });
      setSelectedPreset('');
      
      if (newTask.isActive) {
        alert('스케줄이 추가되었습니다. 실제 실행은 서버 환경에서 처리됩니다.');
      }
    } catch (error) {
      console.error('스케줄 추가 실패:', error);
      alert('스케줄 추가에 실패했습니다.');
    }
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm('정말 이 스케줄을 삭제하시겠습니까?')) {
      const updatedTasks = tasks.filter(task => task.id !== taskId);
      saveTasks(updatedTasks);
    }
  };

  const handleToggleTask = (taskId: string, isActive: boolean) => {
    const updatedTasks = tasks.map(task => 
      task.id === taskId 
        ? { ...task, isActive: !isActive }
        : task
    );
    saveTasks(updatedTasks);
  };

  // 수동으로 스케줄 작업 실행 (API 호출)
  const handleManualRun = async (task: ScheduledTask) => {
    setLoading(true);
    try {
      const response = await fetch('/api/scheduler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskName: task.name,
          template: task.template
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(`스케줄 작업 '${task.name}'이 성공적으로 실행되었습니다!\n작업 번호: ${result.taskNo}`);
        
        // 마지막 실행 시간 업데이트
        const updatedTasks = tasks.map(t => 
          t.id === task.id 
            ? { ...t, lastRun: new Date().toISOString() }
            : t
        );
        saveTasks(updatedTasks);
      } else {
        alert(`실행 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('수동 실행 실패:', error);
      alert('수동 실행 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handlePresetSelect = (presetIndex: string) => {
    setSelectedPreset(presetIndex);
    if (presetIndex) {
      const preset = PRESET_SCHEDULES[parseInt(presetIndex)];
      setNewTask({
        name: preset.name,
        cronExpression: preset.cronExpression,
        isActive: false,
        template: preset.template
      });
    }
  };

  const getCronDescription = (cron: string): string => {
    const descriptions: Record<string, string> = {
      '0 9 * * 1': '매주 월요일 오전 9시',
      '0 17 1 * *': '매월 1일 오후 5시',
      '0 8 * * *': '매일 오전 8시',
      '*/30 * * * *': '30분마다',
      '0 */6 * * *': '6시간마다',
      '0 0 * * *': '매일 자정',
      '0 12 * * *': '매일 정오'
    };
    return descriptions[cron] || cron;
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '-';
    return format(new Date(dateStr), 'yyyy-MM-dd HH:mm', { locale: ko });
  };

  // 대시보드 조간점검 스케줄 자동 등록
  const handleAddDashboardSchedule = () => {
    const dashboardSchedule = {
      name: '대시보드 조간점검',
      cronExpression: '0 9 * * *',
      isActive: true,
      template: {
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
        smManager: '위승빈',
        deployCompleted: '반영(처리)완료',
        workTimeDays: '0',
        workTimeHours: '0',
        workTimeMinutes: '30',
        totalMM: '0.062'
      }
    };

         // 이미 등록된 대시보드 조간점검이 있는지 확인
     const existingTask = tasks.find(task => task.name === '대시보드 조간점검');
     if (existingTask) {
       alert('대시보드 조간점검 스케줄이 이미 등록되어 있습니다.');
       return;
     }

    const newScheduledTask: ScheduledTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...dashboardSchedule
    };
    
    const updatedTasks = [...tasks, newScheduledTask];
    saveTasks(updatedTasks);
         alert('대시보드 조간점검 스케줄이 성공적으로 등록되었습니다!\n매일 오전 9시에 자동으로 실행됩니다.');
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">스케줄러 관리</h2>
        <div className="flex gap-2">
          <button
            onClick={handleAddDashboardSchedule}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            대시보드 조간점검 등록
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {showAddForm ? '취소' : '새 스케줄 추가'}
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-3">새 스케줄 작업 추가</h3>
          
          {/* 미리 정의된 템플릿 선택 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              템플릿 선택 (선택사항)
            </label>
            <select
              value={selectedPreset}
              onChange={(e) => handlePresetSelect(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">사용자 정의</option>
              {PRESET_SCHEDULES.map((preset, index) => (
                <option key={index} value={index.toString()}>
                  {preset.name} - {preset.description}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                작업 이름 *
              </label>
              <input
                type="text"
                value={newTask.name}
                onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="예: 주간 시스템 점검"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cron 표현식 *
              </label>
              <input
                type="text"
                value={newTask.cronExpression}
                onChange={(e) => setNewTask({ ...newTask, cronExpression: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="예: 0 9 * * 1 (매주 월요일 9시)"
              />
              <p className="text-xs text-gray-500 mt-1">
                {getCronDescription(newTask.cronExpression)}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={newTask.isActive}
                onChange={(e) => setNewTask({ ...newTask, isActive: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">즉시 활성화</span>
            </label>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={handleAddTask}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              추가
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewTask({ name: '', cronExpression: '', isActive: false, template: {} });
                setSelectedPreset('');
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 현재 스케줄 목록 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">현재 스케줄 ({tasks.length}개)</h3>
        
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            등록된 스케줄이 없습니다.
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`p-4 border rounded-lg ${
                  task.isActive ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-800">{task.name}</h4>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          task.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {task.isActive ? '실행중' : '중지됨'}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>스케줄:</strong> {getCronDescription(task.cronExpression)}</p>
                      <p><strong>마지막 실행:</strong> {formatDate(task.lastRun)}</p>
                      <p><strong>다음 실행:</strong> {formatDate(task.nextRun)}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleManualRun(task)}
                      disabled={loading}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                    >
                      {loading ? '실행중...' : '지금 수행하기'}
                    </button>
                    <button
                      onClick={() => handleToggleTask(task.id, task.isActive)}
                      className={`px-3 py-1 text-sm rounded ${
                        task.isActive
                          ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                          : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                    >
                      {task.isActive ? '중지' : '시작'}
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cron 표현식 도움말 */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">Cron 표현식 예제</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p><code>0 9 * * 1</code> - 매주 월요일 오전 9시</p>
          <p><code>0 17 1 * *</code> - 매월 1일 오후 5시</p>
          <p><code>0 8 * * *</code> - 매일 오전 8시</p>
          <p><code>*/30 * * * *</code> - 30분마다</p>
          <p><code>0 */6 * * *</code> - 6시간마다</p>
        </div>
        <p className="text-xs text-blue-600 mt-2">
          형식: 분(0-59) 시(0-23) 일(1-31) 월(1-12) 요일(0-7, 0과 7은 일요일)
        </p>
      </div>
    </div>
  );
} 