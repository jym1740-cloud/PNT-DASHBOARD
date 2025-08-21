# Company Operations Dashboard

회사 운영 대시보드로, 프로젝트를 관리하고 세계 지도에 표시하는 기능을 제공합니다.

## 주요 기능

- 🌍 **세계 지도**: 프로젝트 위치를 시각적으로 표시
- 📊 **프로젝트 관리**: CRUD 작업 지원
- 🔍 **검색 및 필터링**: 프로젝트명, 번호, 국가, PM으로 검색
- 📅 **날짜 선택**: 직관적인 달력 인터페이스
- 🗺️ **지도 클릭 좌표 선택**: 지도에서 직접 좌표 설정
- 🌐 **Google Geocoding**: 주소 입력으로 자동 좌표 변환

## 기술 스택

- **Frontend**: Next.js 14, React 18, TypeScript
- **UI Components**: Radix UI, Tailwind CSS
- **Maps**: react-simple-maps
- **Animations**: Framer Motion
- **Date Handling**: date-fns

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 Google Maps API 키를 설정하세요:

```bash
# .env.local
NEXT_PUBLIC_GOOGLE_MAPS_KEY=your_google_maps_api_key_here
```

Google Maps API 키는 [Google Cloud Console](https://console.cloud.google.com/apis/credentials)에서 얻을 수 있습니다.

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`을 열어 대시보드를 확인하세요.

## 사용 방법

### 프로젝트 추가
1. "신규 프로젝트" 버튼 클릭
2. 프로젝트 정보 입력
3. 주소 입력 후 "주소로 좌표 채우기" 버튼으로 자동 좌표 설정
4. 또는 "지도에서 좌표 선택" 모드로 지도 클릭으로 좌표 설정

### 프로젝트 수정
- 프로젝트 리스트에서 더블클릭 또는 편집 버튼 클릭

### 프로젝트 삭제
- 프로젝트 리스트에서 삭제 버튼 클릭

## 프로젝트 구조

```
company-ops-dashboard/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 루트 레이아웃
│   ├── page.tsx           # 메인 대시보드
│   └── globals.css        # 전역 스타일
├── components/             # UI 컴포넌트
│   └── ui/                # 기본 UI 컴포넌트들
├── lib/                    # 유틸리티 함수
│   └── utils.ts           # 공통 유틸리티
└── package.json            # 프로젝트 설정
```

## 환경 변수

| 변수명 | 설명 | 필수 여부 |
|--------|------|-----------|
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Google Maps API 키 | ✅ |

## 빌드 및 배포

### 프로덕션 빌드

```bash
npm run build
```

### 프로덕션 서버 실행

```bash
npm start
```

## 라이선스

MIT License

## 기여

이슈나 풀 리퀘스트를 환영합니다!

## 버전 히스토리

- **v0.2**: 실행 안정화 패치
  - "use client" 적용
  - react-simple-maps 동적 import로 초기 렌더 빈 화면 이슈 해결
  - crypto.randomUUID() → uid() 폴리필
  - 주소 입력 → Google Geocoding 으로 좌표 자동 채움
  - 지도 클릭 픽 모드

- **v0.1**: 초기 버전
  - 기본 프로젝트 관리 기능
  - 세계 지도 표시
  - 검색 및 필터링
