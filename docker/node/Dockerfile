# =============================================
# Node.js — Socket.io 실시간 서버
# Base: node:20-alpine
# =============================================
FROM node:20-alpine

RUN apk add --no-cache bash curl

WORKDIR /app

# 의존성 먼저 복사 (레이어 캐싱)
COPY node-realtime/package*.json ./
RUN npm ci --omit=dev

# 소스 복사
COPY node-realtime/ ./

# 비루트 실행
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3001/healthz || exit 1

CMD ["node", "src/index.js"]
