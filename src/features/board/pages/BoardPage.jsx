/**
 * 게시판 관리 메인 페이지.
 *
 * 2026-04-08 개편:
 *  - 구 "콘텐츠 관리" → "게시판 관리"로 이름 변경
 *  - 카테고리 탭 흡수 (운영 도구에서 이관 — 게시글 카테고리는 게시판 도메인)
 *
 * 2026-04-23 Phase G 배치 C:
 *  - URL 쿼리파라미터 `?tab=...` 을 읽어 활성 탭 자동 세팅.
 *  - `?reportId=N` 이 있으면 ReportTab 에 aiReportId prop 으로 전달 →
 *    데이터 로드 후 해당 신고 행 조치 모달 자동 오픈.
 *
 * 2026-05-11 정리:
 *  - **모더레이션 큐** / **혐오표현** 탭 제거 — 운영자 워크플로우에서 미사용 결정.
 *    상세 조치는 신고 관리 탭에서 수행하고, 혐오표현 자동 탐지/저장은 백엔드에서
 *    그대로 동작한다 (`/admin/toxicity` API · `toxicity_check` 콘텐츠 분석 체인 유지).
 *
 * 4개 서브탭:
 * - 신고 관리: 신고 목록 + 블라인드/삭제/무시 상세 조치
 * - 게시글: 게시글 수정/삭제 + 키워드/카테고리 필터
 * - 리뷰: 리뷰 삭제 + 영화ID/평점 필터
 * - 카테고리: 게시글 상위/하위 카테고리 CRUD
 *
 * 탭 전환 시 각 컴포넌트의 로컬 상태(필터, 페이지)를 보존하기 위해
 * $visible prop 기반 display:none 방식으로 처리합니다.
 */

import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useQueryParams } from '@/shared/hooks/useQueryParams';
import ReportTab from '../components/ReportTab';
import PostTab from '../components/PostTab';
import ReviewTab from '../components/ReviewTab';
import CategoryTab from '../components/CategoryTab';

/** 서브탭 정의 — 2026-05-11 모더레이션 큐 / 혐오표현 제거 */
const TABS = [
  { key: 'reports',    label: '신고 관리' },
  { key: 'posts',      label: '게시글' },
  { key: 'reviews',    label: '리뷰' },
  { key: 'categories', label: '카테고리' },
];

/** 유효한 탭 키 집합 */
const VALID_TAB_KEYS = new Set(TABS.map((t) => t.key));

export default function BoardPage() {
  const queryParams = useQueryParams();

  /**
   * 현재 활성 탭 키.
   * URL ?tab= 쿼리가 유효한 값이면 초기값으로 사용. 아니면 'reports' 로 폴백.
   */
  const [activeTab, setActiveTab] = useState(() =>
    VALID_TAB_KEYS.has(queryParams.tab) ? queryParams.tab : 'reports'
  );

  /** 방문한 탭 Set — 처음 방문 시에만 마운트 */
  const [visited, setVisited] = useState(() => {
    const initial = VALID_TAB_KEYS.has(queryParams.tab) ? queryParams.tab : 'reports';
    return new Set([initial]);
  });

  /**
   * URL ?tab= 쿼리 변경 시 탭 자동 동기화.
   * AI 어시스턴트가 navigate 이벤트로 경로를 변경하면 해당 탭이 자동 활성화된다.
   */
  useEffect(() => {
    const requestedTab = queryParams.tab;
    if (requestedTab && VALID_TAB_KEYS.has(requestedTab)) {
      setActiveTab(requestedTab);
      setVisited((prev) => {
        if (prev.has(requestedTab)) return prev;
        const next = new Set(prev);
        next.add(requestedTab);
        return next;
      });
    }
  }, [queryParams.tab]);

  /**
   * AI 어시스턴트가 ?reportId=N 쿼리로 특정 신고 행 직접 오픈을 요청한 경우.
   * ReportTab 에 prop 으로 전달하여 데이터 로드 후 조치 모달을 자동으로 연다.
   * 숫자로 변환 — 문자열이면 ID 매칭에 실패할 수 있으므로 Number() 로 정규화.
   */
  const aiReportId = queryParams.reportId ? Number(queryParams.reportId) : null;

  function handleTabClick(key) {
    setActiveTab(key);
    setVisited((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }

  return (
    <Wrapper>
      {/* ── 페이지 헤더 ── */}
      <PageHeader>
        <PageTitle>게시판 관리</PageTitle>
        <PageDesc>
          신고 처리, 혐오표현 로그, 게시글·리뷰 관리, 게시글 카테고리 마스터를 담당합니다.
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
        <TabContent $visible={activeTab === 'reports'}>
          {visited.has('reports') && (
            <ReportTab aiReportId={aiReportId} />
          )}
        </TabContent>
        <TabContent $visible={activeTab === 'posts'}>
          {visited.has('posts') && <PostTab />}
        </TabContent>
        <TabContent $visible={activeTab === 'reviews'}>
          {visited.has('reviews') && <ReviewTab />}
        </TabContent>
        <TabContent $visible={activeTab === 'categories'}>
          {visited.has('categories') && <CategoryTab />}
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
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const PageDesc = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const TabNav = styled.nav`
  display: flex;
  border-bottom: 2px solid ${({ theme }) => theme.colors.border};
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
  gap: 0;
  flex-wrap: wrap;
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
  margin-bottom: -2px; /* border-bottom 겹침 보정 */
  transition: all ${({ theme }) => theme.transitions.fast};
  white-space: nowrap;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const TabPanel = styled.div``;

/**
 * 탭 콘텐츠 래퍼.
 * $visible=false 일 때 display:none으로 숨김 — 컴포넌트 마운트 상태 유지.
 */
const TabContent = styled.div`
  display: ${({ $visible }) => ($visible ? 'block' : 'none')};
`;
