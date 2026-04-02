/**
 * 통계/분석 관리자 API 모듈.
 *
 * 정한나 담당 탭(통계/분석)에서 사용하는 모든 API 호출을 정의합니다.
 * 엔드포인트 기본 경로: /api/v1/admin/stats
 *
 * 서비스 개요:
 * - 서비스 통계 : DAU/MAU, 신규 가입, 리뷰, 게시글 추이
 * - 추천 분석   : CTR, 만족도, 장르 분포, 추천 로그
 * - 검색 분석   : 인기 검색어, 검색 품질 지표
 * - 사용자 행동 : 장르 선호, 시간대별 활동, 코호트 리텐션
 * - 매출        : 월매출, MRR, ARPU, 구독 현황
 */

import { backendApi } from '@/shared/api/axiosInstance';

/** 통계 API 기본 경로 */
const STATS = '/api/v1/admin/stats';

/**
 * 서비스 개요 KPI 조회.
 * DAU, MAU, 신규 가입, 총 리뷰, 평균 평점, 총 게시글 수를 반환.
 *
 * @param {Object} params
 * @param {string} [params.period] - 집계 기간 (7d | 30d | 90d)
 * @returns {Promise<Object>} { dau, mau, newUsers, totalReviews, avgRating, totalPosts }
 */
export function fetchOverview(params) {
  return backendApi.get(`${STATS}/overview`, { params });
}

/**
 * 서비스 추이 데이터 조회.
 * 날짜별 DAU, 신규 가입 수, 리뷰 수 시계열 데이터를 반환.
 *
 * @param {Object} params
 * @param {string} [params.period] - 집계 기간 (7d | 30d | 90d)
 * @returns {Promise<Array>} [{ date, dau, newUsers, reviews }]
 */
export function fetchTrends(params) {
  return backendApi.get(`${STATS}/trends`, { params });
}

/**
 * 추천 성과 지표 조회.
 * 클릭률(CTR), 사용자 만족도, 총 추천 수를 반환.
 *
 * @param {Object} params
 * @param {string} [params.period] - 집계 기간 (7d | 30d | 90d)
 * @returns {Promise<Object>} { ctr, satisfaction, totalRecommendations }
 */
export function fetchRecommendation(params) {
  return backendApi.get(`${STATS}/recommendation`, { params });
}

/**
 * 추천 장르 분포 조회.
 * 장르별 추천 비율 (PieChart/BarChart용).
 *
 * @returns {Promise<Array>} [{ genre, count, ratio }]
 */
export function fetchRecommendationDistribution() {
  return backendApi.get(`${STATS}/recommendation/distribution`);
}

/**
 * 추천 로그 목록 조회 (페이징).
 * userId, movieId, 추천 점수, 피드백, 발생 시간 포함.
 *
 * @param {Object} params
 * @param {number} [params.page=0]  - 페이지 번호 (0-based)
 * @param {number} [params.size=20] - 페이지 크기
 * @param {string} [params.period]  - 집계 기간 (7d | 30d)
 * @returns {Promise<Object>} { content: [...], totalElements, totalPages }
 */
export function fetchRecommendationLogs(params) {
  return backendApi.get(`${STATS}/recommendation/logs`, { params });
}

/**
 * 인기 검색어 목록 조회.
 * 순위, 키워드, 검색 수, 전환율 포함.
 *
 * @param {Object} params
 * @param {string} [params.period] - 집계 기간 (7d | 30d)
 * @param {number} [params.size=20] - 상위 N개
 * @returns {Promise<Array>} [{ rank, keyword, searchCount, conversionRate }]
 */
export function fetchPopularKeywords(params) {
  return backendApi.get(`${STATS}/search/popular`, { params });
}

/**
 * 검색 품질 지표 조회.
 * 검색 성공률, 총 검색 수, 0건 결과 검색 수.
 *
 * @param {Object} params
 * @param {string} [params.period] - 집계 기간 (7d | 30d)
 * @returns {Promise<Object>} { successRate, totalSearches, zeroResultSearches }
 */
export function fetchSearchQuality(params) {
  return backendApi.get(`${STATS}/search/quality`, { params });
}

/**
 * 사용자 행동 분석 조회.
 * 장르별 시청/리뷰 수, 시간대별(0~23시) 활동량.
 *
 * @param {Object} params
 * @param {string} [params.period] - 집계 기간 (7d | 30d | 90d)
 * @returns {Promise<Object>} {
 *   genreStats: [{ genre, watchCount, reviewCount }],
 *   hourlyActivity: [{ hour, activityCount }]
 * }
 */
export function fetchBehavior(params) {
  return backendApi.get(`${STATS}/behavior`, { params });
}

/**
 * 코호트 리텐션 데이터 조회.
 * 코호트(가입 주차) × 유지 주차별 리텐션율.
 *
 * @param {Object} params
 * @param {number} [params.weeks=8] - 분석할 코호트 주차 수
 * @returns {Promise<Array>} [{ cohort, week0, week1, ..., weekN }]
 */
export function fetchRetention(params) {
  return backendApi.get(`${STATS}/retention`, { params });
}

/**
 * 매출 분석 데이터 조회.
 * 월매출, MRR, ARPU, 일별 매출 시계열.
 *
 * @param {Object} params
 * @param {string} [params.period] - 집계 기간 (7d | 30d | 90d)
 * @returns {Promise<Object>} {
 *   monthlyRevenue, mrr, arpu,
 *   dailyRevenue: [{ date, amount }]
 * }
 */
export function fetchRevenue(params) {
  return backendApi.get(`${STATS}/revenue`, { params });
}

/**
 * 구독 현황 조회.
 * 활성 구독 수, 이탈률, 플랜별 분포.
 *
 * @returns {Promise<Object>} {
 *   activeSubscriptions, churnRate,
 *   planDistribution: [{ plan, count, ratio }]
 * }
 */
export function fetchSubscription() {
  return backendApi.get(`${STATS}/subscription`);
}
