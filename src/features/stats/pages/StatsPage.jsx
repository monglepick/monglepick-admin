/**
 * 통계/분석 관리자 탭 메인 페이지.
 *
 * 5개 서브탭으로 구성:
 * - 서비스 통계 : DAU/MAU, 신규 가입, 리뷰, 게시글 KPI + 추이 차트
 * - 추천 분석   : CTR, 만족도, 장르 분포, 추천 로그 테이블
 * - 검색 분석   : 검색 품질 지표, 인기 검색어 테이블
 * - 사용자 행동 : 장르 선호 차트, 시간대별 활동, 코호트 리텐션
 * - 매출        : 월매출/MRR/ARPU, 일별 매출 차트, 구독 분포
 *
 * 탭 전환 전략:
 * - SupportPage와 동일하게 activeTab 상태 + 조건부 렌더링 방식 사용.
 * - 각 탭은 처음 방문(클릭) 시에만 마운트 — visited Set으로 추적.
 * - 마운트 후에는 $visible prop(display:none/block)으로 표시/숨김 처리.
 *   → 탭 로컬 상태(필터, 페이지 등)가 탭 전환 시에도 유지됨.
 */

import { useState, useRef } from 'react';
import styled from 'styled-components';
import ServiceTab from '../components/ServiceTab';
import RecommendationTab from '../components/RecommendationTab';
import SearchTab from '../components/SearchTab';
import BehaviorTab from '../components/BehaviorTab';
import RevenueTab from '../components/RevenueTab';

/** 서브탭 정의 */
const TABS = [
  { key: 'service',        label: '서비스 통계' },
  { key: 'recommendation', label: '추천 분석' },
  { key: 'search',         label: '검색 분석' },
  { key: 'behavior',       label: '사용자 행동' },
  { key: 'revenue',        label: '매출' },
];

export default function StatsPage() {
  /** 현재 활성 탭 키 */
  const [activeTab, setActiveTab] = useState('service');

  /**
   * 방문한 탭 키 Set.
   * useRef로 관리하여 리렌더링 없이 추적.
   * 최초 탭('service')은 초기값에 포함.
   */
  const visitedRef = useRef(new Set(['service']));

  /**
   * 탭 클릭 핸들러.
   * activeTab을 갱신하고, 처음 방문하는 탭이면 visited에 추가(마운트 허용).
   *
   * @param {string} key - 탭 키
   */
  function handleTabClick(key) {
    visitedRef.current.add(key);
    setActiveTab(key);
  }

  return (
    <Wrapper>
      {/* ── 페이지 헤더 ── */}
      <PageHeader>
        <PageTitle>통계 / 분석</PageTitle>
        <PageDesc>
          서비스 KPI, AI 추천 성과, 검색 품질, 사용자 행동 패턴, 매출 현황을 확인합니다.
        </PageDesc>
      </PageHeader>

      {/* ── 서브탭 네비게이션 ── */}
      <TabNav>
        {TABS.map((tab) => (
          <TabButton
            key={tab.key}
            $active={activeTab === tab.key}
            onClick={() => handleTabClick(tab.key)}
          >
            {tab.label}
          </TabButton>
        ))}
      </TabNav>

      {/* ── 탭 콘텐츠 영역 ── */}
      <TabPanel>
        {/*
         * visited Set에 포함된 탭만 마운트 (처음 클릭 시 마운트, 이후 유지).
         * $visible prop으로 display:none/block 전환 — 로컬 상태 유지.
         */}

        {/* 서비스 통계 */}
        <TabContent $visible={activeTab === 'service'}>
          {visitedRef.current.has('service') && <ServiceTab />}
        </TabContent>

        {/* 추천 분석 */}
        <TabContent $visible={activeTab === 'recommendation'}>
          {visitedRef.current.has('recommendation') && <RecommendationTab />}
        </TabContent>

        {/* 검색 분석 */}
        <TabContent $visible={activeTab === 'search'}>
          {visitedRef.current.has('search') && <SearchTab />}
        </TabContent>

        {/* 사용자 행동 */}
        <TabContent $visible={activeTab === 'behavior'}>
          {visitedRef.current.has('behavior') && <BehaviorTab />}
        </TabContent>

        {/* 매출 */}
        <TabContent $visible={activeTab === 'revenue'}>
          {visitedRef.current.has('revenue') && <RevenueTab />}
        </TabContent>
      </TabPanel>
    </Wrapper>
  );
}

/* ── styled-components ── */

const Wrapper = styled.div``;

const PageHeader = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
`;

const PageTitle = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.xxl};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const PageDesc = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textMuted};
`;

/** 서브탭 네비게이션 바 — SupportPage와 동일한 구조 */
const TabNav = styled.nav`
  display: flex;
  border-bottom: 2px solid ${({ theme }) => theme.colors.border};
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
  gap: 0;
  /* 화면이 좁을 때 가로 스크롤 허용 */
  overflow-x: auto;
`;

const TabButton = styled.button`
  padding: 10px 20px;
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ $active, theme }) =>
    $active ? theme.fontWeights.semibold : theme.fontWeights.normal};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.primary : theme.colors.textSecondary};
  border-bottom: 2px solid ${({ $active, theme }) =>
    $active ? theme.colors.primary : 'transparent'};
  /* border-bottom 겹침 보정 — SupportPage와 동일 */
  margin-bottom: -2px;
  transition: all ${({ theme }) => theme.transitions.fast};
  white-space: nowrap;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const TabPanel = styled.div``;

/**
 * 탭 콘텐츠 래퍼.
 * $visible=false 일 때 display:none — 컴포넌트 마운트 상태 유지.
 */
const TabContent = styled.div`
  display: ${({ $visible }) => ($visible ? 'block' : 'none')};
`;
