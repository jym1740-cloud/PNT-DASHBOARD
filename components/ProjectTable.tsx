'use client';

import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit3, Calendar, FileText, Trash2, Globe2, TrendingUp, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Project, CostHistory } from '@/lib/types';

interface ProjectTableProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onSchedule: (project: Project) => void;
  onEquipmentHistory: (project: Project) => void;
  onCostHistory: (project: Project) => void; // 투입률 이력 관리 추가
  onDelete: (id: string) => void;
}

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
        return "bg-zinc-200 text-zinc-700";
      default:
        return "bg-zinc-100 text-zinc-700";
    }
  };
  
  const cls = getStatusColor(status);
  
  if (status.includes('(관리필요)')) {
    const [line1, line2] = status.split('(');
    return (
      <Badge className={cn("rounded-full px-3 py-1 text-xs leading-tight", cls)}>
        <div className="text-center">
          <div>{line1}</div>
          <div className="text-[10px]">({line2}</div>
        </div>
      </Badge>
    );
  }
  
  return <Badge className={cn("rounded-full px-3 py-1 text-xs", cls)}>{status}</Badge>;
}

function CostRatio({ costHistory }: { costHistory?: CostHistory[] }) {
  if (!costHistory || costHistory.length === 0) {
    return <span className="text-zinc-400">-</span>;
  }
  
  // 최근 이력의 투입률 표시 (날짜순 정렬 후 마지막 항목)
  const latestHistory = costHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  const ratio = latestHistory.costRatio;
  
  let colorClass = "text-green-600";
  if (ratio > 100) colorClass = "text-red-600 font-semibold";
  else if (ratio >= 80) colorClass = "text-red-600";
  else if (ratio >= 70) colorClass = "text-amber-600";
  
  return (
    <span className={colorClass}>
      {ratio.toFixed(1)}%
    </span>
  );
}

export default function ProjectTable({ 
  projects, 
  onEdit, 
  onSchedule, 
  onEquipmentHistory, 
  onCostHistory, // 투입률 이력 관리 추가
  onDelete 
}: ProjectTableProps) {
  // 정렬 상태 관리
  const [sortField, setSortField] = useState<'pjtNo' | 'status' | 'costRatio' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // 정렬 함수
  const handleSort = (field: 'pjtNo' | 'status' | 'costRatio') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 정렬된 프로젝트 목록
  const sortedProjects = useMemo(() => {
    if (!sortField) return projects;

    return [...projects].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'pjtNo':
          aValue = a.pjtNo;
          bValue = b.pjtNo;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'costRatio':
          // 투입률 계산 (최근 이력 기준)
          const aCostRatio = a.costHistory && a.costHistory.length > 0 
            ? a.costHistory.sort((x, y) => new Date(y.date).getTime() - new Date(x.date).getTime())[0].costRatio 
            : 0;
          const bCostRatio = b.costHistory && b.costHistory.length > 0 
            ? b.costHistory.sort((x, y) => new Date(y.date).getTime() - new Date(x.date).getTime())[0].costRatio 
            : 0;
          aValue = aCostRatio;
          bValue = bCostRatio;
          break;
        default:
          return 0;
      }

      // 문자열 정렬
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [projects, sortField, sortDirection]);

  // 정렬 아이콘 렌더링
  const renderSortIcon = (field: 'pjtNo' | 'status' | 'costRatio') => {
    if (sortField !== field) {
      return <ChevronUp className="h-4 w-4 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-blue-600" />
      : <ChevronDown className="h-4 w-4 text-blue-600" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe2 className="h-5 w-5 text-blue-600" />
          <h2 className="font-semibold text-lg">프로젝트 리스트</h2>
        </div>
        <div className="text-xs text-zinc-500">더블클릭: 수정 / 아이콘: 상세 기능</div>
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">
                <Button
                  variant="ghost"
                  className="h-auto p-0 font-semibold hover:bg-gray-100"
                  onClick={() => handleSort('pjtNo')}
                >
                  <div className="flex items-center gap-1">
                    PJT NO
                    {renderSortIcon('pjtNo')}
                  </div>
                </Button>
              </TableHead>
              <TableHead>프로젝트명</TableHead>
              <TableHead className="w-[110px]">
                <Button
                  variant="ghost"
                  className="h-auto p-0 font-semibold hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-1">
                    상태
                    {renderSortIcon('status')}
                  </div>
                </Button>
              </TableHead>
              <TableHead className="w-[100px]">PM</TableHead>
              <TableHead className="w-[120px]">영업</TableHead>
              <TableHead className="w-[100px]">
                <Button
                  variant="ghost"
                  className="h-auto p-0 font-semibold hover:bg-gray-100"
                  onClick={() => handleSort('costRatio')}
                >
                  <div className="flex items-center gap-1">
                    투입률
                    {renderSortIcon('costRatio')}
                  </div>
                </Button>
              </TableHead>
              <TableHead className="w-[200px]">비고</TableHead>
              <TableHead className="w-[90px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedProjects.map((p) => (
              <TableRow key={p.id} onDoubleClick={() => onEdit(p)} className="hover:bg-zinc-50">
                <TableCell className="font-mono text-xs">{p.pjtNo}</TableCell>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell><StatusBadge status={p.status} /></TableCell>
                <TableCell className="text-xs">{p.pm}</TableCell>
                <TableCell className="text-xs">{p.salesManagers?.join(", ") || "-"}</TableCell>
                <TableCell className="text-center">
                  <CostRatio costHistory={p.costHistory} />
                </TableCell>
                <TableCell className="text-xs text-gray-600 max-w-[150px] truncate" title={p.note || ""}>
                  {p.note || "-"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center gap-1">
                    <Button 
                      size="icon" 
                      variant="outline" 
                      onClick={() => onEdit(p)}
                      title="프로젝트 수정"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="secondary" 
                      onClick={() => onSchedule(p)}
                      title="일정 관리"
                    >
                      <Calendar className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="outline" 
                      className="border-purple-200 text-purple-700 hover:bg-purple-50" 
                      onClick={() => onEquipmentHistory(p)}
                      title="설비 이력"
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="outline" 
                      className="border-blue-200 text-blue-700 hover:bg-blue-50" 
                      onClick={() => onCostHistory(p)}
                      title="투입률 이력"
                    >
                      <TrendingUp className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => onDelete(p.id)}
                      title="프로젝트 삭제"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

