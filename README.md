# Company Operations Dashboard

회사 운영 대시보드로, 프로젝트를 관리하고 세계 지도에 표시하는 기능을 제공합니다.

## 주요 기능

- 🌍 **세계 지도**: 프로젝트 위치를 시각적으로 표시
- 📊 **프로젝트 관리**: CRUD 작업 지원
- 🔍 **검색 및 필터링**: 프로젝트명, 번호, 국가, PM으로 검색
- 📅 **날짜 선택**: 직관적인 달력 인터페이스
- 🗺️ **지도 클릭 좌표 선택**: 지도에서 직접 좌표 설정
- 📈 **투입률 차트**: ECharts 기반 안전한 차트 렌더링

## 기술 스택

- **Frontend**: Next.js 14, React 18, TypeScript
- **UI Components**: Radix UI, Tailwind CSS
- **Maps**: Leaflet
- **Charts**: ECharts 6.0 + echarts-for-react 3.0
- **Animations**: Framer Motion
- **Date Handling**: date-fns

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`을 열어 대시보드를 확인하세요.

## 사용 방법

### 프로젝트 추가
1. "신규 프로젝트" 버튼 클릭
2. 프로젝트 정보 입력
3. 지도에서 직접 좌표 설정

### 프로젝트 수정
- 프로젝트 리스트에서 더블클릭 또는 편집 버튼 클릭

### 프로젝트 삭제
- 프로젝트 리스트에서 삭제 버튼 클릭

### 투입률 이력 관리
- 프로젝트별 투입률 이력을 차트로 시각화
- 시간별 예산 및 실제 비용 추적
- 자동 상태 업데이트 (투입률 70% 초과 시 관리필요 상태)

## 프로젝트 구조

```
company-ops-dashboard/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 루트 레이아웃
│   ├── page.tsx           # 메인 대시보드
│   └── globals.css        # 전역 스타일
├── components/             # UI 컴포넌트
│   ├── ui/                # 기본 UI 컴포넌트들
│   ├── WorldMap.tsx       # 세계 지도 컴포넌트
│   ├── CostHistoryManager.tsx # 투입률 이력 관리 (ECharts)
│   ├── ProjectTable.tsx   # 프로젝트 테이블
│   ├── StatusOverview.tsx # 상태별 현황
│   ├── GanttChart.tsx     # 간트 차트
│   └── LocationManager.tsx # 위치 관리
├── lib/                    # 유틸리티 함수
│   ├── utils.ts           # 공통 유틸리티 + ECharts 안전성 함수
│   ├── projectUtils.ts    # 프로젝트 관련 유틸리티
│   ├── types.ts           # TypeScript 타입 정의
│   └── constants.ts       # 상수 정의
└── package.json            # 프로젝트 설정
```

## 빌드 및 배포

### 프로덕션 빌드

```bash
npm run build
```

### 프로덕션 서버 실행

```bash
npm start
```

### 번들 분석 (선택사항)

```bash
npm run analyze
```

## ECharts 안전성 개선사항

### v0.3.0에서 해결된 문제들

1. **Chart.js 완전 제거**
   - Chart.js 관련 모든 의존성 제거
   - SSR 문제 완전 해결
   - 플러그인 등록 문제 해결

2. **ECharts로 전환**
   - 더 안정적인 차트 라이브러리
   - 한국어 지원 및 다양한 차트 타입
   - SSR 문제 없음

3. **데이터 검증 강화**
   - ECharts 데이터 및 옵션 유효성 검사
   - 안전한 배열 최대값/최소값 계산 함수
   - 빈 데이터 처리 시 graceful fallback

4. **에러 핸들링**
   - 차트 렌더링 실패 시 사용자 친화적 메시지
   - 로딩 상태 표시
   - 안전한 데이터 처리

### 배포 시 안정성 향상

- **ECharts 사용**: SSR 문제 완전 해결
- **동적 로딩**: 클라이언트 사이드에서만 차트 로드
- **데이터 검증**: 모든 차트 데이터의 유효성 사전 검사
- **안전한 계산**: 빈 배열, undefined 값 등에 대한 안전한 처리

## 라이선스

MIT License

## 기여

이슈나 풀 리퀘스트를 환영합니다!

## 버전 히스토리

- **v0.3.0**: Chart.js를 ECharts로 완전 전환
  - Chart.js 관련 모든 의존성 제거
  - ECharts 기반 안정적인 차트 렌더링
  - SSR 문제 완전 해결
  - 투입률 차트 배포 시 안정성 대폭 향상

- **v0.2.1**: Chart.js 안전성 대폭 개선
  - Chart.js SSR 문제 해결
  - 에러 바운더리 및 안전한 데이터 처리
  - 플러그인 안전 등록 및 의존성 최적화

- **v0.2**: 실행 안정화 패치
  - "use client" 적용
  - Leaflet 동적 import로 초기 렌더 문제 해결
  - 투입률 차트 배포 시 안정성 향상

- **v0.1**: 초기 버전
  - 기본 프로젝트 관리 기능
  - 세계 지도 표시
  - 검색 및 필터링