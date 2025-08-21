'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Filter } from 'lucide-react';

interface Project {
  id: string;
  status: string;
}

interface StatusOverviewProps {
  projects: Project[];
}

const STATUS_CONFIG = [
  { key: "계획", color: "bg-blue-100 text-blue-700", bgColor: "bg-blue-100" },
  { key: "진행 중", color: "bg-green-100 text-green-700", bgColor: "bg-green-100" },
  { key: "진행 중(관리필요)", color: "bg-red-100 text-red-700", bgColor: "bg-red-100" },
  { key: "일시 중단", color: "bg-amber-100 text-amber-700", bgColor: "bg-amber-100" },
  { key: "완료", color: "bg-zinc-100 text-zinc-700", bgColor: "bg-zinc-100" }
] as const;

function StatusBadge({ status }: { status: string }) {
  // 상태별 색상 직접 매핑
  const getStatusColor = (status: string): string => {
    switch (status) {
      case "계획":
        return "bg-blue-100 text-blue-700";
      case "진행 중":
        return "bg-green-100 text-green-700";
      case "진행 중(관리필요)":
        return "bg-red-100 text-red-700";
      case "일시 중단":
        return "bg-amber-100 text-amber-700";
      case "완료":
        return "bg-zinc-100 text-zinc-700";
      default:
        return "bg-zinc-100 text-zinc-700";
    }
  };
  
  const cls = getStatusColor(status);
  
  if (status.includes('(관리필요)')) {
    const [line1, line2] = status.split('(');
    return (
      <Badge className={`rounded-full px-3 py-1 text-xs leading-tight ${cls}`}>
        <div className="text-center">
          <div>{line1}</div>
          <div className="text-[10px]">({line2}</div>
        </div>
      </Badge>
    );
  }
  
  return <Badge className={`rounded-full px-3 py-1 text-xs ${cls}`}>{status}</Badge>;
}

export default function StatusOverview({ projects }: StatusOverviewProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-0">
        <div className="p-3 border-b flex items-center gap-2">
          <Filter className="h-4 w-4 text-green-600" />
          <h2 className="font-semibold text-base">상태별 현황</h2>
          <Badge variant="outline" className="ml-auto text-xs">
            {projects.length}개 총 프로젝트
          </Badge>
        </div>
        <div className="p-3">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {STATUS_CONFIG.map(({ key, color, bgColor }) => {
              const count = projects.filter((p) => p.status === key).length;
              return (
                <div key={key} className="text-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="mb-2">
                    <StatusBadge status={key} />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{count}개</div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

