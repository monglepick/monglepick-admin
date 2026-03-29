/**
 * 관리자 페이지 글로벌 스타일.
 * 밝은 배경, 데이터 밀도 높은 어드민 UI 최적화.
 */

import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  /* ── 리셋 ── */
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  /* ── 기본 ── */
  html {
    font-size: 14px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    font-family: ${({ theme }) => theme.fonts.base};
    background-color: ${({ theme }) => theme.colors.bgMain};
    color: ${({ theme }) => theme.colors.textPrimary};
    line-height: 1.5;
    min-height: 100vh;
  }

  #root {
    min-height: 100vh;
  }

  /* ── 링크 ── */
  a {
    color: ${({ theme }) => theme.colors.primary};
    text-decoration: none;
    &:hover { text-decoration: underline; }
  }

  /* ── 테이블 ── */
  table {
    border-collapse: collapse;
    width: 100%;
  }

  /* ── 스크롤바 ── */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border};
    border-radius: 3px;
  }

  /* ── 입력 필드 ── */
  input, textarea, select, button {
    font-family: inherit;
    font-size: inherit;
  }

  button {
    cursor: pointer;
    border: none;
    background: none;
  }
`;

export default GlobalStyle;
