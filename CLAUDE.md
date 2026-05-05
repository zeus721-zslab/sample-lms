# zslab LMS — 작업 규칙

## 결제 안내
- **결제는 MVP stub** — PG 없이 즉시 자동 승인 (StubPaymentGateway)
- 운영 시 `app/Services/Payment/StubPaymentGateway.php` → 실제 PG 클래스로 교체 후 AppServiceProvider 바인딩 변경

## 프로젝트 개요
- 학점은행제 + 자격증 듀얼 모드 LMS (LMS_MODE=both)
- 기술스택: Laravel + FrankenPHP / Next.js 15 / MariaDB / Redis / Elasticsearch / Socket.io / Docker
- 역할: 학습자 / 튜터 / 교수자 / 관리자
- 기존 컨테이너 재활용: zslab_mariadb / zslab_redis / zslab_elasticsearch / gateway_nginx
- 채팅: zslab-chat 범용 모듈 (https://github.com/zeus721-zslab/zslab-chat) 연동

## 디렉토리
- /home/zslab-lms/ — 프로젝트 루트
- backend/ — Laravel
- frontend/ — Next.js
- node-realtime/ — LMS 전용 Socket.io (진도 heartbeat 등)
- zslab-chat/ — 1:1 문의 채팅 모듈
- docker-compose.lms.yml — LMS 전용 컨테이너
- /home/zslab/ — 쇼핑몰 (Dockerfile·Caddyfile 패턴 참고용)

## 작업 방식 (고정)
1. 작업 시작 전 PROGRESS.md에 STEP 항목 먼저 기록
2. 각 STEP 완료 직후, 다음 도구 호출 이전에 [x] 업데이트 (나중에 일괄 금지)
3. 에러 시 PROGRESS.md에 `❌ 에러: <내용>` 기록 후 중단·보고
4. 묻지 말고 스스로 판단 진행

## 디자인 원칙 (모든 프론트 작업 공통)
- 학습자: 차분·학술 톤 (Linear/Notion/Coursera)
- 관리자: 운영 도구 톤, 정보 밀도 우선 (Linear/Vercel Dashboard/Stripe)
- shadcn/ui + Pretendard + 다크모드 + 모바일 반응형
- 공통 컴포넌트(PageHeader/DataTable/FilterBar/StatusBadge/ConfirmDialog) 재사용 우선

## 검증 기본 (별도 명시 안 해도 적용)
- 빌드 통과·컨테이너 로그 ERROR 없음
- 라이트/다크 모드 정상
- 모바일 반응형 정상
- 권한 가드 동작 (admin 전용 라우트는 student 토큰 → 403 또는 404)

## 환경 특이사항
- FrankenPHP 워커 모드: 코드 변경 후 `docker restart lms_php` 필요 (OPcache·워커 캐시)
- gateway nginx: 설정 변경 시 `docker exec gateway_nginx nginx -s reload`
- 새 라우트 추가 후 라우트 캐시: `docker exec lms_php php artisan route:clear`

## 테스트 계정
- admin@zslab.test / professor@zslab.test / tutor@zslab.test / student@zslab.test
- 비밀번호 모두 `password`

## 토큰 절약 (중요)
- 사용자 프롬프트는 핵심만 간결. 반복 설명·과도한 검증 불필요
- 쇼핑몰 참고는 명시된 경우에만 (대부분의 경우 LMS 단독 진행)
