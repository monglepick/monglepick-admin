/**
 * 채팅 추천 칩 관리 탭 (AI 운영 → 채팅 추천 칩) — 2026-04-23 신규.
 *
 * 채팅 환영 화면에 노출되는 추천 질문 칩의 DB 풀을 운영자가 직접 CRUD한다.
 *
 * 구성:
 * - 상단 필터 툴바: 활성 상태 셀렉트 / 기간 필터(date) / 초기화 버튼 / 신규 등록 버튼
 * - 테이블(10건/페이지): ID / 문구 / 카테고리 / 활성토글 / 시작·종료 / 클릭수 / 등록일 / 액션
 * - 활성토글: MdToggleOn/MdToggleOff 인라인 클릭 → PATCH /{id}/active (busyId 중복 방지)
 * - 등록·수정 모달: textarea 200자 카운터 / 카테고리 셀렉트 / displayOrder / isActive / startAt·endAt
 * - 페이징 컴포넌트 (ReviewVerificationTab 패턴 참고)
 *
 * @module features/ai/components/ChatSuggestionTab
 */

import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { MdToggleOn, MdToggleOff, MdRefresh, MdEdit, MdDelete } from 'react-icons/md';
import {
  fetchChatSuggestions,
  createChatSuggestion,
  updateChatSuggestion,
  deleteChatSuggestion,
  toggleChatSuggestionActive,
} from '../api/chatSuggestionsApi';

/** 페이지당 항목 수 */
const PAGE_SIZE = 10;

/** 카테고리 옵션 (Backend enum 기준) */
const CATEGORY_OPTIONS = [
  { value: '',         label: '카테고리 없음' },
  { value: 'mood',     label: '무드/감정' },
  { value: 'genre',    label: '장르' },
  { value: 'trending', label: '트렌딩' },
  { value: 'family',   label: '가족' },
  { value: 'seasonal', label: '시즌' },
  { value: 'similar',  label: '유사 영화' },
  { value: 'personal', label: '개인화' },
];

/** 활성 상태 필터 옵션 */
const ACTIVE_FILTER_OPTIONS = [
  { value: '',     label: '전체' },
  { value: 'true', label: '활성' },
  { value: 'false', label: '비활성' },
];

/** ISO 날짜 문자열 → "YYYY.MM.DD HH:MM" 포맷 */
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** date 입력값(YYYY-MM-DD) → ISO-8601 시작 일시 (당일 00:00:00) */
function toIsoStart(dateStr) {
  if (!dateStr) return undefined;
  return `${dateStr}T00:00:00`;
}

/** date 입력값(YYYY-MM-DD) → ISO-8601 종료 일시 (익일 00:00:00, exclusive) */
function toIsoEnd(dateStr) {
  if (!dateStr) return undefined;
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + 1);
  return d.toISOString().replace(/\.\d{3}Z$/, '');
}

/** 빈 모달 폼 초기 상태 */
const EMPTY_FORM = {
  text: '',
  category: '',
  isActive: true,
  startAt: '',
  endAt: '',
  displayOrder: 0,
};

export default function ChatSuggestionTab() {
  /* ── 목록 상태 ── */
  const [rows, setRows] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ── 필터/페이지 ── */
  const [isActiveFilter, setIsActiveFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(0);

  /* ── 활성토글 중복 방지 — 현재 토글 요청 중인 칩 ID ── */
  const [busyId, setBusyId] = useState(null);

  /* ── 등록/수정 모달 ── */
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null = 등록, object = 수정
  const [form, setForm] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);

  /** API 쿼리 파라미터 조합 */
  const buildParams = useCallback(() => {
    const p = { page, size: PAGE_SIZE };
    if (isActiveFilter !== '') p.isActive = isActiveFilter === 'true';
    const from = toIsoStart(fromDate);
    const to = toIsoEnd(toDate);
    if (from) p.fromDate = from;
    if (to) p.toDate = to;
    return p;
  }, [page, isActiveFilter, fromDate, toDate]);

  /** 목록 로드 */
  const loadRows = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchChatSuggestions(buildParams());
      // Spring Page: result.content / result.totalPages
      setRows(result?.content ?? []);
      setTotalPages(result?.page?.totalPages ?? result?.totalPages ?? 0);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[ChatSuggestionTab] 목록 조회 실패', err);
      setError(err?.message || '목록 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => { loadRows(); }, [loadRows]);

  /** 필터 초기화 */
  function resetFilters() {
    setIsActiveFilter('');
    setFromDate('');
    setToDate('');
    setPage(0);
  }

  /** 필터 변경 시 첫 페이지로 리셋 */
  function withPageReset(setter) {
    return (v) => { setter(v); setPage(0); };
  }

  /**
   * 활성 상태 인라인 토글.
   * busyId로 중복 클릭을 방지한다.
   *
   * @param {Object} row - 대상 칩 행
   */
  async function handleToggleActive(row) {
    if (busyId != null) return; // 다른 토글 진행 중이면 무시
    setBusyId(row.id);
    try {
      const updated = await toggleChatSuggestionActive(row.id, !row.isActive);
      // 로컬 rows 에서 해당 항목만 교체해 불필요한 전체 재조회를 줄인다
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, ...updated } : r)));
    } catch (err) {
      alert(err?.message || '활성 상태 변경 중 오류가 발생했습니다.');
    } finally {
      setBusyId(null);
    }
  }

  /** 등록 모달 열기 */
  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  /**
   * 수정 모달 열기.
   *
   * @param {Object} row - 수정할 칩 행
   */
  function openEdit(row) {
    setEditTarget(row);
    setForm({
      text: row.text ?? '',
      category: row.category ?? '',
      isActive: row.isActive ?? true,
      // datetime-local 입력에 맞게 ISO 문자열을 "YYYY-MM-DDTHH:MM" 형태로 자른다
      startAt: row.startAt ? row.startAt.slice(0, 16) : '',
      endAt: row.endAt ? row.endAt.slice(0, 16) : '',
      displayOrder: row.displayOrder ?? 0,
    });
    setModalOpen(true);
  }

  /** 모달 닫기 */
  function closeModal() {
    setModalOpen(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
  }

  /** 폼 필드 변경 핸들러 */
  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  /**
   * 등록/수정 폼 제출.
   * editTarget이 null이면 등록, 있으면 수정.
   */
  async function handleFormSubmit(e) {
    e.preventDefault();
    if (!form.text.trim()) {
      alert('칩 문구를 입력해주세요.');
      return;
    }
    const payload = {
      text: form.text.trim(),
      category: form.category || undefined,
      isActive: form.isActive,
      startAt: form.startAt || undefined,
      endAt: form.endAt || undefined,
      displayOrder: Number(form.displayOrder) || 0,
    };
    try {
      setFormLoading(true);
      if (editTarget) {
        await updateChatSuggestion(editTarget.id, payload);
      } else {
        await createChatSuggestion(payload);
      }
      closeModal();
      loadRows();
    } catch (err) {
      alert(err?.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setFormLoading(false);
    }
  }

  /**
   * 삭제 처리.
   *
   * @param {Object} row - 삭제할 칩 행
   */
  async function handleDelete(row) {
    if (!window.confirm(`"${row.text}" 칩을 삭제하시겠습니까?`)) return;
    try {
      await deleteChatSuggestion(row.id);
      loadRows();
    } catch (err) {
      alert(err?.message || '삭제 중 오류가 발생했습니다.');
    }
  }

  return (
    <Container>
      {/* ── 필터 툴바 ── */}
      <Toolbar>
        <ToolbarLeft>
          <FilterGroup>
            <FilterLabel>활성 상태</FilterLabel>
            <FilterSelect
              value={isActiveFilter}
              onChange={(e) => withPageReset(setIsActiveFilter)(e.target.value)}
            >
              {ACTIVE_FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </FilterSelect>
          </FilterGroup>
          <FilterGroup>
            <FilterLabel>기간</FilterLabel>
            <FilterInput
              type="date"
              value={fromDate}
              onChange={(e) => withPageReset(setFromDate)(e.target.value)}
            />
            <DateSep>~</DateSep>
            <FilterInput
              type="date"
              value={toDate}
              onChange={(e) => withPageReset(setToDate)(e.target.value)}
            />
          </FilterGroup>
          <ResetButton type="button" onClick={resetFilters}>초기화</ResetButton>
        </ToolbarLeft>
        <ToolbarRight>
          <IconButton type="button" onClick={loadRows} disabled={loading} title="새로고침">
            <MdRefresh size={16} />
          </IconButton>
          <CreateButton type="button" onClick={openCreate}>+ 신규 등록</CreateButton>
        </ToolbarRight>
      </Toolbar>

      {error && <ErrorMsg>{error}</ErrorMsg>}

      {/* ── 테이블 ── */}
      <TableWrap>
        <Table>
          <thead>
            <tr>
              <Th $w="60px">ID</Th>
              <Th>문구</Th>
              <Th $w="90px">카테고리</Th>
              <Th $w="70px">활성</Th>
              <Th $w="140px">시작</Th>
              <Th $w="140px">종료</Th>
              <Th $w="70px">클릭수</Th>
              <Th $w="130px">등록일</Th>
              <Th $w="80px">액션</Th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9}><CenterCell>불러오는 중...</CenterCell></td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <CenterCell>등록된 추천 칩이 없습니다. 신규 등록 버튼으로 추가하세요.</CenterCell>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <Tr key={row.id}>
                  <Td><MutedText>{row.id}</MutedText></Td>
                  <Td><ChipText>{row.text}</ChipText></Td>
                  <Td>
                    <CategoryBadge>{row.category || '-'}</CategoryBadge>
                  </Td>
                  <Td>
                    {/* 활성 상태 인라인 토글 — busyId 로 중복 클릭 방지 */}
                    <ToggleButton
                      type="button"
                      onClick={() => handleToggleActive(row)}
                      disabled={busyId != null}
                      title={row.isActive ? '비활성으로 전환' : '활성으로 전환'}
                    >
                      {row.isActive
                        ? <MdToggleOn size={24} color="#7c3aed" />
                        : <MdToggleOff size={24} color="#64748b" />}
                    </ToggleButton>
                  </Td>
                  <Td><MutedText>{formatDate(row.startAt)}</MutedText></Td>
                  <Td><MutedText>{formatDate(row.endAt)}</MutedText></Td>
                  <Td><MutedText>{row.clickCount ?? 0}</MutedText></Td>
                  <Td><MutedText>{formatDate(row.createdAt)}</MutedText></Td>
                  <Td>
                    <ActionGroup>
                      <ActionBtn
                        type="button"
                        title="수정"
                        onClick={() => openEdit(row)}
                      >
                        <MdEdit size={15} />
                      </ActionBtn>
                      <ActionBtn
                        type="button"
                        title="삭제"
                        $danger
                        onClick={() => handleDelete(row)}
                      >
                        <MdDelete size={15} />
                      </ActionBtn>
                    </ActionGroup>
                  </Td>
                </Tr>
              ))
            )}
          </tbody>
        </Table>
      </TableWrap>

      {/* ── 페이징 ── */}
      {totalPages > 1 && (
        <Pagination>
          <PageBtn
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
          >
            이전
          </PageBtn>
          <PageInfo>{page + 1} / {totalPages}</PageInfo>
          <PageBtn
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            다음
          </PageBtn>
        </Pagination>
      )}

      {/* ── 등록/수정 모달 ── */}
      {modalOpen && (
        <ModalOverlay onClick={closeModal}>
          <ModalBox onClick={(e) => e.stopPropagation()}>
            <ModalTitle>{editTarget ? '추천 칩 수정' : '추천 칩 등록'}</ModalTitle>
            <ModalForm onSubmit={handleFormSubmit}>
              {/* 칩 문구 — 200자 카운터 */}
              <FormField>
                <FormLabel>칩 문구 <Required>*</Required></FormLabel>
                <FormTextarea
                  name="text"
                  value={form.text}
                  onChange={handleFormChange}
                  maxLength={200}
                  rows={3}
                  placeholder="채팅 환영 화면에 표시될 추천 질문을 입력하세요."
                  required
                />
                <CharCount $over={form.text.length >= 200}>
                  {form.text.length} / 200
                </CharCount>
              </FormField>

              {/* 카테고리 */}
              <FormField>
                <FormLabel>카테고리</FormLabel>
                <FormSelect name="category" value={form.category} onChange={handleFormChange}>
                  {CATEGORY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </FormSelect>
              </FormField>

              {/* 표시 순서 */}
              <FormField>
                <FormLabel>표시 순서</FormLabel>
                <FormInput
                  type="number"
                  name="displayOrder"
                  value={form.displayOrder}
                  onChange={handleFormChange}
                  min={0}
                  max={9999}
                />
              </FormField>

              {/* 활성 여부 */}
              <FormField $row>
                <FormLabel>활성</FormLabel>
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleFormChange}
                />
              </FormField>

              {/* 노출 시작·종료 일시 */}
              <FormField>
                <FormLabel>노출 시작 일시</FormLabel>
                <FormInput
                  type="datetime-local"
                  name="startAt"
                  value={form.startAt}
                  onChange={handleFormChange}
                />
              </FormField>
              <FormField>
                <FormLabel>노출 종료 일시</FormLabel>
                <FormInput
                  type="datetime-local"
                  name="endAt"
                  value={form.endAt}
                  onChange={handleFormChange}
                />
              </FormField>

              <ModalActions>
                <CancelBtn type="button" onClick={closeModal} disabled={formLoading}>
                  취소
                </CancelBtn>
                <SubmitBtn type="submit" disabled={formLoading}>
                  {formLoading ? '저장 중...' : (editTarget ? '수정' : '등록')}
                </SubmitBtn>
              </ModalActions>
            </ModalForm>
          </ModalBox>
        </ModalOverlay>
      )}
    </Container>
  );
}

/* ══════════════════════════════════════════════════════════
 * Styled Components
 * ══════════════════════════════════════════════════════════ */

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.layout.cardRadius};
  padding: ${({ theme }) => theme.spacing.md};
`;

const ToolbarLeft = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const ToolbarRight = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const FilterLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  white-space: nowrap;
`;

const FilterSelect = styled.select`
  padding: 4px 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  background: ${({ theme }) => theme.colors.bgInput};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const FilterInput = styled.input`
  padding: 4px 8px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  background: ${({ theme }) => theme.colors.bgInput};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const DateSep = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const ResetButton = styled.button`
  padding: 4px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  background: transparent;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  cursor: pointer;
  &:hover { background: ${({ theme }) => theme.colors.bgHover}; }
`;

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  background: transparent;
  color: ${({ theme }) => theme.colors.textMuted};
  cursor: pointer;
  &:hover { background: ${({ theme }) => theme.colors.bgHover}; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const CreateButton = styled.button`
  padding: 6px 14px;
  border: none;
  border-radius: 6px;
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  &:hover { opacity: 0.88; }
`;

const ErrorMsg = styled.p`
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  padding: ${({ theme }) => theme.spacing.sm};
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
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  text-align: left;
  background: ${({ theme }) => theme.colors.bgCard};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  white-space: nowrap;
  ${({ $w }) => $w && `width: ${$w};`}
`;

const Tr = styled.tr`
  &:hover { background: ${({ theme }) => theme.colors.bgHover}; }
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  &:last-child { border-bottom: none; }
`;

const Td = styled.td`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  vertical-align: middle;
`;

const CenterCell = styled.div`
  padding: ${({ theme }) => theme.spacing.xl};
  text-align: center;
  color: ${({ theme }) => theme.colors.textMuted};
`;

const MutedText = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
`;

const ChipText = styled.span`
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.5;
`;

const CategoryBadge = styled.span`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.bgHover};
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 11px;
`;

const ToggleButton = styled.button`
  display: flex;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const ActionGroup = styled.div`
  display: flex;
  gap: 4px;
`;

const ActionBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  background: transparent;
  color: ${({ $danger, theme }) => $danger ? theme.colors.error : theme.colors.textMuted};
  cursor: pointer;
  &:hover {
    background: ${({ $danger, theme }) => $danger ? `${theme.colors.error}22` : theme.colors.bgHover};
  }
`;

const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.md} 0;
`;

const PageBtn = styled.button`
  padding: 6px 14px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  background: transparent;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  cursor: pointer;
  &:disabled { opacity: 0.4; cursor: not-allowed; }
  &:not(:disabled):hover { background: ${({ theme }) => theme.colors.bgHover}; }
`;

const PageInfo = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  min-width: 60px;
  text-align: center;
`;

/* ── 모달 ── */

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalBox = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.layout.cardRadius};
  padding: ${({ theme }) => theme.spacing.xl};
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const ModalForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const FormField = styled.div`
  display: flex;
  flex-direction: ${({ $row }) => ($row ? 'row' : 'column')};
  ${({ $row }) => $row && 'align-items: center;'}
  gap: ${({ theme }) => theme.spacing.xs};
`;

const FormLabel = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;

const Required = styled.span`
  color: ${({ theme }) => theme.colors.error};
`;

const FormTextarea = styled.textarea`
  padding: ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  background: ${({ theme }) => theme.colors.bgInput};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  resize: vertical;
  line-height: 1.6;
  font-family: inherit;
  &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; }
`;

const CharCount = styled.span`
  font-size: 11px;
  text-align: right;
  color: ${({ $over, theme }) => ($over ? theme.colors.error : theme.colors.textMuted)};
`;

const FormSelect = styled.select`
  padding: ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  background: ${({ theme }) => theme.colors.bgInput};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const FormInput = styled.input`
  padding: ${({ theme }) => theme.spacing.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  background: ${({ theme }) => theme.colors.bgInput};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  &:focus { outline: none; border-color: ${({ theme }) => theme.colors.primary}; }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.sm};
`;

const CancelBtn = styled.button`
  padding: 8px 18px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  background: transparent;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  cursor: pointer;
  &:hover { background: ${({ theme }) => theme.colors.bgHover}; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const SubmitBtn = styled.button`
  padding: 8px 18px;
  border: none;
  border-radius: 6px;
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  cursor: pointer;
  &:hover { opacity: 0.88; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;
