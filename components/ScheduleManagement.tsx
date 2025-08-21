"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar, Clock, AlertTriangle } from "lucide-react";

interface ScheduleManagementProps {
  scheduleOpen: boolean;
  onScheduleClose: () => void;
  selectedSchedule: any;
  onScheduleSelect: (schedule: any) => void;
  scheduleItems: any[];
  onScheduleItemsUpdate: (items: any[]) => void;
}

export default function ScheduleManagement({
  scheduleOpen,
  onScheduleClose,
  selectedSchedule,
  onScheduleSelect,
  scheduleItems,
  onScheduleItemsUpdate
}: ScheduleManagementProps) {
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedManager, setSelectedManager] = useState<any>(null);

  const statusColors: { [key: number]: string } = {
    0: 'bg-gray-200', // 미정
    1: 'bg-green-500', // 출근
    2: 'bg-red-500', // 휴무
    3: 'bg-yellow-500' // 이동
  };

  const statusLabels: { [key: number]: string } = {
    0: '미정',
    1: '출근',
    2: '휴무',
    3: '이동'
  };

  const generateCalendar = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const calendar = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= lastDay || currentDate.getDay() !== 0) {
      calendar.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return calendar;
  };

  const getCurrentStatus = (managerId: string, date: Date) => {
    const dateKey = date.toISOString().split('T')[0];
    return selectedManager?.schedule?.[dateKey] || 0;
  };

  const handleStatusChange = (managerId: string, date: Date) => {
    if (!selectedManager) return;
    
    const dateKey = date.toISOString().split('T')[0];
    const currentStatus = getCurrentStatus(managerId, date);
    const nextStatus = (currentStatus + 1) % 4;
    
    const updatedManager = {
      ...selectedManager,
      schedule: {
        ...selectedManager.schedule,
        [dateKey]: nextStatus
      }
    };
    
    setSelectedManager(updatedManager);
    
    // 전체 스케줄 아이템 업데이트
    const updatedItems = scheduleItems.map(item => 
      item.id === managerId ? updatedManager : item
    );
    onScheduleItemsUpdate(updatedItems);
  };

  const calendar = generateCalendar(selectedYear, selectedMonth);
  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];

  return (
    <>
      {/* 일정 관리 버튼 */}
      <Button
        onClick={() => setCalendarModalOpen(true)}
        variant="outline"
        className="flex items-center gap-2"
      >
        <Calendar className="w-4 h-4" />
        일정 관리
      </Button>

      {/* 일정 관리 모달 */}
      <Dialog open={calendarModalOpen} onOpenChange={setCalendarModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>일정 관리</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* 년도 선택 */}
            <div className="flex gap-2 justify-center">
              {[selectedYear - 2, selectedYear - 1, selectedYear, selectedYear + 1, selectedYear + 2].map(year => (
                <Button
                  key={year}
                  variant={year === selectedYear ? "default" : "outline"}
                  onClick={() => setSelectedYear(year)}
                  size="sm"
                >
                  {year}년
                </Button>
              ))}
            </div>

            {/* 월 선택 */}
            <div className="grid grid-cols-6 gap-2">
              {monthNames.map((month, index) => (
                <Button
                  key={index}
                  variant={index === selectedMonth ? "default" : "outline"}
                  onClick={() => setSelectedMonth(index)}
                  size="sm"
                >
                  {month}
                </Button>
              ))}
            </div>

            {/* 매니저 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                매니저 선택
              </label>
              <select
                value={selectedManager?.id || ""}
                onChange={(e) => {
                  const manager = scheduleItems.find(item => item.id === e.target.value);
                  setSelectedManager(manager);
                }}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">매니저를 선택하세요</option>
                {scheduleItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 달력 */}
            {selectedManager && (
              <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">
                  {selectedManager.name} - {selectedYear}년 {monthNames[selectedMonth]}
                </h3>
                
                <div className="grid grid-cols-7 gap-1 text-xs">
                  {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                    <div key={day} className="p-2 text-center font-medium bg-gray-100">
                      {day}
                    </div>
                  ))}
                  
                  {calendar.map((date, index) => {
                    const isCurrentMonth = date.getMonth() === selectedMonth;
                    const isToday = date.toDateString() === new Date().toDateString();
                    const currentStatus = getCurrentStatus(selectedManager.id, date);
                    
                    return (
                      <button
                        key={index}
                        onClick={() => handleStatusChange(selectedManager.id, date)}
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
                            {date.getDate()}
                          </div>
                        </div>
                      </button>
                    );
                  })}
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
            <Button onClick={() => setCalendarModalOpen(false)} variant="outline">
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
