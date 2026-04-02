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
  /* Vite 8(rolldown) ↔ recharts/d3 CJS 호환 문제 우회:
     d3-* 모듈을 사전 번들링하여 ESM으로 변환 */
  optimizeDeps: {
    include: [
      'recharts',
      'd3-array',
      'd3-scale',
      'd3-shape',
      'd3-interpolate',
      'd3-color',
      'd3-format',
      'd3-time',
      'd3-time-format',
      'd3-path',
    ],
  },
})
