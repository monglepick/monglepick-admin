/**
 * 관리자 페이지 디자인 토큰.
 * 사용자 클라이언트(glassmorphism+glow)와 완전히 다른 실용적 어드민 테마.
 * 밝은 배경 + 데이터 밀도 높은 UI 최적화.
 */

const theme = {
  /* ── 색상 ── */
  colors: {
    /* 브랜드 */
    primary: '#6366f1',       // 인디고
    primaryHover: '#4f46e5',
    primaryLight: '#eef2ff',
    primaryBg: '#f5f3ff',

    /* 배경 */
    bgMain: '#f8fafc',         // 전체 배경
    bgSidebar: '#1e293b',      // 사이드바 (다크)
    bgCard: '#ffffff',         // 카드 배경
    bgHover: '#f1f5f9',       // 호버

    /* 텍스트 */
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    textSidebar: '#cbd5e1',
    textSidebarActive: '#ffffff',

    /* 상태 */
    success: '#10b981',
    successBg: '#ecfdf5',
    warning: '#f59e0b',
    warningBg: '#fffbeb',
    error: '#ef4444',
    errorBg: '#fef2f2',
    info: '#3b82f6',
    infoBg: '#eff6ff',

    /* 경계선 */
    border: '#e2e8f0',
    borderLight: '#f1f5f9',
  },

  /* ── 타이포그래피 ── */
  fonts: {
    base: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif",
    mono: "'Fira Code', 'Consolas', monospace",
  },
  fontSizes: {
    xs: '12px',
    sm: '13px',
    md: '14px',
    lg: '16px',
    xl: '18px',
    xxl: '24px',
    heading: '20px',
  },
  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  /* ── 간격 ── */
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    xxl: '24px',
    xxxl: '32px',
  },

  /* ── 레이아웃 ── */
  layout: {
    sidebarWidth: '240px',
    sidebarCollapsed: '64px',
    headerHeight: '56px',
    contentPadding: '24px',
    contentMaxWidth: '1400px',
    cardRadius: '8px',
  },

  /* ── 그림자 ── */
  shadows: {
    sm: '0 1px 2px rgba(0,0,0,0.05)',
    md: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
    lg: '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)',
    card: '0 1px 3px rgba(0,0,0,0.08)',
  },

  /* ── 트랜지션 ── */
  transitions: {
    fast: '150ms ease',
    normal: '200ms ease',
    slow: '300ms ease',
  },
};

export default theme;
