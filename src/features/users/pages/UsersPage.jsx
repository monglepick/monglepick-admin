/**
 * 사용자 관리 페이지.
 *
 * 2단 레이아웃 구조:
 * - 좌측 (1fr): UserTable — 목록 + 검색/필터/페이징
 * - 우측 (420px, 조건부): UserDetailPanel — 선택된 사용자 상세 정보
 *
 * 선택된 사용자가 없으면 1단 레이아웃으로 축소된다.
 * TicketTab의 TwoPane 패턴과 동일한 방식으로 구현.
 */

import { useState } from 'react';
import styled from 'styled-components';
import UserTable from '../components/UserTable';
import UserDetailPanel from '../components/UserDetailPanel';

export default function UsersPage() {
  /**
   * 현재 선택된 사용자 ID.
   * null이면 상세 패널이 닫혀 있고 1단 레이아웃이 적용된다.
   */
  const [selectedUserId, setSelectedUserId] = useState(null);

  /**
   * UserTable의 onSelectUser 콜백.
   * 동일 사용자를 다시 선택하면 null로 설정하여 패널을 닫는다.
   * (UserTable 내부에서 처리하므로 여기선 단순 setter만 넘긴다)
   *
   * @param {string|null} userId - 선택된 사용자 ID
   */
  function handleSelectUser(userId) {
    setSelectedUserId(userId);
  }

  /**
   * 상세 패널 닫기.
   * CloseButton 또는 액션 완료 후 선택 해제에 사용.
   */
  function handleCloseDetail() {
    setSelectedUserId(null);
  }

  /**
   * 액션(역할 변경/정지/복구) 완료 후 목록 새로고침.
   * UserDetailPanel에서 호출하며, UserTable은 자체 loadUsers를
   * key prop으로 강제 리마운트하는 대신 내부 상태를 통해 처리하므로
   * 여기서는 refreshKey를 올려 UserTable을 재마운트시킨다.
   */
  const [refreshKey, setRefreshKey] = useState(0);

  function handleRefresh() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <Wrapper>
      {/* ── 페이지 헤더 ── */}
      <PageHeader>
        <PageTitle>사용자 관리</PageTitle>
        <PageDesc>
          회원 목록 조회, 역할 변경, 계정 정지/복구, 포인트·결제·활동 내역 확인
        </PageDesc>
      </PageHeader>

      {/* ── 2단 레이아웃 ── */}
      <TwoPane $hasDetail={!!selectedUserId}>
        {/* 좌측: 회원 목록 테이블 */}
        <ListPane>
          {/*
           * refreshKey가 변경되면 UserTable이 재마운트되어
           * loadUsers useCallback이 새로 실행된다.
           * (액션 완료 후 목록을 최신 상태로 갱신)
           */}
          <UserTable
            key={refreshKey}
            selectedUserId={selectedUserId}
            onSelectUser={handleSelectUser}
          />
        </ListPane>

        {/* 우측: 상세 패널 (사용자 선택 시에만 렌더링) */}
        {selectedUserId && (
          <UserDetailPanel
            userId={selectedUserId}
            onClose={handleCloseDetail}
            onRefresh={handleRefresh}
          />
        )}
      </TwoPane>
    </Wrapper>
  );
}

/* ── styled-components ── */

const Wrapper = styled.div``;

/** 페이지 상단 헤더 영역 */
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

/**
 * 2단 그리드 레이아웃.
 * $hasDetail=true  → 목록(1fr) + 상세(420px)
 * $hasDetail=false → 목록(1fr) 단독
 *
 * grid-template-columns을 transition으로 부드럽게 전환.
 */
const TwoPane = styled.div`
  display: grid;
  grid-template-columns: ${({ $hasDetail }) =>
    $hasDetail ? '1fr 420px' : '1fr'};
  gap: ${({ theme }) => theme.spacing.lg};
  align-items: start;
  transition: grid-template-columns ${({ theme }) => theme.transitions.normal};
`;

/** 좌측 목록 패널 */
const ListPane = styled.div`
  min-width: 0; /* 그리드 셀 오버플로우 방지 */
`;
