import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Project, ProjectStatus } from './types';
import { STATUS_COLORS, STATUS_LABELS } from './constants';

// Tailwind CSS 클래스 병합 유틸리티
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 상태별 아이콘과 색상 정보 반환
export function getStatusInfo(status: ProjectStatus) {
  switch (status) {
    case "진행 중(관리필요)":
      return { 
        icon: "AlertCircle", 
        color: STATUS_COLORS["진행 중(관리필요)"], 
        label: STATUS_LABELS["진행 중(관리필요)"] 
      };
    case "진행 중":
      return { 
        icon: "TrendingUp", 
        color: STATUS_COLORS["진행 중"], 
        label: STATUS_LABELS["진행 중"] 
      };
    case "일시 중단":
      return { 
        icon: "Clock", 
        color: STATUS_COLORS["일시 중단"], 
        label: STATUS_LABELS["일시 중단"] 
      };
    case "완료":
      return { 
        icon: "CheckCircle", 
        color: STATUS_COLORS["완료"], 
        label: STATUS_LABELS["완료"] 
      };
    default:
      return { 
        icon: "Calendar", 
        color: STATUS_COLORS["계획"], 
        label: STATUS_LABELS["계획"] 
      };
  }
}

// 한국 원화 포맷팅
export function formatKRW(value: number): string {
  return new Intl.NumberFormat("ko-KR").format(value) + "원";
}

// 천 단위 구분자 포맷팅 (숫자만)
export function formatNumberWithCommas(value: number): string {
  return value.toLocaleString('ko-KR');
}

// 쉼표가 포함된 문자열을 숫자로 변환
export function parseNumberFromString(value: string): number {
  return Number(value.replace(/,/g, ''));
}

// 투입률 계산
export function calculateInvestmentRate(budget: number, actualCost: number): number {
  if (budget <= 0) return 0;
  return (actualCost / budget) * 100;
}

// 투입률에 따른 상태 자동 변경
export function getAutoStatus(budget: number, actualCost: number): ProjectStatus {
  if (budget <= 0) return "계획";
  
  const rate = calculateInvestmentRate(budget, actualCost);
  if (rate > 70) return "진행 중(관리필요)";
  return "진행 중";
}

// 날짜 유효성 검사
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

// 두 날짜 간의 일수 계산
export function calculateDaysBetween(startDate: string, endDate: string): number {
  if (!isValidDate(startDate) || !isValidDate(endDate)) return 0;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

// 좌표 유효성 검사
export function isValidCoordinates(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180
  );
}

// 위도/경도를 SVG 좌표로 변환 (Equirectangular projection)
export function latLngToSVG(lat: number, lng: number, svgWidth = 1000, svgHeight = 500) {
  // 경도: -180 ~ 180 -> 0 ~ 1000 (Equirectangular)
  const x = ((lng + 180) / 360) * svgWidth;
  
  // 위도: 90 ~ -90 -> 0 ~ 500 (Equirectangular - 더 정확함)
  const y = ((90 - lat) / 180) * svgHeight;
  
  return { x, y };
}
