/**
 * 몽글픽 관리자 앱 엔트리포인트.
 * ThemeProvider + GlobalStyle + BrowserRouter.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import theme from './shared/styles/theme';
import GlobalStyle from './shared/styles/GlobalStyle';
import App from './App';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
