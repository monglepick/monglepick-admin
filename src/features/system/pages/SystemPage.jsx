/**
 * 시스템 탭 메인 페이지.
 * 4개 서브 섹션: 서비스 상태 → DB 상태 → Ollama → 설정 조회.
 */

import styled from 'styled-components';
import ServiceStatus from '../components/ServiceStatus';
import DbStatus from '../components/DbStatus';
import OllamaStatus from '../components/OllamaStatus';
import ConfigViewer from '../components/ConfigViewer';

export default function SystemPage() {
  return (
    <Wrapper>
      <PageHeader>
        <PageTitle>시스템</PageTitle>
        <PageDesc>서비스 헬스체크, DB/LLM 상태, 현재 설정값을 확인합니다.</PageDesc>
      </PageHeader>

      <ServiceStatus />
      <DbStatus />
      <OllamaStatus />
      <ConfigViewer />
    </Wrapper>
  );
}

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
