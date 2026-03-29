/**
 * 미구현 탭 placeholder 컴포넌트.
 * 개발 진행 중 임시 표시용.
 */

import styled from 'styled-components';

export default function PlaceholderPage({ title, description }) {
  return (
    <Wrapper>
      <Title>{title}</Title>
      <Desc>{description || '구현 예정입니다.'}</Desc>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: ${({ theme }) => theme.colors.bgCard};
  border: 2px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.layout.cardRadius};
  padding: ${({ theme }) => theme.spacing.xxxl};
`;

const Title = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.xxl};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const Desc = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textMuted};
`;
