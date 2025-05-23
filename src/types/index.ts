export interface SMRecord {
  id: string;
  category: string;
  taskNo: string;
  year: string;
  month: string;
  receiptDate: string;
  requestPath: string;
  requestTeam: string;
  requester: string;
  requestContent: string;
  processContent: string;
  note: string;
  smManager: string;
  startDate: string;
  deployDate: string;
  createdAt: string;
}

export type SMRecordInput = Omit<SMRecord, 'id' | 'createdAt'>;

export type TaskCategory = "대시보드" | "PLAN" | "기타"; 