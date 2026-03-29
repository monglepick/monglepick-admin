/**
 * 관리자 인증 상태 Zustand 스토어.
 * monglepick-client의 useAuthStore와 동일 패턴.
 * ADMIN role 검증이 추가됨.
 */

import { create } from 'zustand';
import { getToken, setToken, getUser, setUser, clearAll } from '../utils/storage';
import { backendApi } from '../api/axiosInstance';
import { AUTH_ENDPOINTS } from '../constants/api';

/** JWT 만료 검사 */
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

const useAuthStore = create((set, get) => {
  /* 초기 상태: localStorage에서 복원 */
  const savedToken = getToken();
  const savedUser = getUser();
  const isValid = savedToken && savedUser && !isTokenExpired(savedToken);

  if (savedToken && !isValid) {
    clearAll();
  }

  return {
    user: isValid ? savedUser : null,
    token: isValid ? savedToken : null,
    isLoading: false,

    /** 인증 여부 */
    isAuthenticated: () => {
      const { token, user } = get();
      return Boolean(token && user);
    },

    /** ADMIN 역할 여부 */
    isAdmin: () => {
      const { user } = get();
      return user?.userRole === 'ADMIN' || user?.role === 'ADMIN';
    },

    /** 로그인 처리 */
    login: ({ accessToken, user: userData }) => {
      set({ token: accessToken, user: userData });
      setToken(accessToken);
      setUser(userData);
    },

    /** 로그아웃 처리 */
    logout: async () => {
      try {
        await backendApi.post(AUTH_ENDPOINTS.LOGOUT);
      } catch {
        // best-effort — 네트워크 오류 시에도 클라이언트 로그아웃 진행
      }
      set({ token: null, user: null });
      clearAll();
    },

    /** 사용자 정보 업데이트 */
    updateUser: (updatedUser) => {
      set({ user: updatedUser });
      setUser(updatedUser);
    },
  };
});

export default useAuthStore;
