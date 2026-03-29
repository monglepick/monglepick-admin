/**
 * Ollama LLM 상태 카드.
 * 로드된 모델 목록, VRAM 사용량, 세마포어 상태를 표시.
 */

import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { MdRefresh } from 'react-icons/md';
import { fetchOllamaStatus } from '../api/systemApi';
import StatusBadge from '@/shared/components/StatusBadge';

export default function OllamaStatus() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchOllamaStatus();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const connected = data?.connected !== false;

  return (
    <Section>
      <SectionHeader>
        <SectionTitle>LLM 상태 (Ollama)</SectionTitle>
        <RefreshButton onClick={loadData} disabled={loading}>
          <MdRefresh size={16} />
        </RefreshButton>
      </SectionHeader>

      {error && <ErrorMsg>Ollama 상태를 불러올 수 없습니다: {error}</ErrorMsg>}

      <Card>
        <CardTop>
          <span>Ollama 서버</span>
          <StatusBadge
            status={!data ? 'default' : connected ? 'success' : 'error'}
            label={!data ? '확인 중' : connected ? `연결 (${data.version || ''})` : '장애'}
          />
        </CardTop>

        {data?.maxLoadedModels && (
          <InfoRow>MAX_LOADED_MODELS: {data.maxLoadedModels}</InfoRow>
        )}

        {/* 로드된 모델 목록 */}
        {data?.models?.length > 0 && (
          <ModelList>
            {data.models.map((model, idx) => (
              <ModelItem key={idx}>
                <ModelHeader>
                  <ModelName>{model.name}</ModelName>
                  <StatusBadge
                    status={model.loaded ? 'success' : 'default'}
                    label={model.loaded ? 'Loaded' : 'Unloaded'}
                  />
                </ModelHeader>
                {model.vram && <MetricText>VRAM: {model.vram}</MetricText>}
                {model.role && <MetricText>역할: {model.role}</MetricText>}
                {model.lastUsed && <MetricText>마지막 호출: {model.lastUsed}</MetricText>}
              </ModelItem>
            ))}
          </ModelList>
        )}

        {/* 요청 큐 */}
        {data?.queue && (
          <QueueInfo>
            요청 큐: 대기 {data.queue.waiting ?? 0}건 / 처리 중 {data.queue.processing ?? 0}건
          </QueueInfo>
        )}
      </Card>
    </Section>
  );
}

/* ── styled-components ── */

const Section = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const SectionTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.heading};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  color: ${({ theme }) => theme.colors.textSecondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  &:hover { background: ${({ theme }) => theme.colors.bgHover}; }
  &:disabled { opacity: 0.5; }
`;

const ErrorMsg = styled.p`
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Card = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.layout.cardRadius};
  padding: ${({ theme }) => theme.spacing.xl};
  box-shadow: ${({ theme }) => theme.shadows.card};
`;

const CardTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;

const InfoRow = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
  font-family: ${({ theme }) => theme.fonts.mono};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  padding-bottom: ${({ theme }) => theme.spacing.md};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
`;

const ModelList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

const ModelItem = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.bgMain};
  border-radius: 6px;
`;

const ModelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const ModelName = styled.span`
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const MetricText = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: 2px;
`;

const QueueInfo = styled.div`
  margin-top: ${({ theme }) => theme.spacing.lg};
  padding-top: ${({ theme }) => theme.spacing.md};
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;
