"use client";
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PersonnelCalendarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedManager: { id: string; name: string; affiliation: string; department: string } | null;
  managerStatuses: Record<string, Record<string, string>>;
  onStatusUpdate: (managerId: string, dateKey: string, status: string) => void;
}

export default function PersonnelCalendar({
  open,
  onOpenChange,
  selectedManager,
  managerStatuses,
  onStatusUpdate
}: PersonnelCalendarProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const statusColors: Record<string, string> = {
    '미정': 'bg-gray-200',
    '출근': 'bg-green-500',
    '휴무': 'bg-red-500',
    '이동': 'bg-yellow-500'
  };

  const statusOrder = ['미정', '출근', '휴무', '이동'];

  const handleStatusChange = (dateKey: string) => {
    if (!selectedManager) return;
    
    const currentStatus = managerStatuses[selectedManager.id]?.[dateKey] || '미정';
    const currentIndex = statusOrder.indexOf(currentStatus);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
    
    onStatusUpdate(selectedManager.id, dateKey, nextStatus);
  };

  if (!selectedManager) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            📅 인원 상태 달력 - {selectedManager.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* 년도 선택 */}
          <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 rounded-lg">
            <button
              onClick={() => setSelectedYear(prev => prev - 1)}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm font-medium"
            >
              ◀ 이전 년도
            </button>
            <div className="text-xl font-bold text-gray-800 px-4">
              {selectedYear}년
            </div>
            <button
              onClick={() => setSelectedYear(prev => prev + 1)}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm font-medium"
            >
              다음 년도 ▶
            </button>
          </div>
          
          {/* 월별 달력 선택 */}
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => (
              <button
                key={month}
                onClick={() => setSelectedMonth(month)}
                className={`p-4 border rounded-lg transition-colors text-center ${
                  selectedMonth === month 
                    ? 'bg-blue-100 border-blue-400 text-blue-700' 
                    : 'hover:bg-blue-50 hover:border-blue-300'
                }`}
              >
                <div className="text-lg font-semibold">{month}월</div>
                <div className="text-sm text-gray-600">달력 보기</div>
              </button>
            ))}
          </div>
          
          {/* 선택된 월의 실제 달력 표시 */}
          {selectedMonth && (
            <div className="border rounded-lg p-4 bg-white">
              <div className="text-lg font-semibold text-gray-700 mb-4 text-center">
                {selectedMonth}월 달력 - {selectedManager.name}
              </div>

              {/* 요일 헤더 */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-gray-600 p-2">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* 달력 그리드 */}
              <div className="grid grid-cols-7 gap-1">
                {(() => {
                  const firstDay = new Date(selectedYear, selectedMonth - 1, 1);
                  const lastDay = new Date(selectedYear, selectedMonth, 0);
                  const startDate = new Date(firstDay);
                  startDate.setDate(startDate.getDate() - firstDay.getDay());
                  
                  const days = [];
                  for (let i = 0; i < 42; i++) {
                    const currentDate = new Date(startDate);
                    currentDate.setDate(startDate.getDate() + i);
                    
                    const isCurrentMonth = currentDate.getMonth() === selectedMonth - 1;
                    const isToday = currentDate.toDateString() === new Date().toDateString();
                    const dateKey = currentDate.toISOString().split('T')[0];
                    
                    // 현재 담당자의 상태 가져오기
                    const currentStatus = managerStatuses[selectedManager.id]?.[dateKey] || '미정';
                    
                    days.push(
                      <button
                        key={i}
                        onClick={() => handleStatusChange(dateKey)}
                        className={`p-2 text-xs border rounded transition-all hover:scale-105 ${
                          isCurrentMonth 
                            ? 'bg-white hover:bg-gray-50' 
                            : 'bg-gray-100 text-gray-400'
                        } ${
                          isToday ? 'ring-2 ring-red-400' : ''
                        }`}
                        disabled={!isCurrentMonth}
                      >
                        <div className="text-center">
                          <div className={`w-4 h-4 rounded mx-auto mb-1 ${statusColors[currentStatus]}`}></div>
                          <div className={isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}>
                            {currentDate.getDate()}
                          </div>
                        </div>
                      </button>
                    );
                  }
                  return days;
                })()}
              </div>

              {/* 상태 변경 안내 */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-800">
                  💡 <strong>사용법:</strong> 날짜를 클릭할 때마다 상태가 순환됩니다.
                  <br />
                  <span className="text-xs">클릭 순서: 미정 → 출근 → 휴무 → 이동 → 미정...</span>
                </div>
              </div>
            </div>
          )}
          
          {/* 상태별 색상 설명 */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="text-sm font-medium text-gray-700 mb-3">상태별 색상 및 클릭 순서</div>
            <div className="grid grid-cols-4 gap-4 text-xs">
              <div className="text-center">
                <div className="w-8 h-8 rounded bg-gray-200 mx-auto mb-2 flex items-center justify-center text-gray-600 font-bold">0</div>
                <div className="font-medium">⚪ 미정</div>
                <div className="text-gray-600">초기 상태</div>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 rounded bg-green-500 mx-auto mb-2 flex items-center justify-center text-white font-bold">1</div>
                <div className="font-medium">🟢 출근</div>
                <div className="text-gray-600">1번 클릭</div>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 rounded bg-red-500 mx-auto mb-2 flex items-center justify-center text-white font-bold">2</div>
                <div className="font-medium">🔴 휴무</div>
                <div className="text-gray-600">2번 클릭</div>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 rounded bg-yellow-500 mx-auto mb-2 flex items-center justify-center text-white font-bold">3</div>
                <div className="font-medium">🟡 이동</div>
                <div className="text-gray-600">3번 클릭</div>
              </div>
            </div>
          </div>
          
          {/* 사용법 안내 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-blue-800">
              💡 <strong>사용법:</strong>
              <ul className="mt-2 space-y-1 text-xs">
                <li>• 위의 년도 버튼으로 원하는 년도를 선택합니다</li>
                <li>• 월별 달력 버튼을 클릭하여 해당 월의 달력을 확인합니다</li>
                <li>• 달력에서 날짜를 클릭할 때마다 상태가 순환됩니다 (미정 → 출근 → 휴무 → 이동 → 미정...)</li>
                <li>• 선택한 상태는 우측 간트차트에 실시간으로 반영됩니다</li>
                <li>• 여러 날짜를 드래그하여 일괄 상태 변경도 가능합니다 (향후 구현)</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

