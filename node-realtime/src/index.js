'use strict';

require('dotenv').config();

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('ioredis');
const jwt = require('jsonwebtoken');

const PORT = process.env.SOCKET_PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const CORS_ORIGIN = process.env.SOCKET_CORS_ORIGIN || 'https://zslab-lms.duckdns.org';
const REDIS_HOST = process.env.REDIS_HOST || 'zslab_redis';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || null;

// ── Express & HTTP 서버 ──────────────────────
const app = express();

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

const httpServer = createServer(app);

// ── Socket.io ────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: CORS_ORIGIN,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  path: '/ws/socket.io',
  transports: ['websocket', 'polling'],
});

// ── Redis 어댑터 (수평 확장용) ────────────────
const redisOptions = { host: REDIS_HOST, port: REDIS_PORT };
if (REDIS_PASSWORD) redisOptions.password = REDIS_PASSWORD;
const pubClient = createClient(redisOptions);
const subClient = pubClient.duplicate();

// ioredis는 자동 연결 — ready 이벤트 후 어댑터 등록
pubClient.on('ready', () => {
  io.adapter(createAdapter(pubClient, subClient));
  console.log('[socket] Redis adapter connected');
});
pubClient.on('error', (err) => {
  console.error('[socket] Redis pub error:', err.message);
});
subClient.on('error', (err) => {
  console.error('[socket] Redis sub error:', err.message);
});

// ── JWT 인증 미들웨어 ─────────────────────────
io.use((socket, next) => {
  const token =
    socket.handshake.auth?.token ||
    socket.handshake.headers?.authorization?.replace('Bearer ', '');

  if (!token) {
    return next(new Error('인증 토큰이 없습니다.'));
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    socket.user = payload;
    next();
  } catch {
    next(new Error('유효하지 않은 토큰입니다.'));
  }
});

// ── 이벤트 핸들러 ────────────────────────────
io.on('connection', (socket) => {
  const { id: userId, role } = socket.user;
  console.log(`[socket] 연결: userId=${userId} role=${role} socketId=${socket.id}`);

  // 강의실 입장
  socket.on('join:course', (courseId) => {
    socket.join(`course:${courseId}`);
    console.log(`[socket] userId=${userId} → course:${courseId}`);
  });

  // 강의실 퇴장
  socket.on('leave:course', (courseId) => {
    socket.leave(`course:${courseId}`);
  });

  // 실시간 질문 (수강생 → 강의실 전체)
  socket.on('course:question', ({ courseId, content }) => {
    io.to(`course:${courseId}`).emit('course:question', {
      userId,
      content,
      at: new Date().toISOString(),
    });
  });

  // 진도율 업데이트 브로드캐스트 (서버 → 강의실)
  socket.on('progress:update', ({ courseId, lectureId, percent }) => {
    socket.to(`course:${courseId}`).emit('progress:update', {
      userId,
      lectureId,
      percent,
    });
  });

  socket.on('disconnect', (reason) => {
    console.log(`[socket] 연결 해제: userId=${userId} reason=${reason}`);
  });
});

// ── 서버 시작 ────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`[socket] 실시간 서버 시작 — port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  io.close(() => {
    pubClient.disconnect();
    subClient.disconnect();
    process.exit(0);
  });
});
