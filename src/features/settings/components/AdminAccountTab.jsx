/**
 * 관리자 계정 관리 서브탭.
 *
 * 기능:
 * - 관리자 목록 테이블 (userId, adminRole, isActive 배지, lastLoginAt, createdAt, 역할 변경)
 * - 역할 변경: select 드롭다운 (ADMIN/SUPER_ADMIN) + 확인 alert
 * - 새로고침 버튼
 * - 페이지네이션 (10건/페이지)
 *
 * 역할 변경은 즉시 API를 호출하며, 변경 전 confirm 다이얼로그로 실수 방지.
 */

import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { MdRefresh, MdAdminPanelSettings } from 'react-icons/md';
import { fetchAdmins, updateAdminRole } from '../api/settingsApi';
import StatusBadge from '@/shared/components/StatusBadge';

/** 관리자 역할 옵션 */
const ROLES = [
  { value: 'ADMIN', label: 'ADMIN' },
  { value: 'SUPER_ADMIN', label: 'SUPER_ADMIN' },
];

/** 역할 배지 색상 맵 */
const ROLE_BADGE = {
  SUPER_ADMIN: 'warning',
  ADMIN: 'info',
};

/** 날짜+시간 포맷 함수 */
function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminAccountTab() {
  /* ── 목록 상태 ── */
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ── 페이지네이션 상태 ── */
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const PAGE_SIZE = 10;

  /* ── 역할 변경 로딩 상태 (adminId → boolean 맵) ── */
  const [roleChanging, setRoleChanging] = useState({});

  /** 관리자 목록 조회 */
  const loadAdmins = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchAdmins({ page, size: PAGE_SIZE });
      setAdmins(result?.content ?? (Array.isArray(result) ? result : []));
      setTotalPages(result?.totalPages ?? 0);
    } catch (err) {
      setError(err.message ?? '관리자 목록 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  /**
   * 역할 변경 핸들러.
   * select 드롭다운 변경 시 confirm 후 API 호출.
   * @param {string|number} id - 관리자 ID
   * @param {string} currentRole - 현재 역할
   * @param {string} newRole - 변경할 역할
   */
  async function handleRoleChange(id, currentRole, newRole) {
    // 같은 역할로 변경 시도 시 무시
    if (currentRole === newRole) return;

    // 변경 전 확인
    const confirmed = window.confirm(
      `역할을 "${currentRole}" → "${newRole}"(으)로 변경하시겠습니까?\n\n관리자 ID: ${id}`
    );
    if (!confirmed) return;

    try {
      // 해당 관리자만 로딩 상태로 표시
      setRoleChanging((prev) => ({ ...prev, [id]: true }));
      await updateAdminRole(id, { adminRole: newRole });
      // 목록 새로고침으로 최신 상태 반영
      await loadAdmins();
    } catch (err) {
      alert(err.message ?? '역할 변경 중 오류가 발생했습니다.');
    } finally {
      setRoleChanging((prev) => ({ ...prev, [id]: false }));
    }
  }

  return (
    <Container>
      {/* ── 툴바 ── */}
      <Toolbar>
        <ToolbarLeft>
          <SectionTitle>관리자 계정</SectionTitle>
        </ToolbarLeft>
        <ToolbarRight>
          <IconButton onClick={loadAdmins} disabled={loading} title="새로고침">
            <MdRefresh size={16} />
          </IconButton>
        </ToolbarRight>
      </Toolbar>

      {/* ── 에러 메시지 ── */}
      {error && <ErrorMsg>{error}</ErrorMsg>}

      {/* ── 목록 테이블 ── */}
      <TableWrap>
        <Table>
          <thead>
            <tr>
              <Th $w="130px">관리자 ID</Th>
              <Th>이메일</Th>
              <Th $w="110px">닉네임</Th>
              <Th $w="120px">역할</Th>
              <Th $w="80px">활성</Th>
              <Th $w="140px">마지막 로그인</Th>
              <Th $w="120px">등록일</Th>
              <Th $w="150px">역할 변경</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8}>
                  <CenterCell>불러오는 중...</CenterCell>
                </td>
              </tr>
            ) : admins.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <CenterCell>
                    <EmptyIconWrap>
                      <MdAdminPanelSettings size={32} />
                    </EmptyIconWrap>
                    등록된 관리자가 없습니다.
                  </CenterCell>
                </td>
              </tr>
            ) : (
              admins.map((admin) => {
                const id = admin.adminId ?? admin.id;
                const role = admin.adminRole ?? admin.role ?? 'ADMIN';
                const isChanging = roleChanging[id] === true;

                return (
                  <Tr key={id}>
                    {/* 관리자 ID */}
                    <Td>
                      <MonoText>{id}</MonoText>
                    </Td>

                    {/* 이메일 */}
                    <Td>
                      <EmailText>{admin.email ?? '-'}</EmailText>
                    </Td>

                    {/* 닉네임 */}
                    <Td>{admin.nickname ?? admin.name ?? '-'}</Td>

                    {/* 현재 역할 배지 */}
                    <Td>
                      <StatusBadge
                        status={ROLE_BADGE[role] ?? 'default'}
                        label={role}
                      />
                    </Td>

                    {/* 활성 여부 배지 */}
                    <Td>
                      <StatusBadge
                        status={admin.isActive !== false ? 'success' : 'default'}
                        label={admin.isActive !== false ? '활성' : '비활성'}
                      />
                    </Td>

                    {/* 마지막 로그인 */}
                    <Td>
                      <TimeText>{formatDateTime(admin.lastLoginAt)}</TimeText>
                    </Td>

                    {/* 등록일 */}
                    <Td>
                      <TimeText>{formatDateTime(admin.createdAt)}</TimeText>
                    </Td>

                    {/* 역할 변경 드롭다운 */}
                    <Td>
                      <RoleChangeWrap>
                        <RoleSelect
                          value={role}
                          onChange={(e) => handleRoleChange(id, role, e.target.value)}
                          disabled={isChanging}
                          title="역할을 선택하면 즉시 변경됩니다"
                        >
                          {ROLES.map((r) => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                        </RoleSelect>
                        {/* 변경 중 로딩 텍스트 */}
                        {isChanging && <ChangingText>변경 중...</ChangingText>}
                      </RoleChangeWrap>
                    </Td>
                  </Tr>
                );
              })
            )}
          </tbody>
        </Table>
      </TableWrap>

      {/* ── 페이지네이션 ── */}
      {totalPages > 1 && (
        <Pagination>
          <PageButton onClick={() => setPage((p) => p - 1)} disabled={page === 0}>
            이전
          </PageButton>
          <PageInfo>
            {page + 1} / {totalPages}
          </PageInfo>
          <PageButton
            onClick={() => setPage((p) => p + 1)}
            disabled={page + 1 >= totalPages}
          >
            다음
          </PageButton>
        </Pagination>
      )}
    </Container>
  );
}

/* ── styled-components ── */

const Container = styled.div``;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const ToolbarLeft = styled.div`
  display: flex;
  align-items: center;
`;

const ToolbarRight = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const SectionTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  color: ${({ theme }) => theme.colors.textSecondary};
  transition: background ${({ theme }) => theme.transitions.fast};
  &:hover {
    background: ${({ theme }) => theme.colors.bgHover};
  }
  &:disabled {
    opacity: 0.4;
  }
`;

const ErrorMsg = styled.p`
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.errorBg};
  border-radius: 4px;
`;

const TableWrap = styled.div`
  overflow-x: auto;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.layout.cardRadius};
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const Th = styled.th`
  text-align: left;
  padding: 10px 12px;
  background: ${({ theme }) => theme.colors.bgHover};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  white-space: nowrap;
  width: ${({ $w }) => $w ?? 'auto'};
`;

const Tr = styled.tr`
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
  &:last-child {
    border-bottom: none;
  }
  &:hover {
    background: ${({ theme }) => theme.colors.bgHover};
  }
`;

const Td = styled.td`
  padding: 10px 12px;
  color: ${({ theme }) => theme.colors.textPrimary};
  vertical-align: middle;
`;

/* 고정폭 ID 텍스트 */
const MonoText = styled.span`
  font-family: 'Courier New', monospace;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const EmailText = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const TimeText = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  white-space: nowrap;
`;

/* 역할 변경 영역 (select + 로딩 텍스트) */
const RoleChangeWrap = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const RoleSelect = styled.select`
  padding: 5px 8px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  background: white;
  color: ${({ theme }) => theme.colors.textPrimary};
  cursor: pointer;
  outline: none;
  transition: border-color ${({ theme }) => theme.transitions.fast};
  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.primary};
  }
  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ChangingText = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  white-space: nowrap;
`;

const CenterCell = styled.div`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.xxxl};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const EmptyIconWrap = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.border};
`;

const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

const PageButton = styled.button`
  padding: 5px 14px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  color: ${({ theme }) => theme.colors.textSecondary};
  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.bgHover};
  }
  &:disabled {
    opacity: 0.4;
  }
`;

const PageInfo = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`;
