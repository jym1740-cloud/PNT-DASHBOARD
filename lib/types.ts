// 프로젝트 관련 타입 정의
export interface Project {
  id: string;
  pjtNo: string;
  name: string;
  status: string;
  pm: string;
  salesManagers?: string[];
  designManagers?: string[];
  controlManagers?: string[];
  productionManagers?: string[];
  progress: number;
  startDate: string;
  endDate: string;
  note?: string;
  lat: number;
  lng: number;
  country?: string;
  city?: string;
  address?: string;
  equipmentHistory?: EquipmentHistory[];
  scheduleItems?: ScheduleItem[];
  people?: Person[];
  costHistory?: CostHistory[]; // 투입률 이력 추가
  budget?: number; // 현재 예산 (투입률 이력의 최신값과 동기화)
  actualCost?: number; // 현재 실제비용 (투입률 이력의 최신값과 동기화)
}

// 투입률 이력 타입 정의
export interface CostHistory {
  id: string;
  date: string;
  actualCost: number;
  budget: number;
  costRatio: number; // 백분율
  note?: string;
  manager: string; // 입력한 담당자
  changeReason?: string; // 변경 사유
}

export interface EquipmentHistory {
  id: string;
  date: string;
  part: string;
  content: string;
  action: string;
  manager: string;
}

export interface ScheduleItem {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  progress: number;
}

export interface Person {
  id: string;
  name: string;
  affiliation: string;
  department: string;
}

export interface ManagerStatus {
  [personId: string]: Record<string, string>;
}

export interface Dependency {
  from: string;
  to: string;
}

export interface Threshold {
  itemId: string;
  type: 'progress' | 'date';
  value: number;
  message: string;
}

export type ProjectStatus = '계획' | '진행 중' | '진행 중(관리필요)' | '일시 중단' | '완료';
export type ActiveTab = 'overview' | 'projects' | 'schedule' | 'analytics';
