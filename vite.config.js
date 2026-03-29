import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

/**
 * 몽글픽 관리자 페이지 Vite 설정
 * - 프록시 미사용: .env의 VITE_BACKEND_URL / VITE_AGENT_URL로 직접 호출
 * - 포트: 5174 (사용자 클라이언트 5173과 분리)
 * - 경로 별칭: @/ → src/
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    host: '0.0.0.0',
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
