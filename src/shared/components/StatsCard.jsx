/**
 * 숫자 통계 카드 공통 컴포넌트.
 * 아이콘 + 제목 + 값 + 부가 정보.
 */

import styled from 'styled-components';

export default function StatsCard({ icon, title, value, subtitle, status }) {
  return (
    <Card>
      <CardHeader>
        {icon && <IconWrapper $status={status}>{icon}</IconWrapper>}
        <Title>{title}</Title>
      </CardHeader>
      <Value>{value}</Value>
      {subtitle && <Subtitle>{subtitle}</Subtitle>}
    </Card>
  );
}

const Card = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.layout.cardRadius};
  padding: ${({ theme }) => theme.spacing.xl};
  box-shadow: ${({ theme }) => theme.shadows.card};
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  font-size: 18px;
  background: ${({ $status, theme }) =>
    $status === 'success' ? theme.colors.successBg :
    $status === 'error' ? theme.colors.errorBg :
    $status === 'warning' ? theme.colors.warningBg :
    theme.colors.primaryBg};
  color: ${({ $status, theme }) =>
    $status === 'success' ? theme.colors.success :
    $status === 'error' ? theme.colors.error :
    $status === 'warning' ? theme.colors.warning :
    theme.colors.primary};
`;

const Title = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

const Value = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xxl};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const Subtitle = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;
