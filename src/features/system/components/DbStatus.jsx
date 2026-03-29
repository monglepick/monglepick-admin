/**
 * DB 상태 카드 (5개 DB: MySQL, Qdrant, Neo4j, ES, Redis).
 * Agent API에서 각 DB의 연결 상태/용량/성능 지표를 조회.
 */

import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { MdRefresh } from 'react-icons/md';
import { fetchDbStatus } from '../api/systemApi';
import StatusBadge from '@/shared/components/StatusBadge';

/** DB별 표시 정보 */
const DB_META = {
  mysql: { name: 'MySQL', metrics: ['totalRows', 'diskUsage', 'slowQueries', 'activeConnections'] },
  qdrant: { name: 'Qdrant', metrics: ['vectorCount', 'segmentCount', 'ramUsage', 'diskUsage'] },
  neo4j: { name: 'Neo4j', metrics: ['nodeCount', 'relationshipCount', 'diskUsage'] },
  elasticsearch: { name: 'Elasticsearch', metrics: ['documentCount', 'indexSize', 'clusterStatus'] },
  redis: { name: 'Redis', metrics: ['keyCount', 'memoryUsed', 'memoryMax', 'hitRate'] },
};

/** 지표 한국어 라벨 */
const METRIC_LABELS = {
  totalRows: '전체 행 수',
  diskUsage: '디스크',
  slowQueries: '슬로우 쿼리',
  activeConnections: '활성 커넥션',
  vectorCount: '벡터 수',
  segmentCount: '세그먼트',
  ramUsage: 'RAM',
  nodeCount: '노드 수',
  relationshipCount: '관계 수',
  documentCount: '문서 수',
  indexSize: '인덱스 크기',
  clusterStatus: '클러스터',
  keyCount: '키 수',
  memoryUsed: '메모리 사용',
  memoryMax: '메모리 최대',
  hitRate: '히트율',
};

/** 값 포맷팅 */
function formatValue(key, value) {
  if (value == null) return '-';
  if (key === 'hitRate') return `${value}%`;
  if (typeof value === 'number' && value > 10000) return value.toLocaleString();
  return String(value);
}

export default function DbStatus() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchDbStatus();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <Section>
      <SectionHeader>
        <SectionTitle>DB 상태</SectionTitle>
        <RefreshButton onClick={loadData} disabled={loading}>
          <MdRefresh size={16} />
        </RefreshButton>
      </SectionHeader>

      {error && <ErrorMsg>DB 상태를 불러올 수 없습니다: {error}</ErrorMsg>}

      <CardGrid>
        {Object.entries(DB_META).map(([key, meta]) => {
          const db = data?.[key];
          const connected = db?.connected !== false;
          const statusType = !db ? 'default' : connected ? 'success' : 'error';
          const statusLabel = !db ? '확인 중' : connected ? '연결' : '장애';

          return (
            <DbCard key={key}>
              <CardTop>
                <DbName>{meta.name}</DbName>
                <StatusBadge status={statusType} label={statusLabel} />
              </CardTop>

              {db && meta.metrics.map((metric) => {
                const value = db[metric];
                if (value == null) return null;
                return (
                  <MetricRow key={metric}>
                    <MetricLabel>{METRIC_LABELS[metric] || metric}</MetricLabel>
                    <MetricValue>{formatValue(metric, value)}</MetricValue>
                  </MetricRow>
                );
              })}
            </DbCard>
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

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
`;

const DbCard = styled.div`
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
`;

const DbName = styled.span`
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;

const MetricRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
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
