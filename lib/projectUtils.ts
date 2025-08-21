// 프로젝트 상태별 색상 정의
export const STATUS_COLORS: Record<string, string> = {
  "계획": "bg-blue-100 text-blue-700",
  "진행 중": "bg-green-100 text-green-700",
  "진행 중(관리필요)": "bg-red-100 text-red-700",
  "일시 중단": "bg-amber-100 text-amber-700",
  "완료": "bg-zinc-200 text-zinc-700",
};

// 상태 라벨 변환
export const STATUS_LABELS: Record<string, string> = {
  "Planning": "계획",
  "Active": "진행 중",
  "Active_Management": "진행 중\n(관리필요)",
  "On Hold": "일시 중단",
  "Closed": "완료",
  "계획": "계획",
  "진행 중": "진행 중",
  "진행 중(관리필요)": "진행 중\n(관리필요)",
  "일시 중단": "일시 중단",
  "완료": "완료",
};

// 안전한 ID 생성
export const uid = () => Math.random().toString(36).slice(2);

// 투입률 계산 및 색상 결정
export function getCostRatioColor(budget: number, actualCost: number) {
  if (budget === 0) return "text-zinc-400";
  
  const ratio = (actualCost / budget) * 100;
  if (ratio > 100) return "text-red-600 font-semibold";
  if (ratio >= 80) return "text-red-600";
  if (ratio >= 70) return "text-amber-600";
  return "text-green-600";
}

// 투입률 계산
export function calculateCostRatio(budget: number, actualCost: number) {
  if (budget === 0) return 0;
  return (actualCost / budget) * 100;
}

// 프로젝트 필터링
export function filterProjects(projects: any[], query: string, statusFilter?: string) {
  return projects.filter((p) => {
    const okQuery = [p.pjtNo, p.name, p.country, p.city, p.pm].some((x) => 
      x.toLowerCase().includes(query.toLowerCase())
    );
    const okStatus = statusFilter && statusFilter !== 'all' ? p.status === statusFilter : true;
    return okQuery && okStatus;
  });
}

// 통계 데이터 계산
export function calculateStats(projects: any[]) {
  const totalProjects = projects.length;
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const totalActualCost = projects.reduce((sum, p) => sum + (p.actualCost || 0), 0);
  const avgProgress = projects.length > 0 ? 
    projects.reduce((sum, p) => sum + (p.actualCost / (p.budget || 1) * 100), 0) / projects.length : 0;
  
  const statusCounts = {
    "계획": projects.filter(p => p.status === "계획").length,
    "진행 중": projects.filter(p => p.status === "진행 중").length,
    "진행 중(관리필요)": projects.filter(p => p.status === "진행 중(관리필요)").length,
    "일시 중단": projects.filter(p => p.status === "일시 중단").length,
    "완료": projects.filter(p => p.status === "완료").length,
  };
  
  const urgentProjects = projects.filter(p => 
    p.status === "진행 중(관리필요)" || 
    (p.budget > 0 && (p.actualCost / p.budget) > 0.8)
  ).length;
  
  return {
    totalProjects,
    totalBudget,
    totalActualCost,
    avgProgress,
    statusCounts,
    urgentProjects,
    budgetUtilization: totalBudget > 0 ? (totalActualCost / totalBudget) * 100 : 0
  };
}


