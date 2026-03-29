/**
 * 관리자 사이드바 (10탭 네비게이션).
 * 현재 경로 활성 표시 + 아이콘.
 */

import { NavLink } from 'react-router-dom';
import styled from 'styled-components';
import {
  MdDashboard,
  MdPeople,
  MdArticle,
  MdPayment,
  MdStorage,
  MdSmartToy,
  MdSupportAgent,
  MdBarChart,
  MdMonitor,
  MdSettings,
} from 'react-icons/md';
import { ADMIN_ROUTES } from '../constants/routes';

/** 사이드바 메뉴 항목 (10탭) */
const MENU_ITEMS = [
  { path: ADMIN_ROUTES.DASHBOARD, icon: MdDashboard, label: '대시보드' },
  { path: ADMIN_ROUTES.USERS, icon: MdPeople, label: '사용자 관리' },
  { path: ADMIN_ROUTES.CONTENT, icon: MdArticle, label: '콘텐츠 관리' },
  { path: ADMIN_ROUTES.PAYMENT, icon: MdPayment, label: '결제/포인트' },
  { path: ADMIN_ROUTES.DATA, icon: MdStorage, label: '데이터 관리' },
  { path: ADMIN_ROUTES.AI, icon: MdSmartToy, label: 'AI 운영' },
  { path: ADMIN_ROUTES.SUPPORT, icon: MdSupportAgent, label: '고객센터' },
  { path: ADMIN_ROUTES.STATS, icon: MdBarChart, label: '통계/분석' },
  { path: ADMIN_ROUTES.SYSTEM, icon: MdMonitor, label: '시스템' },
  { path: ADMIN_ROUTES.SETTINGS, icon: MdSettings, label: '설정' },
];

export default function AdminSidebar() {
  return (
    <SidebarWrapper>
      {/* 로고 영역 */}
      <LogoArea>
        <LogoText>몽글픽</LogoText>
        <LogoSub>관리자</LogoSub>
      </LogoArea>

      {/* 네비게이션 */}
      <Nav>
        {MENU_ITEMS.map((item) => (
          <StyledNavLink key={item.path} to={item.path}>
            <item.icon size={20} />
            <span>{item.label}</span>
          </StyledNavLink>
        ))}
      </Nav>
    </SidebarWrapper>
  );
}

/* ── styled-components ── */

const SidebarWrapper = styled.aside`
  width: ${({ theme }) => theme.layout.sidebarWidth};
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  background: ${({ theme }) => theme.colors.bgSidebar};
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  z-index: 100;
`;

const LogoArea = styled.div`
  padding: ${({ theme }) => theme.spacing.xl};
  display: flex;
  align-items: baseline;
  gap: ${({ theme }) => theme.spacing.sm};
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const LogoText = styled.h1`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: #fff;
`;

const LogoSub = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.primary};
  background: ${({ theme }) => theme.colors.primaryLight};
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

const Nav = styled.nav`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.md} 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const StyledNavLink = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  color: ${({ theme }) => theme.colors.textSidebar};
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  text-decoration: none;
  transition: all ${({ theme }) => theme.transitions.fast};
  border-left: 3px solid transparent;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #fff;
    text-decoration: none;
  }

  &.active {
    background: rgba(99, 102, 241, 0.15);
    color: ${({ theme }) => theme.colors.textSidebarActive};
    border-left-color: ${({ theme }) => theme.colors.primary};
  }
`;
