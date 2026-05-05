#!/usr/bin/env bash
# =============================================
# shell-front.sh — Next.js 컨테이너 쉘 접속
# =============================================
set -euo pipefail

docker exec -it lms_frontend sh "$@"
