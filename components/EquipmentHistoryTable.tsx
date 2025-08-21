'use client';

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, FileText } from 'lucide-react';

interface EquipmentHistory {
  id: string;
  date: string;
  part: string;
  content: string;
  action: string;
  manager: string;
}

interface EquipmentHistoryTableProps {
  equipmentHistory: EquipmentHistory[];
  onUpdate: (id: string, field: string, value: string) => void;
  onDelete: (id: string) => void;
}

export default function EquipmentHistoryTable({ 
  equipmentHistory, 
  onUpdate, 
  onDelete 
}: EquipmentHistoryTableProps) {
  return (
    <div className="space-y-4">
      {/* 이력 추가 버튼 */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          총 <span className="font-semibold text-purple-600">{equipmentHistory.length}</span>건의 이력이 있습니다.
        </div>
      </div>

      {/* 설비이력 테이블 */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[120px]">날짜</TableHead>
              <TableHead className="w-[140px]">파트</TableHead>
              <TableHead>내용</TableHead>
              <TableHead>조치내역</TableHead>
              <TableHead className="w-[120px]">담당자</TableHead>
              <TableHead className="w-[100px]">액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {equipmentHistory.map((history) => (
              <TableRow key={history.id} className="hover:bg-gray-50">
                <TableCell>
                  <Input
                    type="date"
                    value={history.date}
                    onChange={(e) => onUpdate(history.id, 'date', e.target.value)}
                    className="text-sm"
                  />
                </TableCell>
                <TableCell>
                  <Select 
                    value={history.part} 
                    onValueChange={(value) => onUpdate(history.id, 'part', value)}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="기구">기구</SelectItem>
                      <SelectItem value="제어">제어</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Textarea
                    value={history.content}
                    onChange={(e) => onUpdate(history.id, 'content', e.target.value)}
                    placeholder="문제/상황 내용"
                    className="text-sm min-h-[60px] resize-none"
                  />
                </TableCell>
                <TableCell>
                  <Textarea
                    value={history.action}
                    onChange={(e) => onUpdate(history.id, 'action', e.target.value)}
                    placeholder="조치 내용"
                    className="text-sm min-h-[60px] resize-none"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={history.manager}
                    onChange={(e) => onUpdate(history.id, 'manager', e.target.value)}
                    placeholder="담당자"
                    className="text-sm"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(history.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="삭제"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {equipmentHistory.length === 0 && (
          <div className="px-8 py-12 text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <div className="text-lg font-medium mb-2">설비이력이 없습니다</div>
            <div className="text-sm">"새 이력 추가" 버튼을 클릭하여 첫 번째 이력을 추가하세요.</div>
          </div>
        )}
      </div>
    </div>
  );
}


