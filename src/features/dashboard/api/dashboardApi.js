/**
 * 대시보드 API 모듈.
 *
 * Spring Boot Backend (/api/v1/admin/dashboard) 호출.
 * - fetchKpi       : KPI 카드 지표 (회원수/구독/결제/신고/AI 채팅)
 * - fetchTrends    : 추이 차트 (신규 가입 + 활성 사용자 + 결제 금액)
 * - fetchRecentActivities : 최근 활동 피드 (결제/신고/가입/리뷰/게시글)
 *
 * 모든 함수는 backendApi(axios) 인터셉터가 처리한 data를 반환.
 * 에러 시 상위(DashboardPage)의 Promise.allSettled에서 처리.
 */

import { backendApi } from '@/shared/api/axiosInstance';

/** 대시보드 API 기본 경로 */
const DASHBOARD = '/api/v1/admin/dashboard';

/**
 * KPI 카드 데이터 조회.
 *
 * 응답 예시:
 * {
 *   totalUsers: 15420,
 *   todayNewUsers: 38,
 *   yesterdayNewUsers: 32,
 *   activeSubscriptions: 1234,
 *   todayPaymentAmount: 2850000,
 *   yesterdayPaymentAmount: 2100000,
 *   pendingReports: 7,
 *   todayAiChats: 843
 * }
 *
 * @returns {Promise<Object>} KPI 지표 객체
 */
export function fetchKpi() {
  return backendApi.get(`${DASHBOARD}/kpi`);
}

/**
 * 추이 차트 데이터 조회.
 *
 * 기간(days)에 따라 일별 데이터 배열 반환.
 * 응답 예시:
 * [
 *   { date: "04/01", newUsers: 38, activeUsers: 1240, paymentAmount: 2850000 },
 *   ...
 * ]
 *
 * @param {{ days: number }} params - days: 7 | 14 | 30
 * @returns {Promise<Array>} 일별 추이 배열
 */
export function fetchTrends(params) {
  return backendApi.get(`${DASHBOARD}/trends`, { params });
}

/**
 * 최근 활동 조회.
 *
 * 최신 활동 피드 (결제/신고/가입/리뷰/게시글).
 * 응답 예시:
 * [
 *   {
 *     id: 1,
 *     type: "PAYMENT",
 *     description: "사용자 user123이 포인트 팩 결제 완료 (5,000P)",
 *     createdAt: "2026-04-02T10:30:00"
 *   },
 *   ...
 * ]
 *
 * @param {{ size: number }} params - size: 최대 조회 건수 (기본 20)
 * @returns {Promise<Array>} 최근 활동 배열
 */
export function fetchRecentActivities(params) {
  return backendApi.get(`${DASHBOARD}/recent`, { params });
}
