'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, HelpCircle, RefreshCw, Clock } from 'lucide-react';
import Image from 'next/image';

interface DashboardHeaderProps {
  query: string;
  onQueryChange: (query: string) => void;
  statusFilter: string | undefined;
  onStatusFilterChange: (status: string | undefined) => void;
  onCreate: () => void;
  onHelpOpen: () => void;
  lastUpdateTime: Date;
  onManualUpdate: () => void;
}

export default function DashboardHeader({
  query,
  onQueryChange,
  statusFilter,
  onStatusFilterChange,
  onCreate,
  onHelpOpen,
  lastUpdateTime,
  onManualUpdate
}: DashboardHeaderProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  // 수동 업데이트 함수
  const handleManualUpdate = () => {
    setIsUpdating(true);
    onManualUpdate();
    setTimeout(() => {
      setIsUpdating(false);
    }, 500);
  };

  // 시간 포맷팅 함수
  const formatDateTime = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  // 상대적 시간 표시 (예: 2분 전, 1시간 전)
  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return '방금 전';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}분 전`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}시간 전`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}일 전`;
    }
  };

  return (
    <header className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/80 border-b">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* 메인 헤더 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Image 
              src="/pnt_logo.png" 
              alt="PNT 로고" 
              width={64} 
              height={64} 
              className="h-16 w-16"
            />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">프로젝트 운영 대시보드</h1>
              <p className="text-sm text-gray-600">프로젝트 관리 및 운영 현황</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input 
                value={query} 
                onChange={(e) => onQueryChange(e.target.value)} 
                placeholder="프로젝트 검색..." 
                className="pl-10 w-80 h-10 border-gray-200 focus:border-blue-500" 
              />
            </div>
            <Select onValueChange={(v) => onStatusFilterChange(v)} value={statusFilter}>
              <SelectTrigger className="w-44 h-10 border-gray-200">
                <SelectValue placeholder="상태별 필터" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="계획">계획</SelectItem>
                <SelectItem value="진행 중">진행 중</SelectItem>
                <SelectItem value="진행 중(관리필요)">진행 중<br/>(관리필요)</SelectItem>
                <SelectItem value="일시 중단">일시 중단</SelectItem>
                <SelectItem value="완료">완료</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={onCreate} className="h-10 px-6 bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2"/>신규 프로젝트
            </Button>
            <Button 
              onClick={onHelpOpen} 
              variant="ghost" 
              size="icon"
              className="h-10 w-10 text-gray-600 hover:text-blue-600"
              title="도움말"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* 업데이트 상태 바 */}
        <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2 border">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span className="font-medium">마지막 업데이트:</span>
            <span className="font-mono bg-white px-2 py-1 rounded border">
              {formatDateTime(lastUpdateTime)}
            </span>
            <span className="text-gray-500">
              ({getRelativeTime(lastUpdateTime)})
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>실시간 동기화</span>
            </div>
            <Button
              onClick={handleManualUpdate}
              variant="outline"
              size="sm"
              className="h-7 px-3 text-xs"
              disabled={isUpdating}
            >
              <RefreshCw className={`h-3 w-3 mr-1 ${isUpdating ? 'animate-spin' : ''}`} />
              {isUpdating ? '업데이트 중...' : '수동 업데이트'}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}