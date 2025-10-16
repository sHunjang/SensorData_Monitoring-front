# 📊 IoT 에너지 모니터링 시스템 - 프론트엔드

React TypeScript 기반 실시간 센서 데이터 시각화 웹 대시보드

***

## 📋 프로젝트 개요

FastAPI 백엔드와 연동하여 전력량계, 온습도, 일사량 센서 데이터를 실시간으로 시각화하는 SPA(Single Page Application)입니다.

***

## 🛠 기술 스택

- **언어**: TypeScript 5.x
- **프레임워크**: React 18
- **빌드 도구**: Vite 5.x
- **차트**: Recharts 2.x
- **스타일링**: CSS Modules
- **라우팅**: React Router 6

***

## ✨ 주요 기능

- 실시간 데이터 모니터링 (자동 갱신)
- 대화형 라인 차트 (Recharts)
- 다중 시간 범위 지원 (1일/1주/1개월/1년)
- 줌 인/아웃 및 좌우 이동
- 커스텀 시간 범위 선택
- 통계 요약 (평균/최대/최소)
- CSV 데이터 다운로드

***

## 🚀 빠른 시작

### 1. 설치

```bash
# 저장소 클론
git clone https://github.com/your-username/energy-monitoring-frontend.git
cd energy-monitoring-frontend

# 의존성 설치
npm install
```

### 2. 환경 변수 설정

`.env` 파일 생성:

```bash
VITE_API_BASE=http://localhost:8000
```

### 3. 개발 서버 실행

```bash
npm run dev

# http://localhost:5173 접속
```

***

## 📱 화면 구성

### 홈 대시보드
- 전력량계, 환경센서, 일사량 센서 네비게이션

### 전력량계 페이지
- 디바이스 선택 (11~15번)
- 데이터 컬럼 선택 (유효전력/전압/전류/역률 등)
- 시간 범위 제어 (1일/1주/1개월/1년)
- 실시간 그래프 및 통계

***

## 📡 API 연동

### 백엔드 URL 설정

`src/lib/http.ts`:
```typescript
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
```

### 실시간 폴링

`src/containers/ModbusContainer.tsx`:
```typescript
// 1일 모드: 1분마다 자동 갱신
// 1주 모드: 15분마다 자동 갱신
```

***

## 📁 프로젝트 구조

```
frontend/
├── src/
│   ├── main.tsx              # React 진입점
│   ├── App.tsx               # 라우팅
│   ├── pages/                # 페이지 컴포넌트
│   ├── containers/           # 비즈니스 로직
│   ├── presenters/           # UI 컴포넌트
│   ├── components/           # 공통 컴포넌트
│   ├── api/                  # API 호출
│   ├── lib/                  # 유틸리티
│   └── hooks/                # 커스텀 훅
├── .env
├── package.json
└── README.md
```

***

## 🏗 빌드 및 배포

### 프로덕션 빌드

```bash
npm run build

# dist/ 폴더에 빌드 결과 생성
```

### 빌드 미리보기

```bash
npm run preview
```

### Nginx 배포 예시

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/frontend/dist;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:8000;
    }
}
```

***

## 🔧 주요 의존성

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.18.0",
  "recharts": "^2.10.0",
  "typescript": "^5.2.2",
  "vite": "^5.0.0"
}
```

***

## 🎨 커스터마이징

### 차트 색상 변경

`src/components/charts/LineChartWrapper.tsx`:
```tsx
<Line stroke="#8884d8" strokeWidth={2} />
```

### 폴링 간격 조정

`src/containers/ModbusContainer.tsx`:
```typescript
const ZOOMS = {
    0: { intervalMs: 60000 },  // 1분
    1: { intervalMs: 900000 }  // 15분
};
```

***

## 📝 라이센스

MIT License

***