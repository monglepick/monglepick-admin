/**
 * 관리자 API 상수 정의.
 *
 * 서비스 분류:
 * - @service Backend  → backendApi  (Spring Boot :8080) — /api/v1/admin/*
 * - @service Agent    → agentApi    (FastAPI :8000)     — /api/v1/admin/*
 */

/** API 버전 접두사 */
export const API_VERSION = '/api/v1';

/** 관리자 API 접두사 */
const ADMIN = `${API_VERSION}/admin`;

/* ── 인증 (Backend) ── */
export const AUTH_ENDPOINTS = {
  /** 관리자 전용 로그인 — 백엔드에서 ADMIN role 검증 후 JWT 발급 (일반 유저 403 차단) */
  LOGIN: `${API_VERSION}/admin/auth/login`,
  REFRESH: `/jwt/refresh`,
  LOGOUT: `${API_VERSION}/auth/logout`,
};

/* ── 시스템 (윤형주) ── */
export const SYSTEM_ENDPOINTS = {
  /** 4개 서비스 헬스체크 집계 - GET (Backend) */
  SERVICES: `${ADMIN}/system/services`,
  /** 5개 DB 상태 - GET (Agent) */
  DB: `${ADMIN}/system/db`,
  /** Ollama 모델 상태 - GET (Agent) */
  OLLAMA: `${ADMIN}/system/ollama`,
  /** 현재 설정값 조회 - GET (Backend) */
  CONFIG: `${ADMIN}/system/config`,
};

/* ── 결제/포인트 관리 (윤형주) ── */
export const PAYMENT_ADMIN_ENDPOINTS = {
  ORDERS: `${ADMIN}/payment/orders`,
  ORDER_DETAIL: (orderId) => `${ADMIN}/payment/orders/${orderId}`,
  REFUND: (orderId) => `${ADMIN}/payment/orders/${orderId}/refund`,
  FAILED_ORDERS: `${ADMIN}/payment/orders/failed`,
  COMPENSATE: (orderId) => `${ADMIN}/payment/orders/${orderId}/compensate`,
  SUBSCRIPTIONS: `${ADMIN}/subscription`,
  CANCEL_SUB: (id) => `${ADMIN}/subscription/${id}/cancel`,
  EXTEND_SUB: (id) => `${ADMIN}/subscription/${id}/extend`,
  POINT_MANUAL: `${ADMIN}/point/manual`,
  POINT_HISTORY: (userId) => `${ADMIN}/point/history/${userId}`,
  POINT_ITEMS: `${ADMIN}/point/items`,
  POINT_ITEM_DETAIL: (id) => `${ADMIN}/point/items/${id}`,
};

/* ── 고객센터 관리 (윤형주) ── */
export const SUPPORT_ADMIN_ENDPOINTS = {
  /* 공지사항 */
  NOTICES: `${ADMIN}/notices`,
  NOTICE_DETAIL: (id) => `${ADMIN}/notices/${id}`,
  NOTICE_REORDER: `${ADMIN}/notices/reorder`,
  /* FAQ */
  FAQ: `${ADMIN}/faq`,
  FAQ_DETAIL: (id) => `${ADMIN}/faq/${id}`,
  FAQ_REORDER: `${ADMIN}/faq/reorder`,
  /* 도움말 */
  HELP: `${ADMIN}/help-articles`,
  HELP_DETAIL: (id) => `${ADMIN}/help-articles/${id}`,
  /* 티켓 */
  TICKETS: `${ADMIN}/tickets`,
  TICKET_DETAIL: (id) => `${ADMIN}/tickets/${id}`,
  TICKET_STATUS: (id) => `${ADMIN}/tickets/${id}/status`,
  TICKET_REPLY: (id) => `${ADMIN}/tickets/${id}/reply`,
  /* 비속어 */
  PROFANITY: `${ADMIN}/profanity`,
  PROFANITY_DETAIL: (id) => `${ADMIN}/profanity/${id}`,
  PROFANITY_IMPORT: `${ADMIN}/profanity/import`,
  PROFANITY_EXPORT: `${ADMIN}/profanity/export`,
};

/* ── AI 운영 (윤형주) ── */
export const AI_ADMIN_ENDPOINTS = {
  QUIZ_GENERATE: `${ADMIN}/ai/quiz/generate`,
  QUIZ_HISTORY: `${ADMIN}/ai/quiz/history`,
  REVIEW_GENERATE: `${ADMIN}/ai/review/generate`,
  REVIEW_HISTORY: `${ADMIN}/ai/review/history`,
  CHAT_SESSIONS: `${ADMIN}/ai/chat/sessions`,
  CHAT_MESSAGES: (sessionId) => `${ADMIN}/ai/chat/sessions/${sessionId}/messages`,
  CHAT_STATS: `${ADMIN}/ai/chat/stats`,
};

/* ── 데이터 관리 (윤형주 — Agent) ── */
export const DATA_ADMIN_ENDPOINTS = {
  STATS: `${ADMIN}/data/stats`,
  HEALTH: `${ADMIN}/data/health`,
  QUALITY: `${ADMIN}/data/quality`,
  MOVIES: `${ADMIN}/movies`,
  MOVIE_DETAIL: (id) => `${ADMIN}/movies/${id}`,
  MOVIE_DB_STATUS: (id) => `${ADMIN}/movies/${id}/db-status`,
  PIPELINE_RUN: `${ADMIN}/pipeline/run`,
  PIPELINE_STATUS: `${ADMIN}/pipeline/status`,
  PIPELINE_LOG: `${ADMIN}/pipeline/log/stream`,
  PIPELINE_CANCEL: `${ADMIN}/pipeline/cancel`,
  PIPELINE_HISTORY: `${ADMIN}/pipeline/history`,
  PIPELINE_CHECKPOINT: `${ADMIN}/pipeline/checkpoint`,
  PIPELINE_RETRY: `${ADMIN}/pipeline/retry-failed`,
};
