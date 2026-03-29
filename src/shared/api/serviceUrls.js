/**
 * 서비스별 Base URL 설정
 *
 * - 개발 환경: 각 서비스가 개별 포트에서 실행 (8080, 8000)
 * - 운영 환경(Nginx): 모든 URL이 빈 문자열 → 상대 경로 → 리버스 프록시가 라우팅
 *
 * .env 예시:
 *   VITE_BACKEND_URL=http://localhost:8080
 *   VITE_AGENT_URL=http://localhost:8000
 */
export const SERVICE_URLS = {
  /** Spring Boot Backend — 관리자 API, 인증, 결제, 포인트 등 */
  BACKEND: import.meta.env.VITE_BACKEND_URL || '',

  /** FastAPI AI Agent — 데이터 관리, 파이프라인, DB/Ollama 상태 */
  AGENT: import.meta.env.VITE_AGENT_URL || '',
};
