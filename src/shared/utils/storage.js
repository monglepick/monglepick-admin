/**
 * localStorage 래퍼 유틸리티 (관리자용).
 * monglepick-client의 storage.js 패턴과 동일.
 * 관리자 전용 키 접두사(monglepick_admin_)로 사용자 세션과 분리.
 */

/** 관리자 인증 토큰 저장 키 */
const TOKEN_KEY = 'monglepick_admin_token';
/** 관리자 사용자 정보 저장 키 */
const USER_KEY = 'monglepick_admin_user';

/**
 * localStorage에서 값을 안전하게 가져온다.
 * @param {string} key
 * @returns {string|null}
 */
function safeGetItem(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * localStorage에 값을 안전하게 저장한다.
 * @param {string} key
 * @param {string} value
 */
function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // 시크릿 모드 등에서 무시
  }
}

/**
 * localStorage에서 값을 안전하게 삭제한다.
 * @param {string} key
 */
function safeRemoveItem(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // 무시
  }
}

// ── 인증 토큰 ──
export function getToken() {
  return safeGetItem(TOKEN_KEY);
}
export function setToken(token) {
  safeSetItem(TOKEN_KEY, token);
}
export function removeToken() {
  safeRemoveItem(TOKEN_KEY);
}

// ── 사용자 정보 ──
export function getUser() {
  const json = safeGetItem(USER_KEY);
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}
export function setUser(user) {
  try {
    safeSetItem(USER_KEY, JSON.stringify(user));
  } catch {
    // 직렬화 실패 무시
  }
}
export function removeUser() {
  safeRemoveItem(USER_KEY);
}

/**
 * 모든 관리자 localStorage 데이터를 삭제한다.
 */
export function clearAll() {
  removeToken();
  removeUser();
}
