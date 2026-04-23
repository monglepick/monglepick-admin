/**
 * 관리자 어시스턴트 채팅 입력창.
 *
 * - Enter = 전송, Shift+Enter = 줄바꿈
 * - 전송 중(disabled)이면 버튼 대신 "중단" 버튼 노출 → cancel 콜백
 * - maxLength=3000 (Agent 의 AdminAssistantRequest 상한과 동일)
 */

import { useCallback, useState } from 'react';
import styled from 'styled-components';
import { MdSend, MdStop } from 'react-icons/md';


export default function ChatInput({
  onSubmit,
  onCancel,
  isStreaming = false,
  disabled = false,
  placeholder = '예) 지난 7일 DAU 추이 보여줘',
}) {
  const [value, setValue] = useState('');

  const submit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isStreaming || disabled) return;
    onSubmit?.(trimmed);
    setValue('');
  }, [value, isStreaming, disabled, onSubmit]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <InputBar>
      <StyledTextarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        maxLength={3000}
        rows={2}
        disabled={disabled}
      />
      {isStreaming ? (
        <ActionButton type="button" onClick={onCancel} $variant="stop" title="중단">
          <MdStop size={20} />
          <ButtonLabel>중단</ButtonLabel>
        </ActionButton>
      ) : (
        <ActionButton
          type="button"
          onClick={submit}
          $variant="send"
          disabled={disabled || !value.trim()}
          title="전송 (Enter)"
        >
          <MdSend size={20} />
          <ButtonLabel>전송</ButtonLabel>
        </ActionButton>
      )}
    </InputBar>
  );
}


/* ── styled-components ── */

const InputBar = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: stretch;
  padding: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bgMain};
`;

const StyledTextarea = styled.textarea`
  flex: 1;
  resize: none;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-family: inherit;
  line-height: 1.5;
  background: ${({ theme }) => theme.colors.bgSubtle};
  color: ${({ theme }) => theme.colors.textPrimary};
  outline: none;
  transition: border-color 0.15s ease;

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ActionButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 ${({ theme }) => theme.spacing.md};
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  min-width: 88px;
  background: ${({ $variant, theme }) =>
    $variant === 'stop' ? theme.colors.error : theme.colors.primary};
  color: #fff;
  transition: opacity 0.15s ease;

  &:hover { opacity: 0.9; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const ButtonLabel = styled.span`
  display: inline;
`;
