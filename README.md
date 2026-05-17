# zslab LMS

학점은행제 · 자격증 듀얼 모드 통합 LMS (Learning Management System)

**라이브 데모** → [https://zslab-lms.duckdns.org](https://zslab-lms.duckdns.org)

테스트 계정 비밀번호 모두 `password`

| 역할 | 이메일 |
|------|--------|
| 관리자 | admin@zslab.test |
| 교수자 | professor@zslab.test |
| 튜터 | tutor@zslab.test |
| 학습자 | student@zslab.test |

---

## 목차

1. [프로젝트 소개](#1-프로젝트-소개)
2. [기술 스택](#2-기술-스택)
3. [주요 기능](#3-주요-기능)
4. [시스템 아키텍처](#4-시스템-아키텍처)
5. [설치 및 실행](#5-설치-및-실행)
6. [환경변수](#6-환경변수)
7. [개발 로드맵](#7-개발-로드맵)
8. [라이선스](#8-라이선스)

---

## 개발 현황

> **MVP 완료** (2026-05-15)
> 교수자·튜터 패널, 실 PG 결제 연동은 로드맵 참조

---

## 1. 프로젝트 소개

zslab LMS는 **학점은행제**와 **자격증 과정**을 단일 플랫폼에서 운영하는 통합 학습 관리 시스템입니다. `LMS_MODE` 환경변수 하나로 운영 모드를 전환할 수 있어 기관 성격에 맞게 유연하게 배포할 수 있습니다.

### 주요 특징

- **듀얼 모드**: `both` · `credit_bank` · `certificate` 세 가지 모드 지원
- **4단계 역할 권한**: 학습자 · 튜터 · 교수자 · 관리자, 역할별 접근 제어
- **HLS 영상 재생**: hls.js 기반 스트리밍, 이어보기 · 페이지 종료 시 진도 자동 저장 (keepalive fetch / sendBeacon)
- **실시간 진도 추적**: 30초 heartbeat → 95% 이상 시청 시 자동 수강 완료 전환
- **단일 세션 제어**: 중복 로그인 감지 → 기존 세션 강제 만료 · 실시간 알림
- **자격증 PDF 발급**: QR 코드 포함 PDF 자동 생성 · 진위 확인 페이지
- **결제 연동 준비**: StubPaymentGateway로 즉시 승인 → PG 클래스 교체만으로 실 결제 전환
- **관리자 통계 대시보드**: DB 직접 집계 기반 KPI 카드 · 추이 차트 · 인기 강좌 TOP 10
- **1:1 문의 채팅**: Socket.io 기반 실시간 채팅 모듈

---

## 2. 기술 스택

| 영역 | 기술 |
|------|------|
| **백엔드** | PHP 8.3 · Laravel 12 · FrankenPHP (워커 모드) |
| **프론트엔드** | Next.js 15 (App Router) · TypeScript · Tailwind CSS · shadcn/ui |
| **실시간** | Node.js 20 · Socket.io 4 |
| **데이터베이스** | MariaDB 10.11 |
| **캐시 / 세션** | Redis 7 |
| **검색** | Elasticsearch 8 |
| **모니터링** | Kibana (ELK 스택 대시보드) |
| **인프라** | Docker · Docker Compose · Nginx (리버스 프록시) · zslab-infra (MariaDB/Redis/ES 별도 관리) |
| **CI/CD** | GitHub Actions |
| **SSL** | Let's Encrypt (Certbot) |
| **인증** | Laravel Sanctum (Personal Access Token) |
| **PDF** | barryvdh/laravel-dompdf · simplesoftwareio/simple-qrcode |
| **차트** | Recharts |
| **영상** | hls.js |

---

## 3. 주요 기능

### 학습자

| 기능 | 설명 |
|------|------|
| 강좌 탐색 | 카테고리 · 키워드 필터, 강좌 상세 · 커리큘럼 미리보기 |
| 수강신청 | 자격증 과정 즉시 신청, 학점은행 과정 학기 분반 신청 |
| 결제 | 유료 강좌 결제 · 주문 내역 · 취소·환불 |
| 영상 학습 | HLS 스트리밍, 시작 화면, 이어보기, 진도율 자동 계산 |
| 진도 저장 | 30초 주기 heartbeat + 탭 닫기·새로고침 시 keepalive fetch |
| 시험 | 퀴즈 · 중간 · 기말 응시, 자동 채점, 합격 여부 확인 |
| 과제 | 텍스트 제출, 마감일 D-day 표시 |
| 자격증 | 시험 합격 · 수료 후 PDF 발급, QR 진위 확인 |
| 학점인정 신청 | 학기 수강 완료 후 학점인정 신청 · 상태 추적 |
| 공지·FAQ | 핀 고정 공지, 카테고리별 FAQ 아코디언 |

### 관리자 (`/lms-manage`)

| 기능 | 설명 |
|------|------|
| 통계 대시보드 | KPI 6종, 일별 수강·매출 추이 차트, 인기 강좌 TOP 10, 학기별 현황 |
| 회원 관리 | 목록 · 상세 · 상태 변경(정지/활성) · 역할 부여 · 동시접속 예외 설정 |
| 강좌 관리 | 강좌 CRUD · 차시 인라인 편집 · 승인 · 폐강 |
| 카테고리 관리 | 계층 구조 카테고리 CRUD |
| 학기·분반 관리 | 학기 상태 전환, 분반 정원 · 강좌 배정 |
| 수강신청 현황 | 학기·강좌별 수강 목록, 강제 탈퇴 |
| 출석·성적 | 점수 직접 입력, 합격 처리 |
| 학점인정 신청 | 상태 변경, NILE 제출용 CSV 내보내기 |
| 평가 관리 | 시험 · 문항 CRUD, 과제 관리, 서술형 채점 |
| 자격증 관리 | 마스터 CRUD · 발급 이력 · 회수 · 진위 확인 로그 |
| 결제·주문 | 전체 주문 조회, 강제 환불 처리 |
| 공지·FAQ | 핀 고정 공지 · FAQ 카테고리별 관리 |
| 시스템 설정 | 단일 세션 정책 · 예외 회원 설정 |
| 접속 통계 | nginx 접속 로그 수집 · Kibana 대시보드 (ELK 스택) |

### 교수자 · 튜터

기반 라우트 구성 완료 — 상세 패널은 로드맵 참조.

---

## 4. 시스템 아키텍처

### 네트워크 구성도

```
인터넷
  │
  ▼
[ gateway_nginx ]  ← Let's Encrypt SSL 종단, 리버스 프록시
  │
  ├─ /api/*          → lms_caddy → lms_php (Laravel + FrankenPHP)
  ├─ /ws/*           → lms_realtime (Socket.io — 진도 heartbeat)
  ├─ /chat/*         → lms_chat   (Socket.io — 1:1 문의 채팅)
  └─ /*              → lms_frontend (Next.js 15 standalone)

공유 인프라 (zslab-infra 저장소에서 별도 관리)
  zslab_mariadb       ← MariaDB 10.11
  zslab_redis         ← Redis 7
  zslab_elasticsearch ← Elasticsearch 8
  zslab_filebeat      ← Filebeat (nginx 접속 로그 수집)
  zslab_kibana        ← Kibana (ELK 대시보드)

  ※ 모든 컨테이너는 외부 Docker 네트워크 infra_net 을 통해 통신
  ※ lms_php 시작 시 wait-for-it.sh 로 MariaDB·Redis 준비 확인 후 자동 기동
```

### 컨테이너 구성

| 컨테이너 | 역할 | 기술 |
|----------|------|------|
| `lms_caddy` | PHP 앱 서버 (Caddy + FrankenPHP 내장) | Caddy 2 |
| `lms_php` | Laravel 애플리케이션 | PHP 8.3 + FrankenPHP |
| `lms_frontend` | Next.js SSR 서버 | Node.js 20 |
| `lms_realtime` | 실시간 진도 / 단일 세션 강제 로그아웃 | Node.js 20 + Socket.io |
| `lms_chat` | 1:1 문의 채팅 서버 (zslab-chat 모듈) | Node.js 20 + Socket.io |
| `lms_queue` | Laravel 큐 워커 | PHP 8.3 |
| `lms_scheduler` | Laravel 스케줄러 | PHP 8.3 |

### 디렉토리 구조

```
zslab-lms/
├── backend/          # Laravel 12
├── frontend/         # Next.js 15
├── node-realtime/    # Socket.io 진도 서버
├── zslab-chat/       # 1:1 문의 채팅 모듈
├── docker/           # Dockerfile, Caddyfile
├── scripts/          # up.sh, down.sh, shell-*.sh
├── .github/          # GitHub Actions CI/CD
├── docker-compose.lms.yml
└── .env.example
```

---

## 5. 설치 및 실행

### 사전 요구사항

- Docker 24+ / Docker Compose v2
- 도메인 + DNS 설정 (SSL 발급용)
- [zslab-infra](https://github.com/zslab/zslab-infra) 저장소의 인프라 스택 실행 중 (MariaDB · Redis · Elasticsearch)
- 외부 Docker 네트워크 `infra_net` 생성 필요

```bash
docker network create infra_net
```

### 설치 순서

```bash
# 1. zslab-infra 인프라 먼저 기동 (MariaDB · Redis · Elasticsearch)
#    https://github.com/zslab/zslab-infra 참조

# 2. 외부 네트워크 생성 (최초 1회)
docker network create infra_net

# 3. 저장소 클론
git clone <repo-url> zslab-lms
cd zslab-lms

# 4. 환경변수 설정
cp .env.example .env
# .env 파일을 편집해 DB 비밀번호, APP_URL, JWT_SECRET 등 입력

# 5. 데이터베이스 및 사용자 생성 (MariaDB)
mysql -u root -p <<EOF
CREATE DATABASE zslab_lms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'zslab_lms'@'%' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON zslab_lms.* TO 'zslab_lms'@'%';
FLUSH PRIVILEGES;
EOF

# 6. SSL 인증서 발급 (Let's Encrypt)
certbot certonly --webroot -w /var/www/certbot -d your-domain.example.com

# 7. gateway Nginx 프록시 설정 추가
# scripts/gateway-nginx-lms.conf 참고 후 적용

# 8. 스택 기동 (이미지 빌드 + 컨테이너 실행 + 마이그레이션)
#    lms_php 는 wait-for-it.sh 로 MariaDB·Redis 준비 확인 후 자동 시작됩니다.
bash scripts/up.sh

# 9. 초기 데이터 시드 (선택)
docker exec lms_php php artisan db:seed
```

### 유용한 스크립트

```bash
bash scripts/up.sh        # 빌드 + 기동 + 마이그레이션
bash scripts/down.sh      # 스택 종료
bash scripts/shell-api.sh # Laravel 컨테이너 쉘 접속
bash scripts/shell-front.sh # Next.js 컨테이너 쉘 접속
```

### 코드 변경 후 반영

```bash
# PHP (FrankenPHP 워커 캐시 초기화)
docker restart lms_php

# Next.js
docker compose -f docker-compose.lms.yml build lms_frontend
docker compose -f docker-compose.lms.yml up -d lms_frontend

# Nginx 설정 변경
docker exec gateway_nginx nginx -s reload
```

---

## 6. 환경변수

### 주요 환경변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `APP_URL` | — | 서비스 도메인 (https 포함) |
| `LMS_MODE` | `both` | 운영 모드 (`both` · `credit_bank` · `certificate`) |
| `DB_HOST` | `zslab_mariadb` | MariaDB 호스트 (Docker 네트워크 내) |
| `REDIS_HOST` | `zslab_redis` | Redis 호스트 |
| `ELASTICSEARCH_HOST` | `zslab_elasticsearch` | Elasticsearch 호스트 |
| `JWT_SECRET` | — | JWT 서명 키 (랜덤 64자 이상 권장) |
| `SINGLE_SESSION_ENFORCE` | `true` | 단일 세션 강제 여부 |
| `NEXT_PUBLIC_API_URL` | — | 브라우저가 호출하는 API 베이스 URL |
| `NEXT_PUBLIC_SOCKET_URL` | — | 브라우저가 연결하는 Socket.io URL |
| `CHAT_URL` | — | 1:1 문의 채팅 서버 오리진 (내부) |
| `CHAT_INTERNAL_SECRET` | — | 채팅 서버 내부 API 인증 키 |
| `FRANKENPHP_WORKER_COUNT` | `4` | FrankenPHP 워커 프로세스 수 |

### LMS_MODE 설명

| 값 | 설명 |
|----|------|
| `both` | 학점은행제 + 자격증 과정 모두 운영 (기본값) |
| `credit_bank` | 학점은행제 과정만 운영 |
| `certificate` | 자격증 과정만 운영 |

---

## 7. 개발 로드맵

### MVP 완료 ✅

- [x] 인증 (Sanctum, 4단계 역할, 단일 세션 제어)
- [x] 강좌 카탈로그 (카테고리, 검색, 필터)
- [x] 수강신청 (자격증 즉시 / 학점은행 학기 분반)
- [x] 결제 (Stub 자동 승인, 취소·환불)
- [x] HLS 영상 학습 (시작 화면, 이어보기, 진도 heartbeat)
- [x] 진도 유실 방지 (keepalive fetch / sendBeacon)
- [x] 시험 (자동채점) · 과제 제출
- [x] 자격증 PDF 발급 · QR 진위 확인
- [x] 학점인정 신청 · NILE CSV 내보내기
- [x] 관리자 패널 (회원/강좌/학기/평가/자격증/결제 전체 CRUD)
- [x] 통계 대시보드 (KPI 카드, 추이 차트, 인기 강좌 TOP 10)
- [x] 공지사항 · FAQ
- [x] 1:1 문의 채팅 (Socket.io)
- [x] 다크모드 · 모바일 반응형

### 추가 완료 ✅

- [x] Elasticsearch 강좌 전문검색 + 자동완성
- [x] ELK 스택 nginx 접속 로그 수집 · Kibana 대시보드

### 추후 개선 예정 📌

- [ ] **교수자 · 튜터 전용 패널** — 강의 업로드, 수강생 진도 확인, 채점
- [ ] **실제 PG 결제 연동** — `StubPaymentGateway` → 실 PG 클래스로 교체
- [ ] **영상 업로드 · HLS 변환** — 현재 외부 URL 입력 방식 → 직접 업로드 + 자동 트랜스코딩
- [ ] **이메일 알림** — 수강신청 확인, 시험 결과, 자격증 발급 안내
- [ ] **모바일 앱** — React Native 또는 PWA 지원

---

## 8. 라이선스

[MIT License](LICENSE)

Copyright (c) 2026 zslab
