// 애플리케이션 상수 정의
export const STATUS_COLORS = {
  "진행 중(관리필요)": "#ef4444",
  "진행 중": "#3b82f6",
  "일시 중단": "#eab308",
  "완료": "#22c55e",
  "계획": "#9ca3af",
} as const;

export const STATUS_LABELS = {
  "진행 중(관리필요)": "관리필요",
  "진행 중": "진행중",
  "일시 중단": "일시중단",
  "완료": "완료",
  "계획": "계획",
} as const;

export const OSM_TILE = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
export const OSM_ATTR = "© OpenStreetMap contributors";
export const STYLE_TAG_ID = "leaflet-custom-style";

export const DEFAULT_MAP_CENTER = [37.5665, 126.9780] as const;
export const DEFAULT_MAP_ZOOM = 5;

export const GANTT_LEFT_WIDTH = 384;
export const GANTT_ROW_HEIGHT = 56;

export const PROGRESS_THRESHOLDS = {
  WARNING: 70,
  CRITICAL: 80,
} as const;

export const TIMELINE_MONTHS = {
  PAST: 6,
  FUTURE: 6,
  TOTAL: 13,
} as const;
