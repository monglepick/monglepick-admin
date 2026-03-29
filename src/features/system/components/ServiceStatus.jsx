/**
 * 서비스 상태 카드 (4개 서비스 헬스체크).
 * Spring Boot, AI Agent, Recommend, Nginx 상태를 표시.
 * 30초마다 자동 polling.
 */

import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { MdRefresh } from 'react-icons/md';
import { fetchServiceStatus } from '../api/systemApi';
import StatusBadge from '@/shared/components/StatusBadge';

/** 서비스별 기본 정보 */
const SERVICE_META = {
  backend: { name: 'Spring Boot', port: ':8080' },
  agent: { name: 'AI Agent', port: ':8000' },
  recommend: { name: 'Recommend', port: ':8001' },
  nginx: { name: 'Nginx', port: ':80' },
};

/** 상태에 따른 뱃지 매핑 */
function getStatusInfo(service) {
  if (!service) return { status: 'default', label: '확인 중' };
  if (service.connected === false || service.status === 'down') {
    return { status: 'error', label: '장애' };
  }
  if (service.responseTime > 3000) {
    return { status: 'warning', label: '지연' };
  }
  return { status: 'success', label: '정상' };
}

export default function ServiceStatus() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  /** 데이터 조회 */
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchServiceStatus();
      setData(result);
      setLastChecked(new Date());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /* 초기 로드 + 30초 polling */
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  return (
    <Section>
      <SectionHeader>
        <SectionTitle>서비스 상태</SectionTitle>
        <HeaderRight>
          {lastChecked && (
            <LastChecked>
              마지막 확인: {lastChecked.toLocaleTimeString('ko-KR')}
            </LastChecked>
          )}
          <RefreshButton onClick={loadData} disabled={loading}>
            <MdRefresh size={16} />
          </RefreshButton>
        </HeaderRight>
      </SectionHeader>

      {error && <ErrorMsg>서비스 상태를 불러올 수 없습니다: {error}</ErrorMsg>}

      <CardGrid>
        {Object.entries(SERVICE_META).map(([key, meta]) => {
          const service = data?.[key];
          const { status, label } = getStatusInfo(service);

          return (
            <ServiceCard key={key}>
              <CardTop>
                <StatusDot $status={status} />
                <ServiceName>{meta.name}</ServiceName>
                <StatusBadge status={status} label={label} />
              </CardTop>
              <ServicePort>{meta.port}</ServicePort>
              {service?.responseTime != null && (
                <MetricRow>
                  <MetricLabel>응답 시간</MetricLabel>
                  <MetricValue>{service.responseTime}ms</MetricValue>
                </MetricRow>
              )}
              {service?.uptime != null && (
                <MetricRow>
                  <MetricLabel>업타임</MetricLabel>
                  <MetricValue>{service.uptime}</MetricValue>
                </MetricRow>
              )}
            </ServiceCard>
          );
        })}
      </CardGrid>
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

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

const LastChecked = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
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
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover { background: ${({ theme }) => theme.colors.bgHover}; }
  &:disabled { opacity: 0.5; }
`;

const ErrorMsg = styled.p`
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
`;

const ServiceCard = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.layout.cardRadius};
  padding: ${({ theme }) => theme.spacing.xl};
  box-shadow: ${({ theme }) => theme.shadows.card};
`;

const CardTop = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $status, theme }) =>
    $status === 'success' ? theme.colors.success :
    $status === 'error' ? theme.colors.error :
    $status === 'warning' ? theme.colors.warning :
    theme.colors.textMuted};
`;

const ServiceName = styled.span`
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  flex: 1;
`;

const ServicePort = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
  font-family: ${({ theme }) => theme.fonts.mono};
  display: block;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const MetricRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.xs} 0;
  border-top: 1px solid ${({ theme }) => theme.colors.borderLight};
`;

const MetricLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textMuted};
`;

const MetricValue = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  font-family: ${({ theme }) => theme.fonts.mono};
`;
