# 풀스택 서비스 보일러 플레이트

## 프로젝트 개요

이 보일러 플레이트는 풀스택 웹 애플리케이션 개발을 위한 기본 구조를 제공합니다. monorepo 구조로 클라이언트와 서버를 효율적으로 관리하며, 현대적인 웹 개발 기술 스택을 활용합니다.

## 서비스 소개: 수면 시간 트래킹 서비스

이 서비스는 현대인의 불규칙한 수면 패턴과 수면의 질 저하 문제를 해결하기 위해 개발된 간단한 모바일 웹 애플리케이션입니다. 사용자는 매일 자신의 수면 시간을 기록하고, 특이사항을 추가할 수 있으며, 기록된 데이터를 편리하게 조회, 수정 및 삭제할 수 있습니다.

### 주요 기능

- **수면 기록**: 매일의 수면 시간(시간)과 특이사항을 기록합니다.
- **기록 조회**: 기록된 모든 수면 내역을 리스트 형태로 한눈에 확인합니다.
- **기록 수정/삭제**: 기존에 기록된 수면 데이터를 업데이트하거나 더 이상 필요 없는 기록을 삭제할 수 있습니다.

## 기술 스택

### 공통

- 패키지 매니저: pnpm (workspace 기능 활용)
- 언어: TypeScript
- Node.js 버전: 22.x
- 테스트: Vitest
- 코드 품질: Prettier

### 클라이언트

- 프레임워크: React
- 빌드 도구: Vite
- 라우팅: React Router
- 스타일링: TailwindCSS

### 서버

- 프레임워크: Fastify
- 데이터베이스: SQLite with DirzzleORM

## 설치 및 실행

### 초기 설치

```bash
# 프로젝트 루트 디렉토리에서 실행
pnpm install
```

### 개발 서버 실행

```bash
# 클라이언트 및 서버 동시 실행
pnpm dev

# 클라이언트만 실행
pnpm dev:client

# 서버만 실행
pnpm dev:server
```

### 테스트 실행

```bash
# 클라이언트 테스트
pnpm test:client

# 서버 테스트
pnpm test:server

# 모든 테스트 실행
pnpm test
```

### 빌드

```bash
# 클라이언트 및 서버 빌드
pnpm build
```

## 환경 변수 설정

- 클라이언트: `client/.env` 파일에 설정 (예시는 `client/.env.example` 참조)
- 서버: `server/.env` 파일에 설정 (예시는 `server/.env.example` 참조)

## API 엔드포인트

서버는 다음과 같은 기본 API 엔드포인트를 제공합니다:

- `GET /api/health`: 서버 상태 확인
- `GET /api/users`: 유저 목록 조회
- `GET /api/users/:id`: 특정 유저 조회
- `POST /api/users`: 새 유저 추가
- `PUT /api/users/:id`: 유저 정보 수정
- `DELETE /api/users/:id`: 유저 삭제
- `GET /api/sleep`: 수면 기록 목록 조회
- `POST /api/sleep`: 새 수면 기록 추가
- `PUT /api/sleep/:id`: 수면 기록 수정
- `DELETE /api/sleep/:id`: 수면 기록 삭제

## Changelog

### v1.1.0 (2024-XX-XX)

- **New Feature: 수면 통계 기능 추가**
  - 사용자의 수면 데이터를 기반으로 한 통계 정보를 차트로 제공합니다.
  - 주간 수면 시간 변화를 보여주는 라인 차트와 일일 평균 수면 시간을 나타내는 바 차트가 포함됩니다.
  - 테스트를 위한 더미 데이터 생성 기능이 추가되었습니다.
- **API Endpoint 추가:**
  - `GET /api/sleep/stats`: 특정 유저의 수면 통계 데이터 조회
