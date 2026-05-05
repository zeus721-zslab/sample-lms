#!/usr/bin/env bash
# =============================================
# shell-api.sh — Laravel 컨테이너 쉘 접속
# =============================================
set -euo pipefail

docker exec -it lms_php bash "$@"
