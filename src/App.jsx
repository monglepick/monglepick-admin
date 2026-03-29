/**
 * 몽글픽 관리자 앱 라우팅 (10탭 + 로그인).
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '@/shared/components/AdminLayout';
import AdminGuard from '@/shared/components/AdminGuard';
import PlaceholderPage from '@/shared/components/PlaceholderPage';
import LoginPage from '@/features/auth/pages/LoginPage';
import SystemPage from '@/features/system/pages/SystemPage';

export default function App() {
  return (
    <Routes>
      {/* 로그인 (공개) */}
      <Route path="/login" element={<LoginPage />} />

      {/* 관리자 (인증+ADMIN 필수) */}
      <Route
        path="/admin"
        element={
          <AdminGuard>
            <AdminLayout />
          </AdminGuard>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<PlaceholderPage title="대시보드" description="김민규 담당 — KPI 카드, 추이 차트, 최근 활동" />} />
        <Route path="users" element={<PlaceholderPage title="사용자 관리" description="김민규 담당 — 회원 검색/상세, 역할 변경, 계정 정지" />} />
        <Route path="content" element={<PlaceholderPage title="콘텐츠 관리" description="이민수 담당 — 신고/혐오표현 대기열, 게시글/리뷰 관리" />} />
        <Route path="payment" element={<PlaceholderPage title="결제/포인트 관리" description="윤형주 담당 — 결제 내역/환불, 구독, 포인트 수동 지급" />} />
        <Route path="data" element={<PlaceholderPage title="데이터 관리" description="윤형주 담당 — 영화 CRUD, 파이프라인 트리거, 수집 이력" />} />
        <Route path="ai" element={<PlaceholderPage title="AI 운영" description="윤형주 담당 — 퀴즈/리뷰 트리거, 챗봇 로그" />} />
        <Route path="support" element={<PlaceholderPage title="고객센터 관리" description="윤형주 담당 — 공지사항, FAQ CMS, 도움말, 티켓, 비속어" />} />
        <Route path="stats" element={<PlaceholderPage title="통계/분석" description="정한나 담당 — KPI, 추천 분석, 검색 분석, 리텐션, 매출" />} />
        <Route path="system" element={<SystemPage />} />
        <Route path="settings" element={<PlaceholderPage title="설정" description="김민규 담당 — 약관/정책, 배너, 관리자 활동 로그, 관리자 계정" />} />
      </Route>

      {/* 루트 → 관리자 대시보드 */}
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
