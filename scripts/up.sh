#!/usr/bin/env bash
# =============================================
# up.sh — LMS 스택 기동
# =============================================
set -euo pipefail

COMPOSE_FILE="docker-compose.lms.yml"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$PROJECT_DIR"

if [[ ! -f ".env" ]]; then
  echo "[ERROR] .env 파일이 없습니다. cp .env.example .env 후 설정하세요."
  exit 1
fi

echo "[LMS] 이미지 빌드 중..."
docker compose -f "$COMPOSE_FILE" build --no-cache

echo "[LMS] 컨테이너 기동 중..."
docker compose -f "$COMPOSE_FILE" up -d

echo "[LMS] 헬스체크 대기 (30초)..."
sleep 30

echo "[LMS] 상태 확인:"
docker compose -f "$COMPOSE_FILE" ps

echo "[LMS] Laravel 마이그레이션..."
docker exec lms_php php artisan migrate --force

echo "[LMS] 기동 완료!"
