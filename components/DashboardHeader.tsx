'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, HelpCircle } from 'lucide-react';
import Image from 'next/image';

interface DashboardHeaderProps {
  query: string;
  onQueryChange: (query: string) => void;
  statusFilter: string | undefined;
  onStatusFilterChange: (status: string | undefined) => void;
  onCreate: () => void;
  onHelpOpen: () => void;
}

export default function DashboardHeader({
  query,
  onQueryChange,
  statusFilter,
  onStatusFilterChange,
  onCreate,
  onHelpOpen
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/80 border-b">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
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
              <SelectItem value="진행 중(관리필요)">진행 중(관리필요)</SelectItem>
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
    </header>
  );
}

