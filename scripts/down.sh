#!/usr/bin/env bash
# =============================================
# down.sh — LMS 스택 종료
# =============================================
set -euo pipefail

COMPOSE_FILE="docker-compose.lms.yml"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$PROJECT_DIR"

echo "[LMS] 스택 종료 중..."
docker compose -f "$COMPOSE_FILE" down

echo "[LMS] 종료 완료."
