/**
 * 관리자 어시스턴트 채팅 패널.
 *
 * 책임:
 *  - useAdminAssistant 훅 인스턴스를 소비해 메시지 스트림 렌더
 *  - 하단 진행 상태(phase) 표시줄 + 입력창
 *  - 빈 상태(첫 진입) 에서는 빠른 질문 칩을 대신 렌더
 *  - 스크롤 자동 하단 고정 (신규 메시지 추가 시)
 */

import { useEffect, useRef } from 'react';
import styled from 'styled-components';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import ConfirmationDialog from './ConfirmationDialog';
import { MdAutoAwesome, MdRefresh } from 'react-icons/md';


/**
 * 빈 상태에서 보여줄 빠른 질문 칩.
 * Step 1~5a 기준 stats + 일부 리소스 조회 + 쓰기 예시 혼합.
 */
const QUICK_PROMPTS = [
  '지난 7일 DAU 추이 보여줘',
  '이번 달 환불된 결제 주문 목록',
  '대기 중인 고객센터 티켓 몇 건이야?',
  'AI 추천 서비스 현황 알려줘',
];


export default function AssistantChatPanel({
  messages,
  status,
  currentPhase,
  lastError,
  confirmation,
  onSubmit,
  onApprove,
  onReject,
  onCancel,
  onReset,
}) {
  const scrollRef = useRef(null);

  // 신규 메시지/상태 변화 시 하단으로 자동 스크롤
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, currentPhase]);

  const isStreaming = status === 'streaming';
  const isAwaitingConfirmation = status === 'awaiting_confirmation';
  const isEmpty = messages.length === 0;
  // 입력창은 스트리밍 / 승인 대기 중 모두 잠금
  const inputLocked = isStreaming || isAwaitingConfirmation;

  return (
    <PanelWrapper>
      {/* 헤더 — 세션 리셋 + 상태 배지 */}
      <PanelHeader>
        <HeaderLeft>
          <MdAutoAwesome size={18} />
          <HeaderTitle>AI 어시스턴트</HeaderTitle>
          {status === 'error' && <StatusPill $variant="error">오류</StatusPill>}
          {status === 'streaming' && <StatusPill $variant="info">응답 중</StatusPill>}
          {status === 'awaiting_confirmation' && (
            <StatusPill $variant="warning">승인 대기</StatusPill>
          )}
          {status === 'done' && <StatusPill $variant="success">완료</StatusPill>}
        </HeaderLeft>
        <ResetButton type="button" onClick={onReset} title="새 대화 시작">
          <MdRefresh size={16} />
          <span>새 대화</span>
        </ResetButton>
      </PanelHeader>

      {/* 스크롤 영역 */}
      <ScrollArea ref={scrollRef}>
        {isEmpty ? (
          <EmptyState>
            <EmptyTitle>무엇을 도와드릴까요?</EmptyTitle>
            <EmptyDesc>
              통계·조회·공지 등록 같은 관리 작업을 자연어로 말씀해주세요.
              <br />
              결과는 아래에 표·텍스트로 정리해 드려요.
            </EmptyDesc>
            <ChipRow>
              {QUICK_PROMPTS.map((q) => (
                <Chip key={q} type="button" onClick={() => onSubmit?.(q)}>
                  {q}
                </Chip>
              ))}
            </ChipRow>
          </EmptyState>
        ) : (
          <MessageList>
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {(isStreaming || isAwaitingConfirmation) && currentPhase && (
              <PhaseBadge $variant={isAwaitingConfirmation ? 'warning' : 'info'}>
                {currentPhase}
              </PhaseBadge>
            )}
          </MessageList>
        )}
      </ScrollArea>

      {lastError && (
        <ErrorBanner>⚠️ {lastError}</ErrorBanner>
      )}

      {/* 입력창 — 승인 대기 중에는 disabled */}
      <ChatInput
        onSubmit={onSubmit}
        onCancel={onCancel}
        isStreaming={isStreaming}
        disabled={isAwaitingConfirmation}
        placeholder={
          isAwaitingConfirmation
            ? '관리자 승인을 기다리고 있어요. 위 모달에서 결정해주세요.'
            : undefined
        }
      />

      {/* Step 5b: Tier 2/3 쓰기 작업 승인 모달.
          awaiting_confirmation 상태에서만 payload 가 채워지고, 승인/거절 후에 사라짐. */}
      {isAwaitingConfirmation && confirmation && (
        <ConfirmationDialog
          payload={confirmation}
          onApprove={onApprove}
          onReject={onReject}
        />
      )}
    </PanelWrapper>
  );
}


/* ── styled-components ── */

const PanelWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${({ theme }) => theme.colors.bgMain};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  overflow: hidden;
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bgSubtle};
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const HeaderTitle = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;

const StatusPill = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  padding: 2px 8px;
  border-radius: 10px;
  background: ${({ $variant, theme }) =>
    $variant === 'error'
      ? theme.colors.errorLight
      : $variant === 'info'
      ? theme.colors.infoLight
      : theme.colors.successLight};
  color: ${({ $variant, theme }) =>
    $variant === 'error'
      ? theme.colors.error
      : $variant === 'info'
      ? theme.colors.info
      : theme.colors.success};
`;

const ResetButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  background: ${({ theme }) => theme.colors.bgMain};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  cursor: pointer;

  &:hover { background: ${({ theme }) => theme.colors.bgSubtle}; }
`;

const ScrollArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.lg};
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: ${({ theme }) => theme.spacing.xxl};
  text-align: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const EmptyTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin: 0;
`;

const EmptyDesc = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  line-height: 1.6;
  margin: 0;
`;

const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  justify-content: center;
  max-width: 720px;
`;

const Chip = styled.button`
  padding: 8px 14px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 18px;
  background: ${({ theme }) => theme.colors.bgSubtle};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.primaryLight};
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const MessageList = styled.div`
  display: flex;
  flex-direction: column;
`;

const PhaseBadge = styled.div`
  align-self: flex-start;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  padding: 4px 10px;
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  margin: ${({ theme }) => theme.spacing.sm} 0;

  /* Step 5b: 승인 대기(warning) 상태를 시각적으로 강조 */
  ${({ $variant, theme }) =>
    $variant === 'warning'
      ? `
        color: ${theme.colors.warning};
        border-color: ${theme.colors.warning};
        background: ${theme.colors.warningLight};
      `
      : `
        color: ${theme.colors.textMuted};
        background: ${theme.colors.bgSubtle};
      `}
`;

const ErrorBanner = styled.div`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.errorLight};
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;
