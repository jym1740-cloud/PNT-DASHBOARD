import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 숫자 문자열에서 숫자 추출 (쉼표, 원화 등 제거)
export function parseNumberFromString(value: string): number {
  if (!value || typeof value !== 'string') return 0;
  
  // 쉼표, 원화, 공백 제거 후 숫자만 추출
  const cleaned = value.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? 0 : parsed;
}

// 안전한 배열 계산 함수들
export function safeMax(values: number[]): number {
  if (!Array.isArray(values) || values.length === 0) {
    return 0;
  }
  
  const validValues = values.filter(v => typeof v === 'number' && !isNaN(v));
  return validValues.length > 0 ? Math.max(...validValues) : 0;
}

export function safeMin(values: number[]): number {
  if (!Array.isArray(values) || values.length === 0) {
    return 0;
  }
  
  const validValues = values.filter(v => typeof v === 'number' && !isNaN(v));
  return validValues.length > 0 ? Math.min(...validValues) : 0;
}

export function safeAverage(values: number[]): number {
  if (!Array.isArray(values) || values.length === 0) {
    return 0;
  }
  
  const validValues = values.filter(v => typeof v === 'number' && !isNaN(v));
  if (validValues.length === 0) return 0;
  
  const sum = validValues.reduce((acc, val) => acc + val, 0);
  return sum / validValues.length;
}

export function safeNumber(value: any, defaultValue: number = 0): number {
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }
  
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return !isNaN(parsed) ? parsed : defaultValue;
  }
  
  return defaultValue;
}