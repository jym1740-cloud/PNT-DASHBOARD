import { ScheduleItem } from './types';
import { TIMELINE_MONTHS } from './constants';

export interface TimelineData {
  yearGroups: Record<number, number[]>;
  totalDays: number;
  startDate: Date;
}

// 동적 시간축 생성 - 년도와 월을 계층적으로 구성
export function generateDynamicTimeline(scheduleItems: ScheduleItem[]): TimelineData {
  // scheduleItems가 undefined, null이거나 배열이 아닌 경우 빈 배열로 처리
  if (!scheduleItems || !Array.isArray(scheduleItems) || scheduleItems.length === 0) {
    // 항목이 없으면 이전 6개월부터 현재 월 + 6개월까지 표시 (총 13개월)
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const yearGroups: Record<number, number[]> = {};
    
    // 이전 6개월부터 현재 월 + 6개월까지 (총 13개월)
    for (let i = -TIMELINE_MONTHS.PAST; i < TIMELINE_MONTHS.FUTURE + 1; i++) {
      const month = currentMonth + i;
      const year = currentYear + Math.floor((currentMonth + i) / 12);
      const actualMonth = ((currentMonth + i + 12) % 12) + 1;
      
      if (!yearGroups[year]) {
        yearGroups[year] = [];
      }
      yearGroups[year].push(actualMonth);
    }
    
    // 정확한 시작일 계산 (이전 6개월) - 년도 경계 처리
    let startYear = currentYear;
    let startMonth = currentMonth - TIMELINE_MONTHS.PAST;
    
    if (startMonth < 0) {
      startYear = currentYear - 1;
      startMonth = startMonth + 12;
    }
    
    const startDate = new Date(startYear, startMonth, 1);
    
    return {
      yearGroups,
      totalDays: TIMELINE_MONTHS.TOTAL * 30, // 13개월
      startDate: startDate
    };
  }
  
  // 모든 항목의 시작일과 종료일을 고려하여 타임라인 생성
  const allDates: Date[] = [];
  scheduleItems.forEach(item => {
    if (item.startDate) allDates.push(new Date(item.startDate));
    if (item.endDate) allDates.push(new Date(item.endDate));
  });
  
  if (allDates.length === 0) {
    // 기본값 반환 (이전 6개월부터 미래 6개월까지)
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const yearGroups: Record<number, number[]> = {};
    
    // 이전 6개월부터 현재 월 + 6개월까지 (총 13개월)
    for (let i = -TIMELINE_MONTHS.PAST; i < TIMELINE_MONTHS.FUTURE + 1; i++) {
      const month = currentMonth + i;
      const year = currentYear + Math.floor((currentMonth + i) / 12);
      const actualMonth = ((currentMonth + i + 12) % 12) + 1;
      
      if (!yearGroups[year]) {
        yearGroups[year] = [];
      }
      yearGroups[year].push(actualMonth);
    }
    
    // 정확한 시작일 계산 (이전 6개월) - 년도 경계 처리
    let startYear = currentYear;
    let startMonth = currentMonth - TIMELINE_MONTHS.PAST;
    
    if (startMonth < 0) {
      startYear = currentYear - 1;
      startMonth = startMonth + 12;
    }
    
    const startDate = new Date(startYear, startMonth, 1);
    
    return {
      yearGroups,
      totalDays: TIMELINE_MONTHS.TOTAL * 30, // 13개월
      startDate: startDate
    };
  }
  
  const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
  
  // 시작일 이전 2개월부터 종료일 이후 2개월까지 포함 (여유 마진)
  const startDate = new Date(minDate.getFullYear(), minDate.getMonth() - 2, 1);
  
  // end date의 월까지 완벽하게 포함하기 위해 해당 월의 마지막 날로 설정
  const endDate = new Date(maxDate.getFullYear(), maxDate.getMonth() + 2, 0);
  
  const yearGroups: Record<number, number[]> = {};
  let currentDate = new Date(startDate);
  
  // end date의 월까지 완벽하게 포함 (년도 구분 정확하게)
  while (currentDate <= endDate) {
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    
    if (!yearGroups[year]) {
      yearGroups[year] = [];
    }
    yearGroups[year].push(month);
    
    // 다음 달로 이동
    currentDate.setMonth(currentDate.getMonth() + 1);
  }
  
  const totalDays = Math.ceil((maxDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  return {
    yearGroups,
    totalDays,
    startDate
  };
}

// 요일 헤더 생성 (월별 구조에 맞춤)
export function generateDayHeaders(scheduleItems: ScheduleItem[]): string[] {
  const { yearGroups } = generateDynamicTimeline(scheduleItems);
  const dayHeaders: string[] = [];
  
  // yearGroups에서 모든 월을 추출하여 헤더 생성
  Object.values(yearGroups).forEach(months => {
    months.forEach(() => {
      dayHeaders.push(''); // 월별 구분이므로 요일은 표시하지 않음
    });
  });
  
  return dayHeaders;
}

// 간트차트 막대 시작 위치 계산 - 정확도 향상
export function calculateGanttPosition(startDate: string, scheduleItems: ScheduleItem[]): number {
  if (!startDate) return 0;
  
  const timeline = generateDynamicTimeline(scheduleItems);
  const start = new Date(startDate);
  const timelineStart = timeline.startDate;
  
  // 타임라인 전체 범위 계산
  const timelineEnd = new Date(timelineStart);
  timelineEnd.setMonth(timelineEnd.getMonth() + Object.values(timeline.yearGroups).reduce((sum, months) => sum + months.length, 0));
  
  const totalDays = Math.ceil((timelineEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
  
  // 시작일부터의 일수 계산
  const daysFromStart = Math.ceil((start.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
  
  // 정확한 픽셀 위치 계산
  const percent = ((daysFromStart / totalDays) * 100);
  
  return Math.max(0, Math.min(99, percent));
}

// 간트차트 막대 너비 계산 - 정확도 향상
export function calculateGanttWidth(startDate: string, endDate: string, scheduleItems: ScheduleItem[]): number {
  if (!startDate || !endDate) return 0;

  const timeline = generateDynamicTimeline(scheduleItems);
  const start = new Date(startDate);
  const end = new Date(endDate);
  const timelineStart = timeline.startDate;
  
  // 타임라인 전체 범위 계산
  const timelineEnd = new Date(timelineStart);
  timelineEnd.setMonth(timelineEnd.getMonth() + Object.values(timeline.yearGroups).reduce((sum, months) => sum + months.length, 0));
  
  const totalDays = Math.ceil((timelineEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
  
  // 시작일과 종료일부터의 일수 계산
  const startDaysFromStart = Math.ceil((start.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
  const endDaysFromStart = Math.ceil((end.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
  
  // 정확한 픽셀 너비 계산
  const widthPercent = ((endDaysFromStart - startDaysFromStart) / totalDays) * 100;
  return Math.max(1, Math.min(100, widthPercent)); // 최소 1% 보장
}

// 오늘 날짜 기준선 위치 계산 - 타임라인 기반으로 정확하게
export function calculateTodayPosition(scheduleItems: ScheduleItem[]): number {
  const today = new Date();
  const timeline = generateDynamicTimeline(scheduleItems);
  const timelineStart = timeline.startDate;
  
  // 타임라인 전체 범위 계산
  const timelineEnd = new Date(timelineStart);
  timelineEnd.setMonth(timelineEnd.getMonth() + Object.values(timeline.yearGroups).reduce((sum, months) => sum + months.length, 0));
  
  const totalDays = Math.ceil((timelineEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
  const daysFromStart = Math.ceil((today.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
  
  // 정확한 픽셀 위치 계산
  const percent = ((daysFromStart / totalDays) * 100);
  
  return Math.max(0, Math.min(99, percent));
}

// 간트차트 컨테이너 너비 계산
export function getGanttContainerWidth(): number {
  const container = document.querySelector('.gantt-right-lane');
  return container ? container.clientWidth - 20 : 800; // 패딩 20px 제외
}

// 픽셀 단위 변환
export function percentageToPixels(percentage: number, containerWidth: number): number {
  return (percentage / 100) * containerWidth;
}
