/**
 * 관리자 페이지 레이아웃.
 * 사이드바(고정) + 메인 콘텐츠 영역(Outlet).
 */

import { Outlet } from 'react-router-dom';
import styled from 'styled-components';
import AdminSidebar from './AdminSidebar';
import useAuthStore from '../stores/useAuthStore';

export default function AdminLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  return (
    <LayoutWrapper>
      <AdminSidebar />
      <MainArea>
        {/* 상단 헤더 바 */}
        <Header>
          <HeaderLeft />
          <HeaderRight>
            <UserInfo>{user?.nickname || user?.email || '관리자'}</UserInfo>
            <LogoutButton onClick={logout}>로그아웃</LogoutButton>
          </HeaderRight>
        </Header>

        {/* 페이지 콘텐츠 */}
        <Content>
          <Outlet />
        </Content>
      </MainArea>
    </LayoutWrapper>
  );
}

/* ── styled-components ── */

const LayoutWrapper = styled.div`
  display: flex;
  min-height: 100vh;
`;

const MainArea = styled.main`
  flex: 1;
  margin-left: ${({ theme }) => theme.layout.sidebarWidth};
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const Header = styled.header`
  height: ${({ theme }) => theme.layout.headerHeight};
  background: ${({ theme }) => theme.colors.bgCard};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${({ theme }) => theme.layout.contentPadding};
  position: sticky;
  top: 0;
  z-index: 50;
`;

const HeaderLeft = styled.div``;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const UserInfo = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

const LogoutButton = styled.button`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  padding: ${({ theme }) => theme.spacing.xs} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.error};
    border-color: ${({ theme }) => theme.colors.error};
  }
`;

const Content = styled.div`
  flex: 1;
  padding: ${({ theme }) => theme.layout.contentPadding};
  max-width: ${({ theme }) => theme.layout.contentMaxWidth};
  width: 100%;
`;
