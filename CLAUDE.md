# zslab LMS — 작업 규칙

## 프로젝트 개요
- 학점은행제 + 자격증 듀얼 모드 LMS (LMS_MODE=both)
- 기술스택: Laravel + FrankenPHP / Next.js 15 / MariaDB / Redis / Elasticsearch / Socket.io / Docker
- 역할: 학습자 / 튜터 / 교수자 / 관리자
- 기존 컨테이너 재활용: zslab_mariadb / zslab_redis / zslab_elasticsearch / gateway_nginx
- 채팅: zslab-chat 범용 모듈 연동
- 결제: MVP stub (StubPaymentGateway) — 운영 시 실 PG 클래스로 교체

## 디렉토리
- /home/zslab-lms/ — 프로젝트 루트
- backend/ — Laravel
- frontend/ — Next.js
- node-realtime/ — LMS 전용 Socket.io
- zslab-chat/ — 1:1 문의 채팅 모듈
- docker-compose.lms.yml — LMS 전용 컨테이너

## 작업 방식
1. 작업 시작 전 PROGRESS.md에 STEP 항목 먼저 기록
2. 각 STEP 완료 직후 [x] 업데이트 (일괄 금지)
3. 에러 시 PROGRESS.md에 `❌ 에러: <내용>` 기록 후 중단·보고
4. 묻지 말고 스스로 판단 진행

## 코딩 원칙

### 1. 코딩 전에 생각하기
가정하지 말고, 혼란을 숨기지 말고, 트레이드오프를 표면화할 것.

구현 전:
- 가정이 있으면 명시. 불확실하면 묻기.
- 해석이 여러 개면 제시 — 조용히 선택하지 말 것.
- 더 단순한 방법이 있으면 말할 것. 필요하면 반박.

### 2. 단순함 우선
요청한 것만. 추측성 코드 금지.

- 요청하지 않은 기능 추가 금지.
- 단일 사용 코드에 추상화 금지.
- 요청하지 않은 유연성·설정 가능성 금지.
- 200줄로 쓰고 50줄로 가능하면 다시 쓸 것.

### 3. 최소 변경 원칙
꼭 필요한 것만 건드릴 것.

- 인접 코드·주석·포맷 개선 금지.
- 고장나지 않은 것 리팩토링 금지.
- 기존 스타일 유지 (다르게 하고 싶어도).
- 관련 없는 dead code 발견 시 삭제 말고 언급만.
- 변경된 모든 줄은 사용자 요청으로 직접 추적 가능해야 함.

### 4. 목표 기반 실행
성공 기준을 정의하고 검증될 때까지 루프.

멀티스텝 작업은 계획 먼저:

[작업] → 검증: [확인 방법]
[작업] → 검증: [확인 방법]


## 디자인 원칙
- 학습자: 차분·학술 톤 (Linear/Notion/Coursera)
- 관리자: 운영 도구 톤, 정보 밀도 우선 (Vercel Dashboard/Stripe)
- shadcn/ui + Pretendard + 다크모드 + 모바일 반응형
- 공통 컴포넌트(PageHeader/DataTable/FilterBar/StatusBadge/ConfirmDialog) 재사용 우선

## 환경 특이사항
- FrankenPHP: 코드 변경 후 `docker restart lms_php` 필요
- gateway nginx: `docker exec gateway_nginx nginx -s reload`
- 새 라우트: `docker exec lms_php php artisan route:clear`

## 테스트 계정 (비밀번호 모두 `password`)
- admin@zslab.test / professor@zslab.test / tutor@zslab.test / student@zslab.test

## 토큰 절약
- 프롬프트는 핵심만 간결하게.
- 쇼핑몰 참고는 명시된 경우에만.
