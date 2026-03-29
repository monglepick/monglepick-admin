/**
 * 시스템 설정 조회 테이블 (읽기 전용).
 * 현재 적용된 설정값을 표 형태로 표시.
 */

import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { fetchSystemConfig } from '../api/systemApi';

/** 설정 항목 한국어 라벨 */
const CONFIG_LABELS = {
  apiRateLimit: 'API Rate Limit',
  corsAllowedOrigins: 'CORS 허용 도메인',
  jwtAccessExpiry: 'JWT Access 만료',
  jwtRefreshExpiry: 'JWT Refresh 만료',
  redisSessionTtl: 'Redis 세션 TTL',
  fileUploadLimit: '파일 업로드 제한',
  ollamaMaxModels: 'Ollama MAX_LOADED_MODELS',
  sseKeepalive: 'SSE Keepalive',
  embeddingRateLimit: '임베딩 Rate Limit',
  cfCacheTtl: 'CF 캐시 TTL',
};

export default function ConfigViewer() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSystemConfig()
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <Section>
      <SectionTitle>설정 조회 (읽기 전용)</SectionTitle>

      {error && <ErrorMsg>설정을 불러올 수 없습니다: {error}</ErrorMsg>}

      <Table>
        <thead>
          <tr>
            <Th>항목</Th>
            <Th>현재 값</Th>
            <Th>설명</Th>
          </tr>
        </thead>
        <tbody>
          {data ? (
            Object.entries(data).map(([key, item]) => (
              <tr key={key}>
                <Td>{CONFIG_LABELS[key] || key}</Td>
                <TdMono>{typeof item === 'object' ? item.value : String(item)}</TdMono>
                <TdDesc>{typeof item === 'object' ? item.description : ''}</TdDesc>
              </tr>
            ))
          ) : (
            <tr>
              <Td colSpan={3} style={{ textAlign: 'center', color: '#94a3b8' }}>
                {error ? '로드 실패' : '로딩 중...'}
              </Td>
            </tr>
          )}
        </tbody>
      </Table>
    </Section>
  );
}

/* ── styled-components ── */

const Section = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
`;

const SectionTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.heading};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const ErrorMsg = styled.p`
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Table = styled.table`
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.layout.cardRadius};
  overflow: hidden;
`;

const Th = styled.th`
  text-align: left;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.bgMain};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textSecondary};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const Td = styled.td`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  border-bottom: 1px solid ${({ theme }) => theme.colors.borderLight};
`;

const TdMono = styled(Td)`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

const TdDesc = styled(Td)`
  color: ${({ theme }) => theme.colors.textMuted};
`;
