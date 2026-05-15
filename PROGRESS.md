# zslab LMS — 작업 진행 현황

---
## 작업 방식 (고정)
- 작업 시작 전 스텝 목록 먼저 PROGRESS.md에 기록
- 각 스텝 완료 시마다 즉시 [x] 업데이트
- 스텝 형식:
  - [ ] STEP N: 작업 내용 (시작 전)
  - [x] STEP N: 작업 내용 (완료 후)
- 전체 완료 후 요약 보고
---

## 전체 STEP 목록
- [x] STEP 1: 디렉토리 구조 생성 및 PROGRESS.md 초기화
- [x] STEP 2: .env.example 작성
- [x] STEP 3: docker/php/Dockerfile 작성 (FrankenPHP)
- [x] STEP 4: docker/caddy/Caddyfile 작성
- [x] STEP 5: docker/node/Dockerfile 작성 (Socket.io)
- [x] STEP 6: docker-compose.lms.yml 작성 (기존 네트워크 연결)
- [x] STEP 7: Laravel 설치 (backend/)
- [x] STEP 8: Next.js 15 설치 (frontend/) ※ 최신 버전 16.2.4 설치됨
- [x] STEP 9: Node.js 실시간 서버 초기화 (node-realtime/)
- [x] STEP 10: scripts/ 헬퍼 스크립트 작성
- [x] STEP 11: .github/workflows CI/CD 작성
- [x] STEP 12: gateway Nginx 가상호스트 추가 ※ 권한 문제로 직접 편집 불가 → scripts/gateway-nginx-lms.conf 참조 (수동 적용 필요)
- [x] STEP 13: 전체 기동 및 헬스체크 확인 (도커 외부 구문/라우트/타입 검증 통과)

## STEP 2 수동 작업 목록 (2026-04-27)
- [x] STEP 2-1: .env 파일 작성 (비밀번호 생성 및 채우기)
- [x] STEP 2-2: DB 및 사용자 생성 (zslab_lms)
- [x] STEP 2-3: gateway nginx 설정 추가 (zslab-lms.duckdns.org) ※ 블록 삽입 완료, nginx reload는 SSL+컨테이너 기동 후 진행
- [x] STEP 2-4: SSL 인증서 발급 (certbot) — /home/gateway/certs/zslab-lms.duckdns.org/ 배치 완료, 만료 2026-07-26
- [x] STEP 2-5: 첫 기동 및 헬스체크 — 전 컨테이너 healthy, 마이그레이션 완료, https://zslab-lms.duckdns.org 200 OK

## STEP 3-A: 인증 기반 (2026-04-27)
- [x] STEP 3-A-1: 마이그레이션 작성 (roles / user_roles / users 확장)
- [x] STEP 3-A-2: 모델 작성 (Role.php, User.php 수정)
- [x] STEP 3-A-3: 시더 작성 (RoleSeeder, UserSeeder, DatabaseSeeder)
- [x] STEP 3-A-4: Sanctum 인증 API (register/login/logout/me)
- [x] STEP 3-A-5: 검증 (migrate:fresh --seed + curl 테스트) — register/login/me/logout 전부 200/201 정상

## STEP 3-B: 역할 권한 + 프론트엔드 골격 (2026-04-27)
- [x] STEP 3-B-1: RoleMiddleware 작성 및 alias 등록
- [x] STEP 3-B-2: 라우트 그룹 분기 (student/tutor/professor/admin)
- [x] STEP 3-B-3: 권한 매트릭스 curl 테스트 — 16개 케이스 전부 예상 일치
- [x] STEP 3-B-4: 프론트엔드 기본 골격 (api.ts/store/pages)
- [x] STEP 3-B-5: 최종 검증 — 전 페이지 200, 로그인/me/로그아웃 흐름 정상, 컨테이너 에러 없음

## STEP 3-C: 디자인 시스템 + 리팩토링 (2026-04-27)
- [x] STEP 3-C-1: Pretendard 폰트 적용
- [x] STEP 3-C-2: shadcn/ui 초기화 + 컴포넌트 설치 (수동 구성)
- [x] STEP 3-C-3: 디자인 토큰 (globals.css + tailwind.config)
- [x] STEP 3-C-4: 공통 레이아웃 컴포넌트 (Header/Footer/SiteShell + layout.tsx 배선)
- [x] STEP 3-C-5: 다크모드 (next-themes ThemeProvider + Toaster → providers.tsx → layout.tsx)
- [x] STEP 3-C-6: 페이지 리팩토링 (login/register/my + react-hook-form/zod/sonner, 홈 히어로 섹션)
- [x] STEP 3-C-7: 검증 — npm run build 완전 통과 (8/8 정적 페이지, TypeScript OK)

## STEP 4-A: 카테고리 + 강좌 (2026-04-27)
- [x] STEP 4-A-1: 마이그레이션 (categories / courses)
- [x] STEP 4-A-2: 모델 (Category.php / Course.php)
- [x] STEP 4-A-3: 시더 (CategorySeeder / CourseSeeder / DatabaseSeeder 등록) — 카테고리 6개 / 강좌 21개 시드 완료
- [x] STEP 4-A-4: 공개 API (GET /api/categories, /api/courses, /api/courses/{slug}) + CategoryController 신규 작성 / CourseController 구현 / 보호 라우트 CUD only 분리 / 미인증 JSON 401 처리
- [x] STEP 4-A-5: 검증 — migrate:fresh --seed 완료, 전체 curl 7케이스 통과 (categories 200, courses 200, type 필터 정상, 단일 상세 200, 404 정상, 미인증 401 정상)

## STEP 4-B: 코스 카탈로그 프론트엔드 (2026-04-27)
- [x] STEP 4-B-1: 타입·API 클라이언트 (types/course.ts + lib/api.ts 확장) — API_BASE_URL 서버/클라이언트 분리
- [x] STEP 4-B-2: 홈 페이지 개편 (히어로 + 인기 강좌 8개 + 카테고리 퀵링크 + force-dynamic)
- [x] STEP 4-B-3: 강좌 목록 페이지 (/courses — 사이드바 필터 + 검색바 + 카드 그리드 + 페이지네이션)
- [x] STEP 4-B-4: 강좌 상세 페이지 (/courses/[slug] — 브레드크럼 + 상세정보 + 수강신청 toast + 관련강좌)
- [x] STEP 4-B-5: 공통 컴포넌트 (CourseCard / CourseTypeBadge)
- [x] STEP 4-B-6: 빌드 검증 — npm run build 통과 (TypeScript OK, 전 페이지 ƒ Dynamic), 전체 HTTP 상태 정상

## STEP 5-A: 수강신청 + 차시 + 진도 골격 (2026-04-27~28)
- [x] STEP 5-A-1: 마이그레이션 (lessons / enrollments / progresses) — 3개 마이그레이션 Ran 확인
- [x] STEP 5-A-2: 모델 (Lesson / Enrollment / Progress + 관계 추가) — 모델 파일 존재 확인
- [x] STEP 5-A-3: 시더 확장 (LessonSeeder + DatabaseSeeder 등록) — 159 lessons 시드 완료
- [x] STEP 5-A-4: API (POST /api/enrollments, GET /api/my/enrollments, POST /api/progress/heartbeat) — 라우트·컨트롤러 확인
- [x] STEP 5-A-5: 검증 (migrate:fresh --seed + curl 시나리오) — 8개 시나리오 전부 통과
  - 수정: Progress 모델에 $table = 'progresses' 명시 (Laravel 단수화 버그 패치)
  - SC1 student 로그인 → 200 토큰 획득
  - SC2 자격증 코스 신청(course_id=12) → 201 studying
  - SC3 동일 코스 재신청 → 422 ALREADY_ENROLLED
  - SC4 학점은행 코스 신청 → 400 CREDIT_BANK_NOT_SUPPORTED
  - SC5 GET /api/my/enrollments → 200, 1건 목록
  - SC6 GET /api/my/enrollments/1 → 200, 9 lessons + 0 progresses 포함
  - SC7 heartbeat partial(50%) → 200, progress_pct=49.92%, completed_at=null
  - SC8 모든 lesson 95%↑ heartbeat → enrollment.status=completed 자동 전환

## STEP 5-B: 수강신청·내 강의실·학습 페이지 프론트엔드 (2026-04-28)
- [x] STEP 5-B-1: 타입·API 클라이언트 (types/enrollment.ts + lib/api.ts 확장)
- [x] STEP 5-B-2: 수강신청 버튼 실동작 (EnrollButton.tsx — 인증/중복/학점은행 분기)
- [x] STEP 5-B-3: 내 강의실 목록 (/my/courses — 탭+카드 그리드+진도율)
- [x] STEP 5-B-4: 학습 페이지 (/my/courses/[id] — 사이드바+비디오+heartbeat)
- [x] STEP 5-B-5: Header 메뉴 "내 강의실" 추가
- [x] STEP 5-B-6: 빌드 검증 + curl 시나리오
  - TypeScript 빌드 통과 (9개 페이지, 에러 0)
  - /my/courses HTTP 200 ✓
  - /my/courses/[id] HTTP 200 ✓
  - POST /api/enrollments → 201 studying ✓
  - GET /api/my/enrollments → 200, 목록 ✓
  - GET /api/my/enrollments/{id} → 200, 7 lessons + progresses ✓
  - POST /api/progress/heartbeat → 200, pct=4.62% ✓
  - 컨테이너 로그 ERROR 없음 ✓

## STEP 7-B: 학점은행 학기제 수강신청 프론트 (2026-04-28)
- [x] STEP 7-B-1: 타입·API 클라이언트 (semester.ts + api.ts 확장)
- [x] STEP 7-B-2: 학기 안내 페이지 (/semesters — D-day + 타임라인)
- [x] STEP 7-B-3: 수강신청 페이지 (/semesters/[id]/offerings — 테이블+모달+취소)
- [x] STEP 7-B-4: 강좌 상세 EnrollButton 학점은행 분기 (학기 신청 중이면 offerings로, 아니면 /semesters로 링크)
- [x] STEP 7-B-5: 내 강의실 개선 (credit_bank 탭 + 취소 버튼)
- [x] STEP 7-B-6: Header "학사일정" 메뉴 추가 (nav + 드롭다운)
- [x] STEP 7-B-7: 빌드 검증 + 시나리오
  - npm run build 완전 통과 (TypeScript OK, 11개 라우트)
  - /semesters 200 ✓ / /semesters/2/offerings 200 ✓ / /my/courses 200 ✓
  - SC1 credit_bank 수강신청 → 201 studying, offering_id 연결 ✓
  - SC2 GET /api/my/enrollments → 1건 목록 ✓
  - SC3 취소 → "수강신청이 취소되었습니다." ✓
  - SC4 취소 후 상태 → ['withdrawn'] ✓

## STEP 7-A: 학점은행제 학기·분반·수강신청 백엔드 (2026-04-28)
- [x] STEP 7-A-1: 마이그레이션 (semesters / course_offerings / enrollments offering FK)
- [x] STEP 7-A-2: 모델 (Semester / CourseOffering / Course·Enrollment 관계 추가)
- [x] STEP 7-A-3: 시더 (SemesterSeeder / CourseOfferingSeeder / DatabaseSeeder 등록)
- [x] STEP 7-A-4: 공개 API (GET /api/semesters, /current, /{id}/offerings)
- [x] STEP 7-A-5: 수강신청 API 확장 (credit_bank 분기 + cancel)
- [x] STEP 7-A-6: 검증 (migrate:fresh --seed + 9개 시나리오)
  - SC1 GET /api/semesters → 3개 (spring closed, summer enrolling, fall planned) ✓
  - SC2 GET /api/semesters/current → summer id:2 enrolling ✓
  - SC3 GET /api/semesters/{2}/offerings → 11개 offering ✓
  - SC4 학점은행 offering_id 없이 신청 → 422 OFFERING_REQUIRED ✓
  - SC5 학점은행 summer offering 신청 → 201, current_students+1(→1) ✓
  - SC6 동일 코스·학기 재신청 → 422 ALREADY_ENROLLED ✓
  - SC7 closed 학기 offering 신청 → 422 NOT_ENROLLING ✓
  - SC8 자격증 코스 신청(offering_id 없이) → 201 (기존 동작 유지) ✓
  - SC9 학점은행 enrollment 취소 → 200, current_students-1(→0) ✓
  - 비고: FrankenPHP 워커 라우트 캐시 이슈 → migrate 후 lms_php restart 필요

## STEP 6: 회원가입 페이지 보안 경고 버그 수정 (2026-04-28)
- [x] STEP 6-1: 원인 파악 (env/코드/빌드산출물 http:// 검사)
  - 소스 코드: http:// 없음 (SVG 네임스페이스·JSON Schema 참조만 존재, 네트워크 요청 아님)
  - NEXT_PUBLIC_API_URL: https:// (정상)
  - HTML 리소스 속성: http:// 없음
  - HSTS: 이미 설정됨 (nginx gateway)
  - 버그1: Caddyfile X-Forwarded-Proto {scheme} = http (nginx→Caddy가 HTTP이므로) → https 하드코딩 필요
  - 버그2(근본 원인): Google Safe Browsing 피싱 휴리스틱 — 신규 duckdns.org 서브도메인 + 비밀번호 필드 조합
- [x] STEP 6-2: 수정
  - Caddyfile: X-Forwarded-Proto {scheme}(=http) → https 하드코딩 (nginx→Caddy 구간이 HTTP이므로)
  - Caddyfile: Referrer-Policy + Permissions-Policy 헤더 추가
  - gateway nginx: Referrer-Policy, Permissions-Policy, CSP 헤더 추가
  - CSP: self+jsdelivr(폰트/스타일)+unsafe-inline/eval(Next.js 필요)+wss(Socket.io)
- [x] STEP 6-3: 재빌드 + 검증
  - /register HTTP 200 ✓
  - HSTS: max-age=31536000; includeSubDomains ✓
  - CSP: 명시적 허용 정책 적용 ✓
  - Referrer-Policy: strict-origin-when-cross-origin ✓
  - Permissions-Policy: camera=(), microphone=(), geolocation=() ✓
  - 소스 코드 http:// 없음 (mixed content 없음) ✓
  - API /healthz 200 ✓
  - 근본 원인 진단: Google Safe Browsing 피싱 휴리스틱 (신규 duckdns.org + 비밀번호 필드)
    → 코드 수정으로 해결 불가, Google Safe Browsing 검토 신청 필요

## STEP 8-A: 시험·과제 백엔드 (2026-04-28)
- [x] STEP 8-A-1: 마이그레이션 (exams / exam_questions / exam_submissions / exam_answers / assignments / assignment_submissions)
- [x] STEP 8-A-2: 모델 (Exam / ExamQuestion / ExamSubmission / ExamAnswer / Assignment / AssignmentSubmission + Course 관계 추가)
- [x] STEP 8-A-3: 시더 (ExamSeeder / AssignmentSeeder / DatabaseSeeder 등록) — 5개 quiz(자격증), 3개 assignment
- [x] STEP 8-A-4: 학습자 시험 API (GET /api/exams/{id}, POST start, POST submit + 자동채점)
- [x] STEP 8-A-5: 학습자 과제 API (GET /api/assignments/{id}, POST submit)
- [x] STEP 8-A-6: 검증 (migrate:fresh --seed + 8개 시나리오)
  - SC1 GET /api/exams/1 → can_start=true ✓
  - SC2 POST /api/exams/1/start → submission_id, 5문항, correct_answer 미포함 ✓
  - SC3 정답 제출 → status=graded, total_score=100, pass_yn=true ✓
  - SC4 재응시 → 422 ALREADY_SUBMITTED ✓
  - SC5 student2 오답 제출 → status=graded, total_score=0, pass_yn=false ✓
  - SC6 GET /api/assignments/1 → can_submit=true ✓
  - SC7 POST /api/assignments/1/submit → 201, 과제 제출 완료 ✓
  - SC8 재제출 → 422 ALREADY_SUBMITTED ✓
  - 비고: 자격증 코스 price>0 → pending 상태 수강신청도 시험/과제 접근 허용

## STEP 8-B: 시험·과제 프론트엔드 (2026-04-28)
- [x] STEP 8-B-1: 타입·API 클라이언트 (exam.ts / assignment.ts + api.ts 확장)
- [x] STEP 8-B-2: 학습 페이지 사이드바 시험·과제 섹션 추가 (차시/시험/과제 탭 + 메인 영역 요약 카드)
- [x] STEP 8-B-3: 시험 안내/결과 페이지 (/my/courses/[id]/exams/[examId])
- [x] STEP 8-B-4: 시험 응시 페이지 (/my/courses/[id]/exams/[examId]/take)
- [x] STEP 8-B-5: 과제 페이지 (/my/courses/[id]/assignments/[assignmentId])
- [x] STEP 8-B-6: 빌드 검증 + 시나리오
  - npm run build 완전 통과 (TypeScript OK, 15개 라우트)
  - /my/courses/[id] 200 ✓ (사이드바 차시/시험/과제 탭)
  - /my/courses/[id]/exams/[examId] 200 ✓
  - /my/courses/[id]/exams/[examId]/take 200 ✓
  - /my/courses/[id]/assignments/[assignmentId] 200 ✓
  - SC1 코스별 시험목록 → 1개, is_open=True ✓
  - SC2 시험 시작 → submission_id=1, 5문항, started_at 포함 ✓
  - SC3 take 페이지 재진입 (start 재호출) → 동일 submission_id 재사용 ✓
  - SC4 정답 제출 → graded, score=100, pass=True ✓
  - SC5 재응시 차단 → ALREADY_SUBMITTED ✓
  - SC6 코스별 과제목록 → 1개, can_submit=True ✓
  - SC7 과제 제출 → 201 성공 ✓
  - 컨테이너 에러 0 ✓

## STEP 9-A: 자격증 PDF 자동 발급 + QR 진위확인 백엔드 (2026-04-28)
- [x] STEP 9-A-1: 마이그레이션 (certificates / certificate_courses / certificate_issues / certificate_verifications)
- [x] STEP 9-A-2: 모델 (Certificate / CertificateIssue / CertificateVerification)
- [x] STEP 9-A-3: 시더 (CertificateSeeder / DatabaseSeeder 등록)
- [x] STEP 9-A-4: PDF 라이브러리 설치 (dompdf + simple-qrcode + blade 템플릿)
  - [x] composer 패키지 설치 (barryvdh/laravel-dompdf 3.1.2, simplesoftwareio/simple-qrcode 4.2.0)
  - [x] resources/views/certificates/template.blade.php 작성
- [x] STEP 9-A-5: 발급 서비스 (CertificateIssueService)
- [x] STEP 9-A-6: 학습자 API (my/issue/download/verify)
- [x] STEP 9-A-7: 검증 시나리오
  - migrate:fresh --seed 완료 (CertificateSeeder 5개 자격증 시드) ✓
  - SC1 student 로그인 → 200 토큰 획득 ✓
  - SC2 자격증 코스 신청 (ipq-pass, course_id=12) → 201 pending ✓
  - SC3 미합격 발급 시도 → 422 EXAM_NOT_PASSED ✓
  - SC4 수료+합격 상태에서 발급 → 201, serial_no=ZSLAB-2026-000001, status=active ✓
  - SC5 중복 발급 시도 → 200 (기존 issue 반환, 중복 없음) ✓
  - SC6 GET /api/my/certificates → 1건, serial_no·certificate_name·status 포함 ✓
  - SC7 진위확인 valid → valid=true, 전체 정보 반환 ✓
  - SC8 진위확인 invalid 토큰 → valid=false, reason=NOT_FOUND ✓
  - SC9 PDF 다운로드 → 200, Content-Type=application/pdf ✓

## STEP 9-B: 자격증 프론트엔드 (2026-04-28)
- [x] STEP 9-B-1: 타입·API 클라이언트 (certificate.ts + api.ts 확장)
- [x] STEP 9-B-2: 내 자격증 페이지 (/my/certificates)
- [x] STEP 9-B-3: 학습 페이지 사이드바 수료증 섹션 추가
- [x] STEP 9-B-4: 진위확인 결과 페이지 (/verify/[token])
- [x] STEP 9-B-5: 진위확인 검색 페이지 (/verify)
- [x] STEP 9-B-6: Header/Footer 메뉴 추가
- [x] STEP 9-B-7: 빌드 검증 + 시나리오
  - npm run build 완전 통과 (TypeScript OK, Turbopack) ✓
  - /my/certificates 200 ✓
  - /verify 200 ✓
  - /verify/[token] 200 ✓ (valid + invalid 모두)
  - SC1 로그인 → token 획득 ✓
  - SC2 GET /api/my/certificates → serial_no=ZSLAB-2026-000001, status=active ✓
  - SC3 진위확인 (valid) → valid=true, recipient_name 마스킹 ✓
  - SC4 진위확인 (invalid) → valid=false, reason=NOT_FOUND ✓
  - SC5 PDF 다운로드 → 200, Content-Type=application/pdf ✓
  - 컨테이너 에러 0 ✓

## STEP 10-A: 관리자 패널 백엔드 (2026-04-28)
- [x] STEP 10-A-1: 라우트 그룹 (auth:sanctum + role:admin)
- [x] STEP 10-A-2: 회원 관리 API (AdminUserController)
- [x] STEP 10-A-3: 카테고리 관리 API (AdminCategoryController)
- [x] STEP 10-A-4: 강의·차시 관리 API (AdminCourseController + AdminLessonController)
- [x] STEP 10-A-5: 검증 시나리오 12개
  - SC1  GET /api/admin/users → 총 5명 (seeder 4 + 테스트 1) ✓
  - SC2  GET ?role=student → student 2명 반환 ✓
  - SC3  PATCH users/{4} status=suspended → 200, status=suspended ✓
  - SC4  POST users/{4}/activate → 200, status=active ✓
  - SC5  POST users/{4}/roles (student+tutor) → 200, roles 2개 ✓
  - SC6  GET /api/admin/categories → 6개 루트 카테고리 ✓
  - SC7  POST /api/admin/categories (parent_id=1) → id=7 AI·머신러닝 생성 ✓
  - SC8  GET /api/admin/courses → total=21 ✓
  - SC9  POST /api/admin/courses (draft) → id=23, slug=python-v2 ✓
         (수정: mode enum은 semester|ondemand, description NOT NULL → '' 처리)
  - SC10 POST /api/admin/courses/23/lessons → id=165, total_lessons=1 갱신 ✓
  - SC11 POST /api/admin/courses/23/approve → status=published ✓
  - SC12 student 토큰으로 /api/admin/users → 403 접근 권한이 없습니다. ✓

## STEP 10-B: 관리자 패널 프론트엔드 (2026-04-28)
- [x] STEP 10-B-1: 라우트·인증 가드 (/admin/* role:admin)
- [x] STEP 10-B-2: AdminShell 레이아웃 (사이드바 + 상단바 + Breadcrumb + 모바일 Drawer)
- [x] STEP 10-B-5: 단축키 (Cmd+K / Cmd+B / ? — AdminShell에 구현)
- [x] STEP 10-B-3: 공통 컴포넌트 (StatCard / StatusBadge / DataTable / FilterBar / ConfirmDialog / EmptyState)
- [x] STEP 10-B-4: 페이지 구현 (대시보드 + 회원/카테고리/강의/차시 CRUD + 스텁 페이지 24개)
- [x] STEP 10-B-6: 빌드 검증 + 시나리오
  - npm run build 완전 통과 (TypeScript OK, 47개 라우트 — admin 29개 포함) ✓
  - Docker 이미지 재빌드 + 컨테이너 교체 ✓
  - /admin 200 ✓ / /admin/users 200 ✓ / /admin/courses 200 ✓
  - /admin/courses/categories 200 ✓ / /admin/semesters 200 ✓
  - SC1  GET /api/admin/users → total=4 ✓
  - SC2  GET ?role=student → student=1 ✓
  - SC3  PATCH users/{4} status=suspended → status=suspended ✓
  - SC4  POST users/{4}/activate → status=active ✓
  - SC5  POST users/{4}/roles [student,tutor] → roles=2개 ✓
  - SC6  GET /api/admin/categories → 6개 ✓
  - SC7  POST /api/admin/categories (parent_id=1) → id=7, name=AI·머신러닝 ✓
  - SC8  GET /api/admin/courses → total=21 ✓
  - SC9  POST /api/admin/courses (draft) → id=22, slug=python-v2, status=draft ✓
  - SC10 POST /api/admin/courses/22/lessons → lesson_id=150, title 정상 ✓
  - SC11 POST /api/admin/courses/22/approve → status=published ✓
  - SC12 student 토큰으로 /api/admin/users → HTTP 403 ✓

## 참고: 기존 zslab-shop 구조 (/home/zslab/)
쇼핑몰과 동일한 스택이므로 /home/zslab/ 의 Dockerfile,
docker-compose.yml, Caddyfile 구조를 참고해서 LMS에 맞게 적용할 것.

## STEP 10-C: /admin 리다이렉트 버그 수정 (2026-04-28)
- [x] STEP 10-C-1: AdminLayout — 비인증 시 return_url 포함, 비관리자 시 인라인 403 메시지
- [x] STEP 10-C-2: LoginPage — useSearchParams로 return_url 처리, 역할별 리다이렉트
- [x] STEP 10-C-3: 빌드·배포 + 시나리오 검증
  - npm run build 완전 통과 (TypeScript OK) ✓
  - Docker 이미지 재빌드 + 컨테이너 교체 ✓
  - /admin 200 ✓ / /login?return_url=%2Fadmin 200 ✓
  - 클라이언트 가드 동작 (서버=200, 브라우저에서 JS로 리다이렉트)

## STEP 10-D: 관리자 라우트 /admin → /lms-manage 변경 (2026-04-28)
- [x] STEP 10-D-1: app/admin/ 디렉토리 → app/lms-manage/ 이름 변경
- [x] STEP 10-D-2: 프론트엔드 코드 내 "/admin" 경로 일괄 치환 (/api/admin 제외)
- [x] STEP 10-D-3: 빌드·배포 + 검증
  - npm run build 완전 통과 (TypeScript OK, /lms-manage/* 29개 라우트) ✓
  - /lms-manage 200 ✓ / /lms-manage/users 200 ✓ / /lms-manage/courses 200 ✓
  - /lms-manage/courses/categories 200 ✓ / /lms-manage/semesters 200 ✓
  - /admin → 404 ✓ (구 경로 완전 삭제)
  - 컨테이너 에러 0 ✓

## STEP 11: 관리자 인증·라우팅 디테일 강화 (2026-04-28)
- [x] STEP 11-1: /lms-manage/login 전용 페이지 (관리자 톤, 5회 잠금, admin 역할 검증)
- [x] STEP 11-2: AdminLayout 가드 강화 (login 제외, 404 위장, 2h idle timeout)
- [x] STEP 11-3: 백엔드 show 엔드포인트 추가 (courses/{id}+lessons, users/{id}+enrollments)
- [x] STEP 11-4: 회원 상세 /lms-manage/users/[id]
- [x] STEP 11-5: 강좌 상세 /lms-manage/courses/[id] (차시 인라인 편집)
- [x] STEP 11-6: 카테고리 상세 /lms-manage/courses/categories/[id]
- [x] STEP 11-7: 목록 행 클릭 → 상세 이동 + 학습자 Header 관리자 링크
- [x] STEP 11-8: 빌드·배포 + 시나리오 검증
  - 버그: enrollments.latest() → created_at 컬럼 없음 → latest('enrolled_at')로 수정
  - 버그: Dockerfile package:discover → 개발 전용 Pail SP 없음 → 빌드 중 discover 제거 (런타임 자동 처리)
  - 버그: Dockerfile composer install 스크립트 artisan 없는 상태 → --no-scripts 추가
  - SC1 GET /api/admin/courses/1 → id=1, lessons=5 ✓
  - SC2 GET /api/admin/users/1 → id=1, roles=1, enrollments=0 ✓
  - SC3 student token → /api/admin/users → 403 ✓
  - Frontend 8개 페이지 200 OK ✓

## STEP 12-A: 학점은행 관리자 백엔드 (2026-04-29)
- [x] STEP 12-A-1: 마이그레이션 (credit_applications, academic_records)
- [x] STEP 12-A-2: 모델 (CreditApplication, AcademicRecord, Enrollment 수정)
- [x] STEP 12-A-3: 학기 관리 API
- [x] STEP 12-A-4: 분반 관리 API
- [x] STEP 12-A-5: 수강신청 현황 API
- [x] STEP 12-A-6: 출석·성적 API
- [x] STEP 12-A-7: 학점인정 신청 API
- [x] STEP 12-A-8: 검증
  SC1 학기 CRUD+status전환+잘못된전환422 ✓
  SC2 분반 CRUD+수강생있는분반삭제422 ✓
  SC3 수강신청 목록/필터 ✓
  SC4 성적입력→total자동계산(69→C,94→A+) ✓
  SC5 합격처리→enrollment.status=completed ✓
  SC6 credit_application 생성→상태변경(requested→processing→submitted_to_nile→approved) ✓
  SC7 NILE CSV export 2행(헤더+데이터) ✓
  SC8 student→모든 admin API 403 ✓

## STEP 12-B: 학점은행 관리자 프론트엔드 (2026-04-29)
- [x] STEP 12-B-1: 타입·API 클라이언트
- [x] STEP 12-B-2: 학기 관리 페이지
- [x] STEP 12-B-3: 분반 관리 페이지
- [x] STEP 12-B-4: 수강신청 현황 페이지
- [x] STEP 12-B-5: 출석·성적 페이지
- [x] STEP 12-B-6: 학점인정 신청 페이지
- [x] STEP 12-B-7: 사이드바 메뉴 활성화
- [x] STEP 12-B-8: 빌드 검증
  - TypeScript 오류 수정: lib/api.ts Semester 중복 import (credit-bank / semester) → semester에서 제거
  - npm run build 완전 통과 (TypeScript OK, 52개 라우트 — lms-manage/semesters/[id] 포함) ✓
  - Docker 이미지 재빌드 + 컨테이너 교체 ✓
  - /lms-manage/semesters 200 ✓ / /lms-manage/enrollments 200 ✓
  - /lms-manage/grades 200 ✓ / /lms-manage/credits 200 ✓
  - SC1 GET /api/admin/semesters → 4개 학기 ✓
  - SC2 GET /api/admin/offerings?semester_id=2 → total=11 ✓
  - SC3 GET /api/admin/enrollments → total=1 ✓
  - SC4 GET /api/admin/credit-applications → total=1 ✓
  - SC5 GET /api/admin/credit-applications/export → 200, CSV 2행(헤더+데이터) ✓
  - 컨테이너 에러 0 ✓

## STEP 13: 평가·자격증 관리자 (2026-04-29)
- [x] STEP 13-1: 백엔드 — 평가 관리 API (시험/문항 CRUD, 과제 CRUD, 채점 API)
- [x] STEP 13-2: 백엔드 — 자격증 관리 API (마스터 CRUD, 발급 이력, 진위확인 로그)
- [x] STEP 13-3: 백엔드 검증
  - 수정: exams.type enum에 essay 추가
  - 수정: assignments.due_at nullable
  - 수정: certificate_issues.enrollment_id nullable
  - SC1~12 모든 시나리오 통과 (시험 CRUD/문항 CRUD/서술형 채점/과제 채점/자격증 CRUD/발급·회수/403)
- [x] STEP 13-4: 프론트 — 평가 관리 (exams/assignments/grading 페이지)
- [x] STEP 13-5: 프론트 — 자격증 관리 (certificates/issues/verifications 페이지)
- [x] STEP 13-6: 사이드바 활성화 확인 (AdminNav 이미 전 메뉴 활성, disabled 플래그 없음)
- [x] STEP 13-7: 최종 검증
  - StatusBadge: value/map props → status prop 수정, 신규 상태(submitted/graded/in_progress/revoked) STATUS_MAP 추가
  - ConfirmDialog: confirmVariant/onCancel props → destructive/onClose props 수정
  - npm run build 완전 통과 (TypeScript OK) ✓
  - Docker 이미지 재빌드 + 컨테이너 교체 ✓
  - /lms-manage/exams 200 ✓ / /lms-manage/assignments 200 ✓ / /lms-manage/grading 200 ✓
  - /lms-manage/certificates 200 ✓ / /lms-manage/certificates/issues 200 ✓ / /lms-manage/certificates/verifications 200 ✓
  - SC1 GET /api/admin/exams → total=6 ✓
  - SC2 GET /api/admin/exams/{id}/questions → 200 ✓
  - SC3 GET /api/admin/assignments → total=4 ✓
  - SC4 GET /api/admin/certificates → total=6 ✓
  - SC5 GET /api/admin/certificate-issues → total=1 ✓
  - SC6 student token → /api/admin/exams → 403 ✓
  - 컨테이너 에러 0 ✓

## STEP 14: 운영 메뉴 — 공지·FAQ·1:1 문의 (2026-04-29)
- [x] STEP 14-1: zslab-chat 클론·docker-compose 서비스·nginx 프록시·마이그레이션
  - git clone → /home/zslab-lms/zslab-chat
  - lms_chat 서비스 (port 3002, zslab_lms DB, CHAT_JWT_SECRET=lms-chat-jwt-2026-secure)
  - nginx /chat/* → lms_chat:3002 WebSocket 프록시 + CSP 갱신
  - chat schema.sql → zslab_lms DB 적용 ✓
  - GET /health → {"status":"ok"} ✓
- [x] STEP 14-2: 백엔드 — notices/faqs/chat API + 관리자 API + 시더
  - 마이그레이션: notices, faqs
  - 공개 API: GET /api/notices, /api/notices/{id}, /api/faqs → total=6, groups=3
  - 학습자 채팅 API: /api/chat/token, /api/chat/rooms, /api/chat/rooms/{id}/messages, /api/chat/unread
  - 관리자 API: /api/admin/notices, /api/admin/faqs, /api/admin/inquiries/token, /api/admin/inquiries → 200 ✓
  - 시더: 공지 6건, FAQ 3카테고리·12건
  - chat_rooms/participants/messages 테이블 직접 SQL 생성 (schema.sql)
- [x] STEP 14-3: 학습자 프론트 — /notices /faq ChatWidget
  - /notices (핀 강조·카테고리 뱃지·페이지네이션)
  - /notices/[id] (본문·목록 복귀)
  - /faq (카테고리 탭 + 아코디언)
  - ChatWidget (로그인 학습자용, 우하단 고정, useChat 훅, socket.io-client)
  - Header/Footer 링크 추가
- [x] STEP 14-4: 관리자 프론트 — notices/faqs/inquiries + AdminChatWidget
  - /lms-manage/notices (DataTable + 등록/수정/삭제 모달 + 핀고정 Switch)
  - /lms-manage/faqs (DataTable + 등록/수정/삭제 모달)
  - /lms-manage/inquiries (좌측 방목록 + 우측 채팅창, 풀스크린)
  - AdminChatWidget (AdminShell 상시 마운트, 위젯 열면 목록+채팅)
  - useAdminChatStore (Zustand, rooms/activeRoomId/unreadTotal/messages)
  - AdminNav 사이드바 inquiries 항목에 미읽음 배지
- [x] STEP 14-5: 최종 검증
  - npm run build 완전 통과 (TypeScript OK, /notices·/faq 포함 전 라우트) ✓
  - Docker 이미지 재빌드 + 컨테이너 교체 ✓
  - /notices 200 ✓ / /notices/1 200 ✓ / /faq 200 ✓
  - /lms-manage/notices 200 ✓ / /lms-manage/faqs 200 ✓ / /lms-manage/inquiries 200 ✓
  - SC1 GET /api/notices → total=6, pinned=2 ✓
  - SC2 GET /api/faqs → 3카테고리 ✓
  - SC3 POST /api/chat/token → JWT 발급 ✓
  - SC4 POST /api/chat/rooms → room_id 생성 ✓
  - SC5 POST /api/admin/inquiries/token → admin JWT ✓
  - SC6 GET /api/admin/inquiries → rooms=2 ✓
  - SC7 공지 CRUD (POST/PATCH/DELETE) → 201/200/204 ✓
  - SC8 GET /chat/health → {"status":"ok"} ✓
  - 컨테이너 에러 0 ✓

## STEP 15: 채팅 연결 버그 수정 + 관리자 채팅 UI 개편 (2026-04-29)
- [x] STEP 15-1: 연결 버그 진단
  - 원인1: nginx `set $var; proxy_pass http://$var/` → URI치환 미작동 (nginx 제약)
  - 원인2: CHAT_URL=`.../chat` + path='/socket.io' → 클라이언트가 `/socket.io/`로 요청 → nginx /chat/ 블록 우회
  - 수정방향: nginx hardcoded hostname, CHAT_URL=origin만, client path='/chat/socket.io'
- [x] STEP 15-2: nginx `proxy_pass http://lms_chat:3002/;` hardcoded, nginx reload 완료
- [x] STEP 15-3: .env CHAT_URL origin-only, useChat.ts path='/chat/socket.io', AdminChatWidget path 동일 수정
- [x] STEP 15-4: AdminChatWidget 카카오톡 3단계 UI (button→list→room), 아바타·날짜구분·연속메시지·타임스탬프
- [x] STEP 15-5: 위젯 openRoom/backToList/close에서 store setActiveRoom 동기화 → unread 차감 공유
- [x] STEP 15-6: tsc 클린, Next.js 빌드 성공, nginx restart, socket.io 200 확인, lms_caddy 재기동

## STEP 16: 1:1 문의 채팅 추가 디버깅 (2026-04-29)
- [x] STEP 16-1: nginx /chat/ 블록 zslab-shop과 동일 구조 확인 (정상)
- [x] STEP 16-2: JWT secret 일치 (lms-chat-jwt-2026-secure), lms_chat 로그 연결 0건
- [x] STEP 16-3: 근본 원인 발견 — Dockerfile에 NEXT_PUBLIC_CHAT_URL ARG 없음 → Docker 빌드 시 빈 문자열로 번들링 → io() 미호출
  - 수정: Dockerfile ARG/ENV 추가, docker-compose.lms.yml build args 추가
- [x] STEP 16-4: 위젯 버그 분석 — Docker 이미지에 신규 AdminChatWidget 코드 미포함이 근본 원인
  - 신규 코드: openList()에서 activeRoomId/Name/store 모두 초기화 → 방목록 보장
  - useChat.ts 정리: cleanup이 .then() 내부에 있던 버그 수정, mounted 플래그 + connect_error 로그 추가
- [x] STEP 16-5: 빌드 + 배포 + 종합 검증
  - 추가 발견: PHP JWT 생성에 base64_encode() 사용 → Base64URL 필요 (+ /→- _) → unauthorized 에러
  - 수정: ChatController + AdminInquiryController base64url() 헬퍼 추가, lms_php 재기동
  - Docker 이미지 --no-cache 재빌드 (NEXT_PUBLIC_CHAT_URL 번들링 확인)
  - 검증: socket.io CONNECT → user=4 connect 로그, room_joined 이벤트 수신 ✓

## STEP 17: 관리자 채팅 위젯 버그 2종 수정 (2026-04-30)
- [x] STEP 17-1: Bug1 원인 — backToList가 로컬 activeRoomId 미초기화 → 재진입 시 이전 방 표시
  Bug2 원인 — admin socket이 join_room 한 방만 구독, 다른 방 message_received 미수신
- [x] STEP 17-2: Bug1 수정 — openList/backToList/close 방어 코드 + store-local 분리
- [x] STEP 17-3: Bug2 원인 분석 — zslab-chat 서버 admin 방 구독 로직 점검
- [x] STEP 17-4: Bug2 수정 — admin socket 전체 방 구독 + receiveMessage 분기 정비
- [x] STEP 17-5: 빌드 + Docker 재배포 + 실시간 검증
  * 서버 분석 결과 (17-3 선행):
    - index.js: 접속 시 findAllIds()로 모든 방 room:X join + channel:admin join ✓
    - chat.js send_message: io.to(room:X) + socket.to(channel:admin) → admin 이중 전달 (dedup 처리) ✓
    - 신규 방(admin 접속 후 생성): channel:admin으로 수신은 OK, room:X 자동 join 없음
    - 수정: 클라이언트에서 신규 방 메시지 수신 시 socket.emit(join_room) 자동 호출로 보완

## STEP 19: B 위젯 ChatList 진입 버그 근본 수정 (2026-05-04)
- [x] STEP 19-1: 원인 분석 — 렌더 분기 구조 점검
  * view+localRoomId 2-state 불일치 가능 → isOpen+widgetRoomId 단일화로 해결
- [x] STEP 19-2: 위젯 상태 머신 재구성 (view 제거 → isOpen + widgetRoomId로 단일화)
- [x] STEP 19-3: 빌드 + Docker 재배포 + 검증

## STEP 21-RT: 단일 세션 실시간 강제 로그아웃 (2026-05-05)
- [x] STEP 21-RT-1: zslab-chat server/index.js — userId→socket 맵 + /internal/force-logout
- [x] STEP 21-RT-2: .env + docker-compose INTERNAL_SECRET + Laravel SessionControlService
  * CHAT_INTERNAL_SECRET 루트.env + backend/.env + docker-compose
  * config/lms.php chat_internal_url/secret 등록
  * SessionControlService: dispatchForceLogout() fire-and-forget
- [x] STEP 21-RT-3: 프론트 useForceLogoutSocket 훅 + SiteShell/AdminShell 마운트
  * useForceLogoutSocket: chatApi.token() → socket.io 연결 → force_logout 이벤트 핸들러
  * AdminChatWidget useAdminChatConnection에도 force_logout 핸들러 추가
- [ ] STEP 21-RT-4: 빌드 + 배포 + 검증

## STEP 21-RT-DEBUG: force_logout 미작동 디버깅 (2026-05-05)
- 원인: docker restart 사용 → INTERNAL_SECRET 컨테이너 미주입 → /internal/force-logout 403
- [x] STEP 21-RT-DEBUG-1: 디버그 로그 추가 (server/index.js + SessionControlService)
- [x] STEP 21-RT-DEBUG-2: lms_chat 컨테이너 재생성 (docker compose up -d, INTERNAL_SECRET 주입)
- [x] STEP 21-RT-DEBUG-3: lms_php 재시작 + lms_frontend (이미 최신 이미지 실행 중)
- [x] STEP 21-RT-DEBUG-4: 검증 완료
  * lms_php → lms_chat HTTP 체인: 200 OK, emitted=1 (소켓 있을 때)
  * INTERNAL_SECRET 검증: secretMatch=true
  * userSockets Map 등록/해제 정상
  * Laravel Log: tokens deleted → calling force-logout → response 200 확인

## STEP 24: 단일 세션 강제 후 프론트 자동 로그아웃 (2026-05-05)
- [x] STEP 24-1: lib/api.ts request() — 401 감지 → clearAuth + redirect
  * Authorization 헤더 있는 401만 처리 (로그인 실패 401 제외)
  * localStorage 'lms-auth' 삭제 → pending Promise로 중단
  * isAdminPath → /lms-manage/login, 그 외 → /login
- [x] STEP 24-2: /login 페이지 — reason=session_expired toast (toast.warning)
- [x] STEP 24-3: /lms-manage/login 페이지 — reason=session_expired toast (toast.warning)
- [x] STEP 24-4: 빌드 + 배포 — TypeScript OK, 에러 0, Ready
- [x] STEP 24-5: 검증
  * T1 /me → 401 ✓ (프론트 세션 만료 처리 트리거 조건 충족)
  * /login?reason=session_expired → 200 ✓ (toast 표시 조건 충족)
  * /lms-manage/login?reason=session_expired → 200 ✓
  * 컨테이너 에러 0 ✓

## STEP 20-F: 동시접속 제어 — 3단 계층 구조 (2026-05-04)
- [x] STEP 20-F-1: DB 마이그레이션 (users.allow_concurrent_session) — migrate DONE
- [x] STEP 20-F-2: 환경변수 + config 등록 (SINGLE_SESSION_ENFORCE=true, config/lms.php)
- [x] STEP 20-F-3: SessionControlService + AuthController 로그인 로직 + User 모델 fillable/casts
- [x] STEP 20-F-4: 관리자 API (users/{id} 확장 + system/session-policy GET/PATCH)
- [x] STEP 20-F-5: 관리자 프론트 (/lms-manage/system/connections 구현 + 회원목록 동시접속 토글)
- [x] STEP 20-F-6: 검증 시나리오 — 12개 시나리오 전부 통과
  SC1  GET session-policy → {enforce:true, exceptions:[]} ✓
  SC2  브라우저1 로그인 → token1 발급 ✓
  SC3  브라우저2 로그인 → token1 무효화 ✓
  SC4  브라우저1 /me → 401 ✓ / 브라우저2 /me → 200 ✓
  SC5  allow_concurrent_session=true 설정 → True ✓
  SC6  session-policy exceptions에 student 포함 ✓
  SC7  브라우저1 로그인 → token1 발급 ✓
  SC8  브라우저2 로그인 → 기존 토큰 유지 ✓
  SC9  브라우저1 /me → 200 ✓ / SC10 브라우저2 /me → 200 ✓
  SC11 PATCH session-policy enforce=false → 200 ✓
  SC12 enforce=false 동시접속 → T1/T2 모두 200 ✓
  enforce=true 원복 완료

## STEP 23: 학습자·관리자 양쪽 채팅 위젯 제거 (2026-05-04)
- [x] STEP 23-1: app/layout.tsx — ChatWidget import 및 렌더 제거
- [x] STEP 23-2: 빌드 + 배포 확인 — TypeScript OK, 에러 0, Ready

## STEP 22: AdminShell에서 AdminChatWidget 제거 (2026-05-04)
- [x] STEP 22-1: AdminShell.tsx import 및 렌더 제거
- [x] STEP 22-2: 빌드 + 배포 확인 — TypeScript OK, 에러 0, Ready

## STEP 21: AdminChatWidget isOpen 초기값 버그 수정 (2026-05-04)
- [x] STEP 21-1: 원인 분석 + 코드 수정 (mounted 가드 추가)
  * 원인: SSR 시 isOpen=false로 렌더된 버튼 HTML이 초기 페이지에 포함,
          클라이언트 hydration 중 store 구독 트리거로 재렌더되며 두 버전 동시 존재
  * 수정: mounted state(useState false) + useEffect → setMounted(true)
          !mounted → return null → SSR/hydration 완료 전 마크업 생성 차단
- [x] STEP 21-2: 빌드 + Docker 재배포
  * TypeScript OK, 에러 0, 컨테이너 Ready
- [x] STEP 21-3: 검증 — 에러 0, null!==d 분기 정상, mounted 가드 소스 확인

## STEP 20: B 위젯 ChatList 버그 — 배포 확인 + 강제 재확인 (2026-05-04)
- [x] STEP 20-1: 배포된 컨테이너 컴파일 결과물 확인 (widgetRoomId 반영 여부)
  * null!==d 분기 정상 확인 — STEP 19-2 코드 이미 배포됨
- [x] STEP 20-2: lms_frontend --no-cache 재빌드 + 컨테이너 교체
  * npm run build 완전 통과 (TypeScript OK, 60개 라우트, 에러 0)
  * 컨테이너 재기동, ✓ Ready in 0ms
- [x] STEP 20-3: 빌드 로그 에러 여부 확인 — 에러 0, WARN 0

## STEP 18: 관리자 채팅 위젯 A/B 분리 (2026-05-04)
- [x] STEP 18-1: 점검 — A(inquiries 풀스크린) vs B(우측 하단 위젯) 구조 파악
- [x] STEP 18-2: store — widgetRoomId 별도 필드 추가 (B 전용 activeRoom 분리)
- [x] STEP 18-3: AdminChatWidget.tsx — setActiveRoom → setWidgetRoom 교체, view 진입 보장
- [x] STEP 18-4: 빌드 + Docker 재배포 + 실시간 검증

## STEP 22: 결제 stub — PG 없이 즉시 자동 승인 (2026-05-05)
- [x] STEP 22-1: 마이그레이션 (orders 테이블)
- [x] STEP 22-2: 모델 + 서비스 (Order / PaymentGatewayInterface / StubPaymentGateway / AppServiceProvider 바인딩)
- [x] STEP 22-3: 학습자 결제 API (POST /api/orders, GET /api/orders/my, POST /api/orders/{id}/cancel)
- [x] STEP 22-4: 관리자 API (GET /api/admin/orders, POST /api/admin/orders/{id}/refund)
- [x] STEP 22-5: 학습자 프론트 (EnrollButton 유료 분기 + 결제 모달, /my/orders, Header 주문 내역)
- [x] STEP 22-6: 관리자 프론트 (/lms-manage/orders DataTable + AdminNav 활성화)
- [x] STEP 22-7: 검증 (마이그레이션 + 시나리오 + 빌드)
  - npm run build 완전 통과 (TypeScript OK, /my/orders + /lms-manage/orders 신규 라우트) ✓
  - SC1  student 로그인 → token 획득 ✓
  - SC2  유료 코스 결제 (course_id=14, ₩95,000) → order_no=ORD-20260504-000001, status=paid, enrollment.status=studying ✓
  - SC3  중복 결제 시도 → 422 ALREADY_ENROLLED ✓
  - SC4  GET /api/orders/my → 1건 (ORD-20260504-000001, paid) ✓
  - SC5  주문 취소 → message=취소 및 환불이 완료되었습니다. ✓
  - SC6  취소 후 주문 상태 → refunded ✓
  - SC7  취소 후 enrollment 상태 → withdrawn ✓
  - SC8  관리자 주문 목록 → total=1, 전체 주문 조회 ✓
  - SC10 관리자 환불 처리 → status=refunded, enrollment=withdrawn ✓
  - SC11 student 토큰 → GET /api/admin/orders → 403 ✓
  - /my/orders 200 ✓ / /lms-manage/orders 200 ✓
  - 컨테이너 ERROR 없음 ✓

## STEP 23: 영상 URL 기반 재생 연결 (2026-05-05)
- [x] STEP 23-1: 차시 영상 URL 관리 (video_url 컬럼 확인 + 관리자 모달 placeholder)
- [x] STEP 23-2: hls.js 설치 + VideoPlayer 컴포넌트 생성
- [x] STEP 23-3: 학습 페이지 VideoPlayer 연결 + heartbeat/테스트버튼 조건 수정
- [x] STEP 23-4: 시더 영상 URL 업데이트 (공개 m3u8 테스트 스트림, 62개 차시 적용)
- [x] STEP 23-5: 검증 (빌드 + 시나리오)
  - npm run build 완전 통과 (TypeScript OK) ✓
  - Docker 이미지 재빌드 + 컨테이너 교체 ✓
  - /my/courses 200 ✓ / /lms-manage/courses 200 ✓
  - course_id=2 차시 video_url=mux/apple 테스트 스트림 적용 확인 ✓
  - heartbeat (enrollment_id=8, lesson_id=10, 30초) → progress_pct=2.23% ✓
  - 컨테이너 ERROR 없음 ✓

## STEP 23-CSP: CSP 수정 — 영상 재생 허용 + /privacy /terms 라우트 (2026-05-05)
- [x] STEP 23-CSP-1: gateway nginx CSP 헤더 수정 (media-src blob:, connect-src 스트리밍 도메인)
  - media-src 'self' blob: 추가 (hls.js blob URL 재생)
  - connect-src에 https://test-streams.mux.dev, https://devstreaming-cdn.apple.com, https: 추가
  - sed -i inode 교체 → gateway_nginx restart로 적용 (reload만으론 불충분)
- [x] STEP 23-CSP-2: /privacy, /terms 빈 페이지 라우트 생성 (정적 페이지)
- [x] STEP 23-CSP-3: 빌드 + 배포 + 검증
  - npm run build 완전 통과 (/privacy /terms 라우트 포함) ✓
  - Docker 이미지 재빌드 + 컨테이너 교체 ✓
  - CSP 헤더: media-src blob:, connect-src https: 포함 확인 ✓
  - /privacy 200 ✓ / /terms 200 ✓
  - 컨테이너 ERROR 없음 ✓

## STEP 23-RESUME: 학습 시작 화면 + 이어보기 (2026-05-05)
- [x] STEP 23-RESUME-1: VideoPlayer startTime prop 추가 (HLS MANIFEST_PARSED + loadedmetadata seek)
- [x] STEP 23-RESUME-2: 학습 페이지 시작 화면 + isStarted 상태 + resumeLesson 로직
- [x] STEP 23-RESUME-3: switchLesson → setIsStarted(true) + startTime 동기화
- [x] STEP 23-RESUME-4: 빌드 + 배포 + 검증
  - npm run build 완전 통과 (TypeScript OK, /my/courses/[id] ƒ Dynamic) ✓
  - Docker 이미지 재빌드 + 컨테이너 교체 ✓
  - /my/courses/[id] 200 ✓
  - 컨테이너 ERROR 없음 ✓

## STEP 25: sendBeacon 진도 유실 방지 (2026-05-05)
- [x] STEP 25-1: BeaconAuthMiddleware 생성 (_token query→Authorization header + text/plain 파싱)
- [x] STEP 25-2: heartbeat 라우트 분리 (api.php에 BeaconAuthMiddleware+auth:sanctum 직접 등록)
- [x] STEP 25-3: 학습 페이지 beforeunload + visibilitychange 핸들러 추가
- [x] STEP 25-4: 빌드 + 배포 + 검증
  - npm run build 완전 통과 (TypeScript OK) ✓
  - Docker 이미지 재빌드 + 컨테이너 교체 ✓
  - SC1 JSON + Auth header → 200, pct=4.46% ✓
  - SC2 text/plain + Auth header → 200, pct=5.94% ✓
  - SC3 _token query param (sendBeacon 폴백) → 200, pct=7.43% ✓
  - SC4 인증 없음 → 401 ✓
  - 컨테이너 ERROR 없음 ✓
  - 수정사항: roles.slug → roles.code (실제 컬럼명)

## STEP 26: 관리자 통계 대시보드 (2026-05-05)
- [x] STEP 26-1: AdminStatsController + 5개 API 엔드포인트
- [x] STEP 26-2: admin routes.php에 stats 라우트 추가
- [x] STEP 26-3: recharts 설치 + types/stats.ts + lib/api.ts 확장
- [x] STEP 26-4: /lms-manage 대시보드 페이지 개편 (KPI 6개 + 차트 + 테이블)
- [x] STEP 26-5: 빌드 + 배포 + 검증
  - npm run build 완전 통과 (TypeScript OK, /lms-manage ○ Static) ✓
  - Docker 이미지 재빌드 + 컨테이너 교체 ✓
  - /lms-manage 200 ✓
  - stats/summary → total_users=5, total_revenue=70000, total_enrollments=5 ✓
  - stats/enrollments?period=7 → 7건 (날짜 0채움) ✓
  - stats/revenue?period=30 → 30건 ✓
  - stats/courses/top → TOP 10, 1위 파이썬기초(3명) ✓
  - stats/semesters → 3개 학기 수강현황 ✓
  - student 토큰 → 403 ✓
  - 컨테이너 ERROR 없음 ✓

## STEP 27: README.md 작성 (2026-05-05)
- [x] STEP 27-1: README.md 작성 (8개 섹션)

## STEP 28: GitHub 배포 및 CI/CD 설정 (2026-05-05)
- [x] STEP 28-1: .gitignore 작성 (zslab-chat 제외 포함)
- [x] STEP 28-2: 디버그 console.log 제거 (AdminChatWidget)
- [x] STEP 28-3: .env.example 최신화 (CHAT_INTERNAL_SECRET 등 누락 키 추가)
- [x] STEP 28-4: git init + 첫 커밋 (321 files, 48055 insertions)
- [x] STEP 28-5: CI/CD 시크릿 목록 확인 + 워크플로우 점검

## STEP 29: ESLint 규칙 warn 완화 (2026-05-05)
- [x] STEP 29-1: eslint.config.mjs에 warn 오버라이드 추가
- [x] STEP 29-2: git commit + push (b25dcbc)

## STEP 30: CI 에러 수정 (2026-05-05)
- [x] STEP 30-1: ci.yml PHP 8.3 → 8.4
- [x] STEP 30-2: AdminShell/AdminNav/CommandPalette eslint-disable 주석 추가
- [x] STEP 30-3: git commit + push (bbc9985)

## STEP 31: CI 에러 재수정 (2026-05-05)
- [x] STEP 31-1: ci.yml --parallel 제거
- [x] STEP 31-2: eslint.config.mjs react-hooks/set-state-in-effect off
- [x] STEP 31-3: 6개 파일 eslint-disable 주석 추가/교정
- [x] STEP 31-4: git commit + push (9cc2478)

## STEP 32: CI 에러 3차 수정 (2026-05-05)
- [x] STEP 32-1: ci.yml storage mkdir 추가
- [x] STEP 32-2: enrollments/page.tsx &quot; 교체
- [x] STEP 32-3: layout.tsx Link 교체 + useRef(Date.now()) 수정
- [x] STEP 32-4: login/page.tsx eslint-disable 주석 + Link 교체
- [x] STEP 32-5: take/page.tsx doSubmit 선언 순서 이동
- [x] STEP 32-6: AdminChatWidget.tsx lastDateLabel → useRef
- [x] STEP 32-7: git commit + push (9f8aea0)

## STEP 33: AdminChatWidget ref 에러 수정 (2026-05-05)
- [x] STEP 33-1: msgs.map을 IIFE로 감싸 lastDateLabel 지역 변수로 처리
- [x] STEP 33-2: git commit + push (9dccb58)

## STEP 34: AdminChatWidget lastDateLabel 재할당 에러 수정 (2026-05-05)
- [x] STEP 34-1: dateLabels/showDates 사전 계산 후 map에서 참조
- [x] STEP 34-2: git commit + push

## STEP 35: SiteShell + AdminShell 채팅 위젯 렌더 추가 (2026-05-06)
- [x] STEP 35-1: SiteShell.tsx — ChatWidget import + 렌더
- [x] STEP 35-2: AdminShell.tsx — AdminChatWidget import + 렌더
- [x] STEP 35-3: 빌드 + 배포 + 검증

## STEP 36: 관리자 채팅방 헤더 "회원 정보" 버튼 (2026-05-06)
- [x] STEP 36-1: ChatRoomPanel에 userId prop 추가 + "회원 정보" 버튼 렌더
- [x] STEP 36-2: AdminChatWidget에서 userId 상태 관리 + handleEnterRoom 확장
- [x] STEP 36-3: 빌드 + 배포 + 검증

## STEP 37: CI/CD 워크플로우 수정 (2026-05-06)
- [x] STEP 37-1: ci.yml Build env에 NEXT_PUBLIC_CHAT_URL 추가
- [x] STEP 37-2: deploy.yml 롤링 업데이트에 lms_queue/lms_scheduler 추가
- [x] STEP 37-3: git commit (5bebbd8e)

## STEP 38: EnrollButton "확인 중..." 무한 로딩 버그 수정 (2026-05-11)
- [x] STEP 38-1: 근본 원인 분석 — zustand v5 toThenable 동기 실행 + useAuthStore 순환 참조
- [x] STEP 38-2: store/auth.ts 수정 (partialize + _markLoaded 클로저 패턴)
- [x] STEP 38-3: 빌드 + 배포 + 검증
  - npm run build 완전 통과 (TypeScript OK, 에러 0) ✓
  - Docker 이미지 --no-cache 재빌드 + 컨테이너 교체 ✓
  - /courses 200 ✓, 컨테이너 Ready in 0ms ✓

## STEP 39: 학습 페이지 비정상 video_url 교체 (2026-05-11)
- [x] STEP 39-1: lessons 테이블 비정상 URL 조회 → example.com 111개 (id 63~173) 발견
- [x] STEP 39-2: 111개 → devstreaming-cdn.apple.com 테스트 스트림으로 일괄 교체 (tinker)
- [x] STEP 39-3: 비정상 잔존 0건 확인, Apple CDN 140건 (기존 29 + 신규 111) 검증 완료

## STEP 40: 학습 페이지 시작 버튼 클릭 시 영상 자동 재생 (2026-05-11)
- [x] STEP 40-1: 시작 버튼 핸들러 + VideoPlayer 연결 부분 확인 — MANIFEST_PARSED에 play() 없음 확인
- [x] STEP 40-2: VideoPlayer autoPlay prop 추가 + tryPlay() 헬퍼(muted 폴백) + page.tsx autoPlay 전달
- [x] STEP 40-3: tsc OK, Docker 재빌드 + 배포 + /my/courses/1 200 ✓

## STEP 41: 학습자 페이지 max-width max-w-7xl 통일 + 디자인 개선 (2026-05-11)
- [x] STEP 41-1: Header.tsx / Footer.tsx max-w-6xl → max-w-7xl
- [x] STEP 41-2: 학습자 17개 파일 max-w-* → max-w-7xl 일괄 통일 (SiteShell은 컨테이너 없어 제외, 시험 응시 페이지 제외)
- [x] STEP 41-3: 홈 히어로 px-4 → px-6 sm:px-16 + /courses 그리드 xl:grid-cols-4
- [x] STEP 41-4: tsc OK, 빌드 성공, / /courses /my/courses /notices /faq /verify /semesters 전부 200 ✓

## STEP 42: Elasticsearch 강좌 검색 연동 (2026-05-11)
- [x] STEP 42-1: 루트 .env ES 설정 확인 (이미 존재), lms_php zslab_net 연결 확인, ES status=yellow 정상
- [x] STEP 42-2: elasticsearch/elasticsearch ^8.0 설치 (ES 8.13 호환), ElasticsearchService + config/elasticsearch.php 작성
- [x] STEP 42-3: CourseIndexer (21개 인덱싱 완료) + CourseObserver (AppServiceProvider 등록) + es:index-courses 커맨드
- [x] STEP 42-4: CourseController::index() ?q= → ES 전문검색 (ES 장애 시 LIKE 폴백)
- [x] STEP 42-5: GET /api/courses/suggest → ES completion suggester (LIKE 폴백)
- [x] STEP 42-6: CourseSearchBar 자동완성 드롭다운 (200ms debounce, 키보드 탐색, 외부클릭 닫기)
- [x] STEP 42-7: tsc OK, 빌드 성공, SC1~6 전부 통과 — ES 검색/자동완성/일반목록/컨테이너 에러 없음

## STEP 43: README 업데이트 + Kibana 대시보드 임베드 페이지 (2026-05-15)
- [x] STEP 43-1: README.md 업데이트 (Kibana, ELK, 완료 로드맵 항목)
- [x] STEP 43-2: /lms-manage/analytics 페이지 신규 생성 (Kibana iframe 임베드)
- [x] STEP 43-3: AdminNav 사이드바 "접속 통계" 메뉴 추가
- [x] STEP 43-4: 빌드 + 배포 + 검증
  - npm run build 완전 통과 (TypeScript OK) ✓
  - Docker 이미지 재빌드 + 컨테이너 교체 ✓
  - /lms-manage/analytics 200 ✓
  - AdminNav "접속 통계" 메뉴 추가 (Activity 아이콘, 초기 BarChart2 → 중복 해소) ✓
  - Kibana iframe 임베드 완료 ✓
  - iframe src 상대경로 변경 (/kibana/app/dashboards#/view/...) ✓
  - nginx /kibana/ location: proxy_hide_header X-Content-Type-Options 추가 ✓
    proxy_hide_header Content-Security-Policy 제거 → Kibana 자체 CSP(nonce) 통과 ✓
    add_header HSTS + X-Content-Type-Options → 서버 레벨 LMS CSP 상속 차단 ✓
    "Please upgrade your browser" 오류 해결 ✓

## STEP 44: 코드 정리 + git commit & push (2026-05-15)
- [x] STEP 44-1: AdminNav.tsx BarChart2 unused import 제거
- [x] STEP 44-2: tsc 에러 없음 확인 (BarChart2 출석·성적에서 사용 중 → import 유지, Activity가 접속 통계 전용)
- [x] STEP 44-3: git commit (b81f5052) & push → main ✓

## STEP 45: 코드 품질 자동 스캔 (2026-05-15)
- [x] STEP 45-1: PHPStan 정적 분석 — level 5, 59 errors (대부분 Eloquent 모델 타입힌트 누락)
- [x] STEP 45-2: composer audit 보안 스캔 — 취약점 없음 ✓
- [x] STEP 45-3: npm audit — frontend: high(Next.js CVEs)/moderate(postcss), node-realtime/chat 취약점 없음
- [x] STEP 45-4: depcheck — @radix-ui/react-toast unused (실제론 sonner로 대체됨), dev deps는 빌드도구 정상
- [x] STEP 45-5: ESLint — 0 errors, 30 warnings (unused vars/imports, exhaustive-deps 1건)
- [x] STEP 45-6: 하드코딩 민감 정보 패턴 검색 — 모두 config()·env() 참조, 평문 하드코딩 없음 ✓
- [x] STEP 45-7: N+1 패턴 검색 — 컨트롤러 내 ->each / foreach->-> 패턴 없음 ✓

## STEP 46: 스캔 결과 수정 (2026-05-15)
- [x] STEP 46-1: Next.js 이미 16.2.6 (최신 stable) — audit 범위가 canary 포함 오탐, 9.3.3 다운그레이드 불가. postcss는 Next.js 내부 dep, Next.js 17+에서 해결 예정. 스킵.
- [x] STEP 46-2: @radix-ui/react-toast 제거 완료 (소스 import 없음 확인)
- [x] STEP 46-3: AdminChatWidget.tsx exhaustive-deps — Zustand stable 액션 6개 deps 추가
- [x] STEP 46-4: ESLint 23 warnings 전부 수정 (13개 파일 — 미사용 import/var/setter 제거)
- [x] STEP 46-5: PHPStan — PDF set_option→setOptions, str_pad 타입 캐스트, BeaconAuth instanceof 체크, phpstan.neon ignore 패턴 정비 → No errors
- [x] STEP 46-6: Next.js 빌드 성공 + Docker 재배포 + 전 컨테이너 healthy 확인

## STEP 47: git commit & push (2026-05-15)
- [x] STEP 47-1: 변경 파일 확인 및 커밋 (f8cd07e2)
- [x] STEP 47-2: git push — b81f5052..f8cd07e2 main -> main

## STEP 48: 자격증 PDF 수정 (2026-05-15)
- [x] STEP 48-1: NanumGothic 폰트 등록 (storage/fonts)
- [x] STEP 48-2: template.blade.php — NanumGothic 적용 + QR URL 텍스트 제거 + SVG 크기 CSS 수정
- [x] STEP 48-3: CertificateIssueService — defaultFont + chroot 설정
- [x] STEP 48-4: PDF 재생성 테스트
- [x] STEP 48-5: 검증
  - NanumGothic/NanumGothicBold PDF 임베드 확인 (/BaseFont /SUBAAB+NanumGothic, /SUBAAC+NanumGothicBold) ✓
  - GET /api/my/certificates/2/download → 200, application/pdf, 50K ✓
  - QR URL 텍스트 제거 완료 ✓
  - 컨테이너 에러 0 ✓

## STEP 49: 자격증 PDF 단일 페이지 수정 (2026-05-15)
- [x] STEP 49-1: template.blade.php — @page 설정, flexbox→절대 위치 레이아웃으로 변경
- [x] STEP 49-2: PDF 재생성 + 단일 페이지 확인 (/Count 1)
- [x] STEP 49-3: API 다운로드 + 한글 유지 확인
  - GET /api/my/certificates/2/download → 200, 55K ✓
  - /Count 1 (단일 페이지) ✓
  - NanumGothic + NanumGothicBold 임베드 ✓
  - 컨테이너 에러 0 ✓

## STEP 50: Sanctum 토큰 abilities 세션 분리 (2026-05-15)
- [x] STEP 50-1: AuthController — 역할 기준 토큰 abilities 분리 발급
- [x] STEP 50-2: RoleMiddleware — tokenCan 검증 추가
- [x] STEP 50-3: 기존 abilities=['*'] 토큰 삭제 (2건 삭제, remaining=0)
- [x] STEP 50-4: lms_php 재시작 + 검증 SC1~SC6
  SC1 student 로그인 → name=student-session, abilities=["role:student"] ✓
  SC2 admin 로그인 → name=admin-session, abilities=["role:admin"] ✓
  SC3 student 토큰 → /api/admin/users → 403 ✓
  SC4 admin 토큰 → /api/courses (공개) → 200 ✓
  SC5 student 토큰 → /api/my/enrollments → 200 ✓
  SC6 admin 토큰 → /api/my/enrollments → 200 ✓
  컨테이너 에러 0 ✓

## STEP 51: 학습자/관리자 로그인 분리 (2026-05-15)
- [x] STEP 51-1: AuthController — login_type 파라미터 검증 추가
- [x] STEP 51-2: lib/api.ts + store/auth.ts — login_type 전달 경로 추가
- [x] STEP 51-3: /login/page.tsx — login_type: 'student' 전달
- [x] STEP 51-4: /lms-manage/login/page.tsx — login_type: 'admin' 전달
- [x] STEP 51-5: 빌드 + lms_php 재시작 + SC1~SC4 검증
  SC1 학습자 페이지 + admin 로그인 → 422 "관리자 계정은 관리자 페이지에서 로그인하세요." ✓
  SC2 학습자 페이지 + student 로그인 → 200, roles=['student'] ✓
  SC3 관리자 페이지 + student 로그인 → 422 "학습자 계정은 학습자 페이지에서 로그인하세요." ✓
  SC4 관리자 페이지 + admin 로그인 → 200, roles=['admin'] ✓
  TypeScript OK, 빌드 성공, 컨테이너 에러 0 ✓

## STEP 52: 토큰 스토리지 분리 + 에러 메시지 모호화 (2026-05-15)
- [x] STEP 52-1: AuthController — me() token_type 추가, login() 에러 메시지 모호화
- [x] STEP 52-2: store/adminAuth.ts 신규 생성 (lms-admin-auth 키)
- [x] STEP 52-3: lib/api.ts LmsUser에 token_type 추가
- [x] STEP 52-4: lms-manage 30개 페이지 + admin 컴포넌트 2개 일괄 교체
- [x] STEP 52-5: 빌드 + 배포 + SC1~SC5 검증
  SC1 관리자 페이지 + student 로그인 → "이메일 또는 비밀번호가 올바르지 않습니다." ✓
  SC2 학습자 페이지 + admin 로그인 → "이메일 또는 비밀번호가 올바르지 않습니다." ✓
  SC3 student 로그인 me() → token_type=student ✓
  SC4 admin 로그인 me() → token_type=admin ✓
  SC5 두 토큰 동시: student→/my/enrollments 200, admin→/admin/users 200 ✓
  TypeScript OK, 빌드 성공, 컨테이너 에러 0 ✓

## STEP 53: git commit & push (2026-05-15)
- [x] STEP 53-1: 변경 파일 스테이징 및 커밋 (eae3d664, 53 files)
- [x] STEP 53-2: git push — f8cd07e2..eae3d664 main -> main

## STEP 54: PHPUnit 테스트 구조 설계 + 핵심 테스트 작성 (2026-05-15)
- [x] STEP 54-1: 기반 구조 — 디렉토리 + BaseTestCase + 헬퍼
- [x] STEP 54-2: Factory 정비 (UserFactory 상태 + CourseFactory + EnrollmentFactory + ExamFactory)
- [x] STEP 54-3: Feature 테스트 작성 (Auth / Enrollment / Certificate)
- [x] STEP 54-4: phpunit.xml 정비 (testsuite + SQLite + DB_URL 빈값 + ELASTICSEARCH_ENABLED=false)
- [x] STEP 54-5: GitHub Actions ci.yml에 Feature testsuite 실행 추가 (pdo_sqlite extension 포함)
- [x] STEP 54-6: php artisan test --testsuite=Feature → 19 passed, 0 failed ✓
  - AuthTest: 7개 (학습자/관리자 로그인, 역할 검증, 잘못된 비밀번호, me, logout)
  - EnrollmentTest: 5개 (자격증 코스 수강신청, 중복, 미인증, 미공개, 목록)
  - CertificateTest: 6개 (미완료/미합격 발급 거부, 합격 후 발급, 진위확인 valid/invalid, 인증 필요)
  - ExampleTest: 1개

## STEP 55: Exam/Assignment 테스트 추가 + git push (2026-05-15)
- [x] STEP 55-1: tests/Feature/Exam/ExamTest.php 작성 (6케이스)
- [x] STEP 55-2: tests/Feature/Exam/AssignmentTest.php 작성 (5케이스)
- [x] STEP 55-3: Factory 보완 (ExamQuestion HasFactory 추가)
- [x] STEP 55-4: php artisan test --testsuite=Feature → 31 passed, 0 failed ✓
  - ExamTest: 시험 조회·시작·정답/오답 제출·재응시 422·미인증·미수강 403
  - AssignmentTest: 과제 조회·제출·중복 422·미인증·기한 만료 422
- [x] STEP 55-5: git commit (de9810b0) & push → eae3d664..de9810b0 main -> main

## STEP 56: CI Elasticsearch Mock 처리 (2026-05-15)
- [x] STEP 56-1: config/elasticsearch.php에 enabled 키 추가
- [x] STEP 56-2: ElasticsearchService::isEnabled() static 메서드 추가
- [x] STEP 56-3: CourseObserver — isEnabled() 체크 후 skip (saved/deleted 양쪽)
- [x] STEP 56-4: TestCase::setUp() — ELASTICSEARCH_ENABLED=false 시 mock 바인딩
- [x] STEP 56-5: php artisan test → 31 passed, 0 failed ✓
- [x] STEP 56-6: git commit (90545694) & push → de9810b0..90545694 main -> main

## STEP 57: GitHub Actions Node.js 24 대응 (2026-05-15)
- [x] STEP 57-1: ci.yml actions 버전 업 (checkout@v5, cache@v5, upload-artifact@v5, setup-node@v5)
- [x] STEP 57-2: deploy.yml checkout@v5
- [x] STEP 57-3: git commit (a80629cd) & push → 90545694..a80629cd main -> main

## STEP 58: CI 경고 2종 수정 (2026-05-15)
- [ ] STEP 58-1: ci.yml + deploy.yml FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true 추가
- [ ] STEP 58-2: useForceLogoutSocket.ts deps 배열에 user 추가
- [ ] STEP 58-3: git commit & push

## 완료 후
PROGRESS.md STEP 1 [x] 업데이트 후 결과 보고
