"use client";
import React, { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateDynamicTimeline, calculateGanttPosition, calculateGanttWidth, calculateTodayPosition } from "@/lib/ganttUtils";
import { Project } from "@/lib/types";
import PersonnelCalendar from "./PersonnelCalendar";

interface GanttChartProps {
  projects: Project[];
  scheduleItems: any[];
  people: Array<{ id: string; name: string; affiliation: string; department: string }>;
  managerStatuses: Record<string, Record<string, string>>;
  onScheduleItemUpdate: (id: string, field: string, value: any) => void;
  onScheduleItemDelete: (id: string) => void;
  onScheduleItemAdd: () => void;
  onPersonUpdate: (index: number, field: string, value: string) => void;
  onPersonAdd: () => void;
  onPersonDelete: (index: number) => void;
  onCalendarOpen: (person: any) => void;
  onSave: () => void;
  onStatusUpdate: (managerId: string, dateKey: string, status: string) => void;
}

export default function GanttChart({ 
  projects, 
  scheduleItems, 
  people, 
  managerStatuses,
  onScheduleItemUpdate,
  onScheduleItemDelete,
  onScheduleItemAdd,
  onPersonUpdate,
  onPersonAdd,
  onPersonDelete,
  onCalendarOpen,
  onSave,
  onStatusUpdate
}: GanttChartProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);

  const timeline = useMemo(() => generateDynamicTimeline(scheduleItems), [scheduleItems]);
  const todayPosition = useMemo(() => calculateTodayPosition(scheduleItems), [scheduleItems]);

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 80) return 'bg-yellow-500';
    if (progress >= 50) return 'bg-blue-500';
    return 'bg-gray-500';
  };

  const calculateDuration = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    return Math.max(1, daysDiff + 1);
  };

  const handleCalendarOpen = (person: any) => {
    setSelectedPerson(person);
    setCalendarOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* 프로젝트 일정 (간트차트) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            프로젝트 일정 (간트차트)
          </div>
        </div>
        
        {/* 컴팩트 간트차트 */}
        <div className="border rounded-lg overflow-hidden w-full max-w-7xl mx-auto">
          <div className="bg-gray-50 p-2 border-b">
            <div className="text-sm font-medium text-gray-700">프로젝트 일정 간트차트</div>
          </div>
          
          {/* 컴팩트 간트차트 컨테이너 */}
          <div className="bg-white">
            {/* 헤더 영역 */}
            <div className="border-b bg-gray-50">
              <div className="flex">
                {/* 좌측 헤더 */}
                <div className="w-96 flex-shrink-0 border-r bg-gray-50">
                  <div className="grid grid-cols-4 gap-0 text-[10px] font-medium text-gray-700 auto-rows-[24px]">
                    <div className="text-center flex items-center justify-center border-b border-r">Task</div>
                    <div className="text-center flex items-center justify-center border-b border-r">Days</div>
                    <div className="text-center flex items-center justify-center border-b border-r">Start</div>
                    <div className="text-center flex items-center justify-center border-b">End</div>
                  </div>
                </div>
                
                {/* 우측 헤더 - 타임라인 */}
                <div className="flex-1">
                  {(() => {
                    const entries = Object.entries(timeline.yearGroups).sort((a, b) => Number(a[0]) - Number(b[0]));
                    const totalMonths = entries.reduce((sum, [, months]) => sum + months.length, 0);
                    return (
                      <div className="grid grid-rows-[auto_auto] gap-0">
                        {/* 년도 헤더 */}
                        <div
                          className="text-[10px] text-gray-700 font-semibold"
                          style={{ display: 'grid', gridTemplateColumns: `repeat(${totalMonths}, 1fr)` }}
                        >
                          {entries.map(([year, months], index) => {
                            const bluePattern = [
                              'bg-blue-100 text-blue-700',
                              'bg-blue-200 text-blue-800',
                              'bg-blue-300 text-blue-900'
                            ];
                            const colorClass = bluePattern[index % 3];
                            
                            return (
                              <div
                                key={year}
                                className={`text-center py-1 rounded-none border-r border-b ${colorClass}`}
                                style={{ gridColumn: `span ${months.length} / span ${months.length}` }}
                              >
                                {year}년
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* 월 헤더 */}
                        <div
                          className="text-[10px] text-gray-600"
                          style={{ display: 'grid', gridTemplateColumns: `repeat(${totalMonths}, 1fr)` }}
                        >
                          {entries.flatMap(([year, months]) =>
                            months.map((month, monthIndex) => (
                              <div 
                                key={`${year}-${month}`} 
                                className={`text-center bg-white py-1 border-r border-b ${monthIndex === entries.flatMap(([, m]) => m).length - 1 ? 'border-r-0' : ''}`}
                              >
                                {month}월
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
            
            {/* 본문 영역 */}
            <div className="overflow-y-auto max-h-[600px]">
              {scheduleItems.map((item, index) => (
                <div key={item.id} className="flex border-b last:border-b-0">
                  {/* 좌측: 일정 정보 */}
                  <div className="w-96 flex-shrink-0 border-r bg-gray-25">
                    <div className="grid grid-cols-4 gap-0 text-[9px] auto-rows-[20px]">
                      <div className="text-center flex items-center justify-center border-r p-0.5">
                        <input
                          type="text"
                          value={item.name || ''}
                          onChange={(e) => onScheduleItemUpdate(item.id, 'name', e.target.value)}
                          className="w-full h-4 text-[9px] border-none bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 text-center"
                          placeholder="항목명"
                        />
                      </div>
                      <div className="text-center flex items-center justify-center border-r text-[9px] text-gray-600">
                        {item.startDate && item.endDate ? 
                          `${calculateDuration(item.startDate, item.endDate)}` : 
                          '-'
                        }
                      </div>
                      <div className="text-center flex items-center justify-center border-r p-0.5">
                        <input
                          type="date"
                          value={item.startDate || ''}
                          onChange={(e) => onScheduleItemUpdate(item.id, 'startDate', e.target.value)}
                          className="w-full h-4 text-[9px] border-none bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="text-center flex items-center justify-center p-0.5">
                        <input
                          type="date"
                          value={item.endDate || ''}
                          onChange={(e) => onScheduleItemUpdate(item.id, 'endDate', e.target.value)}
                          className="w-full h-4 text-[9px] border-none bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    
                    {/* 진행률 및 삭제 버튼 */}
                    <div className="flex justify-between items-center px-2 py-1 border-t bg-white">
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-gray-500">진행률:</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.progress || 0}
                          onChange={(e) => onScheduleItemUpdate(item.id, 'progress', parseInt(e.target.value) || 0)}
                          className="w-12 h-4 text-[9px] border border-gray-300 rounded px-1 text-center"
                        />
                        <span className="text-[9px] text-gray-500">%</span>
                      </div>
                      <button
                        onClick={() => onScheduleItemDelete(item.id)}
                        className="text-red-500 hover:text-red-700 text-[9px] px-1 py-0.5 rounded hover:bg-red-50 h-4"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                  
                  {/* 우측: 간트차트 레인 */}
                  <div className="flex-1 relative bg-white" style={{ height: '40px' }}>
                    {/* 오늘 날짜 표시선 */}
                    <div 
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500 border-l border-dashed border-red-400 z-10"
                      style={{ 
                        left: `${todayPosition}%` 
                      }}
                    />
                    
                    {item.startDate && item.endDate ? (
                      <div 
                        className="absolute top-1/2 transform -translate-y-1/2 h-3 rounded-sm transition-all duration-300"
                        style={{
                          left: `${calculateGanttPosition(item.startDate, scheduleItems)}%`,
                          width: `${calculateGanttWidth(item.startDate, item.endDate, scheduleItems)}%`,
                          backgroundColor: item.progress >= 100 ? '#10b981' : 
                                         item.progress >= 80 ? '#f59e0b' : 
                                         item.progress >= 50 ? '#3b82f6' : '#6b7280'
                        }}
                      >
                        {/* 진행률 표시 */}
                        <div 
                          className="h-full bg-black bg-opacity-30 rounded-sm transition-all duration-300"
                          style={{ width: `${item.progress}%` }}
                        ></div>
                        
                        {/* 항목명 표시 */}
                        <div className="absolute inset-0 flex items-center justify-center text-[9px] text-white font-medium px-1 truncate">
                          {item.name || '항목명'}
                        </div>
                      </div>
                    ) : (
                      <div className="absolute top-1/2 transform -translate-y-1/2 text-[9px] text-gray-400">
                        날짜를 설정하면 막대가 표시됩니다
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 하단 컨트롤 */}
          <div className="p-2 bg-gray-50 border-t">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-600">
                📊 총 <span className="font-semibold">{scheduleItems.length}</span>개 일정 항목
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={onScheduleItemAdd}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium"
                >
                  ✨ 일정 항목 추가
                </button>
                <button 
                  onClick={onSave}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium"
                >
                  💾 저장
                </button>
                <button 
                  onClick={() => {
                    // 전체 삭제 로직
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs font-medium"
                >
                  🗑️ 전체 삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 인원 투입 현황 (간트차트) */}
      <div className="space-y-4">
        <div className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          인원 투입 현황 (간트차트)
        </div>
        
        {/* 인원 투입 현황 간트차트 */}
        <div className="border rounded-lg overflow-hidden w-full max-w-7xl mx-auto">
          <div className="bg-gray-50 p-2 border-b">
            <div className="text-sm font-medium text-gray-700">인원 투입 현황 간트차트</div>
          </div>
          
          {/* 인원 투입 현황 컨테이너 */}
          <div className="bg-white">
            {/* 헤더 영역 */}
            <div className="border-b bg-gray-50">
              <div className="flex">
                {/* 좌측 헤더 */}
                <div className="w-96 flex-shrink-0 border-r bg-gray-50">
                  <div className="grid grid-cols-4 gap-0 text-[10px] font-medium text-gray-700 auto-rows-[24px]">
                    <div className="text-center flex items-center justify-center border-b border-r">이름</div>
                    <div className="text-center flex items-center justify-center border-b border-r">소속</div>
                    <div className="text-center flex items-center justify-center border-b border-r">부서</div>
                    <div className="text-center flex items-center justify-center border-b">상태</div>
                  </div>
                </div>
                
                {/* 우측 헤더 - 타임라인 */}
                <div className="flex-1">
                  {(() => {
                    const entries = Object.entries(timeline.yearGroups).sort((a, b) => Number(a[0]) - Number(b[0]));
                    const totalMonths = entries.reduce((sum, [, months]) => sum + months.length, 0);
                    return (
                      <div className="grid grid-rows-[auto_auto] gap-0">
                        {/* 년도 헤더 */}
                        <div
                          className="text-[10px] text-gray-700 font-semibold"
                          style={{ display: 'grid', gridTemplateColumns: `repeat(${totalMonths}, 1fr)` }}
                        >
                          {entries.map(([year, months], index) => {
                            const bluePattern = [
                              'bg-blue-100 text-blue-700',
                              'bg-blue-200 text-blue-800',
                              'bg-blue-300 text-blue-900'
                            ];
                            const colorClass = bluePattern[index % 3];
                            
                            return (
                              <div
                                key={year}
                                className={`text-center py-1 rounded-none border-r border-b ${colorClass}`}
                                style={{ gridColumn: `span ${months.length} / span ${months.length}` }}
                              >
                                {year}년
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* 월 헤더 */}
                        <div
                          className="text-[10px] text-gray-600"
                          style={{ display: 'grid', gridTemplateColumns: `repeat(${totalMonths}, 1fr)` }}
                        >
                          {entries.flatMap(([year, months]) =>
                            months.map((month, monthIndex) => (
                              <div 
                                key={`${year}-${month}`} 
                                className={`text-center bg-white py-1 border-r border-b ${monthIndex === entries.flatMap(([, m]) => m).length - 1 ? 'border-r-0' : ''}`}
                              >
                                {month}월
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
            
            {/* 본문 영역 */}
            <div className="overflow-y-auto max-h-[400px]">
              {people.map((person, index) => (
                <div key={person.id || index} className="flex border-b last:border-b-0">
                  {/* 좌측: 인원 정보 */}
                  <div className="w-96 flex-shrink-0 border-r bg-gray-25">
                    <div className="grid grid-cols-4 gap-0 text-[9px] auto-rows-[20px]">
                      <div className="text-center flex items-center justify-center border-r p-0.5">
                        <input
                          value={person.name}
                          onChange={(e) => onPersonUpdate(index, 'name', e.target.value)}
                          placeholder="이름"
                          className="w-full h-4 text-[9px] border border-gray-300 rounded px-1 text-center"
                        />
                      </div>
                      <div className="text-center flex items-center justify-center border-r p-0.5">
                        <input
                          value={person.affiliation}
                          onChange={(e) => onPersonUpdate(index, 'affiliation', e.target.value)}
                          placeholder="소속 (예: 피엔티)"
                          className="w-full h-4 text-[9px] border border-gray-300 rounded px-1 text-center"
                        />
                      </div>
                      <div className="text-center flex items-center justify-center border-r p-0.5">
                        <input
                          value={person.department}
                          onChange={(e) => onPersonUpdate(index, 'department', e.target.value)}
                          placeholder="부서"
                          className="w-full h-4 text-[9px] border border-gray-300 rounded px-1 text-center"
                        />
                      </div>
                      <div className="text-center flex items-center justify-center p-0.5">
                        <button 
                          onClick={() => handleCalendarOpen(person)}
                          className="w-full h-4 text-[8px] px-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded border border-blue-300 flex items-center justify-center gap-1"
                        >
                          📅 달력
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* 우측: 인원 투입 현황 시각화 */}
                  <div className="flex-1 relative bg-white" style={{ height: '40px' }}>
                    {/* 오늘 날짜 표시선 */}
                    <div 
                      className="absolute top-0 bottom-0 w-0.5 bg-red-500 border-l border-dashed border-red-400 z-10"
                      style={{ 
                        left: `${todayPosition}%` 
                      }}
                    />
                    
                    {/* 인원 상태 표시 */}
                    {(() => {
                      const personStatuses = managerStatuses[person.id];
                      if (!personStatuses || Object.keys(personStatuses).length === 0) {
                        return (
                          <div className="absolute top-1/2 transform -translate-y-1/2 text-[9px] text-gray-400 w-full text-center">
                            달력에서 상태를 설정하면 여기에 표시됩니다
                          </div>
                        );
                      }
                      
                      const localStatusColors: Record<string, string> = {
                        '미정': '#9ca3af',
                        '출근': '#10b981',
                        '휴무': '#ef4444',
                        '이동': '#f59e0b'
                      };
                      
                      const statusBars = Object.entries(personStatuses)
                        .map(([date, status]) => {
                          const statusStr = status as string;
                          const startDate = date;
                          const endDate = date;
                          
                          return (
                            <div 
                              key={date}
                              className="absolute top-1/2 transform -translate-y-1/2 h-3 rounded-sm transition-all duration-300 cursor-pointer hover:opacity-80"
                              style={{
                                left: `${calculateGanttPosition(startDate, scheduleItems)}%`,
                                width: `${calculateGanttWidth(startDate, endDate, scheduleItems)}%`,
                                backgroundColor: localStatusColors[statusStr] || '#9ca3af'
                              }}
                              title={`${date}: ${statusStr}`}
                              onClick={() => {
                                alert(`${person.name}의 ${date} 상태: ${statusStr}`);
                              }}
                            />
                          );
                        });
                      
                      return statusBars.length > 0 ? statusBars : (
                        <div className="absolute top-1/2 transform -translate-y-1/2 text-[9px] text-gray-400 w-full text-center">
                          달력에서 상태를 설정하면 여기에 표시됩니다
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 하단 컨트롤 */}
          <div className="p-2 bg-gray-50 border-t">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-600">
                👥 총 <span className="font-semibold">{people.length}</span>명의 담당자
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={onPersonAdd}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium"
                >
                  👤 인원 추가
                </button>
                <button 
                  onClick={() => {
                    alert('달력 보기 기능은 추후 구현 예정입니다.');
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm font-medium"
                >
                  📅 달력 보기
                </button>
                <button 
                  onClick={() => {
                    alert('상태 일괄 변경 기능은 추후 구현 예정입니다.');
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium"
                >
                  🔄 상태 일괄 변경
                </button>
              </div>
            </div>
            
            {/* 상태별 색상 설명 */}
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-green-500"></div>
                  <span>출근</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-red-500"></div>
                  <span>휴무</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-yellow-500"></div>
                  <span>이동</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-gray-200"></div>
                  <span>미정</span>
                </div>
              </div>
            </div>
            
            {/* 사용법 안내 */}
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="text-xs text-gray-600">
                💡 <strong>사용법:</strong> 
                우측 간트차트의 색상 막대를 클릭하면 해당 기간의 상태를 변경할 수 있습니다.
                "달력 보기" 버튼으로 월별 달력 형태로도 확인 가능합니다.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PersonnelCalendar 컴포넌트 */}
      <PersonnelCalendar
        open={calendarOpen}
        onOpenChange={setCalendarOpen}
        selectedManager={selectedPerson}
        managerStatuses={managerStatuses}
        onStatusUpdate={onStatusUpdate}
      />
    </div>
  );
}
