/**
 * 상태 뱃지 공통 컴포넌트.
 * 색상별 상태 표시 (success/warning/error/info/default).
 */

import styled from 'styled-components';

const STATUS_COLORS = {
  success: { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
  warning: { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
  error: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
  info: { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
  default: { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' },
};

export default function StatusBadge({ status, label }) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.default;

  return (
    <Badge $bg={colors.bg} $text={colors.text} $border={colors.border}>
      {label}
    </Badge>
  );
}

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 4px;
  background: ${({ $bg }) => $bg};
  color: ${({ $text }) => $text};
  border: 1px solid ${({ $border }) => $border};
  white-space: nowrap;
`;
