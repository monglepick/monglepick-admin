/**
 * Upstage Solar API 사용량/비용 섹션 — 매출 탭 내부 컴포넌트 (2026-05-11 신규).
 *
 * 데이터 출처:
 *  GET /api/v1/admin/stats/solar-usage?period=7d|30d|90d
 *
 * 표시 구성:
 *  Row 1. 핵심 KPI 6 (오늘 토큰/오늘 비용/이번달 토큰/이번달 비용/누적 토큰/누적 비용)
 *  Row 2. 일별 추이 ComposedChart (총 토큰 Bar + 비용 USD Line, 기간별)
 *  Row 3. 모델별 분포 PieChart + 에이전트별 분포 BarChart (가로)
 *  Row 4. 호출 건수 KPI 행 (오늘/이번달/누적/기간 호출 수)
 *
 * 데이터가 0건이어도 KPI 카드는 0 값으로 정상 렌더 — Backend 가 빈 결과를 0 으로 채워서 반환.
 *
 * 비용 정합성 안내:
 *  Agent 측 `monglepick.llm.solar_pricing` 의 모델 단가($/1M tokens)를 기준으로 1건씩
 *  적재된다. Upstage 청구서와 ±몇 % 오차가 발생할 수 있으며, 단가 변경 시 신규 호출부터
 *  반영된다 (과거 행은 갱신되지 않음).
 *
 * 기간 선택은 부모(RevenueTab) 의 PeriodGroup 과 분리되어 있다 — Solar 섹션의 기간만
 * 독립적으로 변경할 수 있도록 자체 PeriodGroup 을 둔다.
 */

import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  ComposedChart,
  Line,
} from 'recharts';
import {
  MdToken,
  MdAttachMoney,
  MdToday,
  MdCalendarMonth,
  MdHistoryEdu,
  MdReceiptLong,
  MdMemory,
  MdGroups,
} from 'react-icons/md';
import StatsCard from '@/shared/components/StatsCard';
import { fetchSolarUsage } from '../api/statsApi';

/** 기간 선택 옵션 */
const PERIOD_OPTIONS = [
  { value: '7d', label: '7일' },
  { value: '30d', label: '30일' },
  { value: '90d', label: '90일' },
];

/** 차트 색상 팔레트 — 모델/에이전트 분포에 공통 사용 */
const PALETTE = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16',
  '#0ea5e9', '#f97316',
];

// ──────────────────────────────────────────────
// 포맷터
// ──────────────────────────────────────────────

/** 토큰 수 포맷. 12345 → "12,345" / 1234567 → "1.23M" */
function fmtTokens(value) {
  if (value === null || value === undefined) return '-';
  const n = Number(value);
  if (Number.isNaN(n)) return '-';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

/**
 * 비용 USD 포맷. 0.000150 → "$0.0002" (소수 4자리 cap),
 * 1.234 → "$1.23", 1234 → "$1.23K".
 *
 * Backend 응답이 string(BigDecimal 직렬화) 인 경우도 안전하게 Number 화.
 */
function fmtCostUsd(value) {
  if (value === null || value === undefined || value === '') return '$0.00';
  const n = Number(value);
  if (Number.isNaN(n)) return '$0.00';
  if (n >= 1000) return `$${(n / 1000).toFixed(2)}K`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(3)}`;
  return `$${n.toFixed(6)}`; // 매우 작은 마이크로 비용
}

/** Y축용 짧은 토큰 포맷 (소수점 없음). */
function fmtTokensAxis(v) {
  if (v >= 1_000_000) return `${Math.floor(v / 1_000_000)}M`;
  if (v >= 1_000) return `${Math.floor(v / 1_000)}K`;
  return String(v);
}

/** Y축용 짧은 비용 포맷. */
function fmtCostAxis(v) {
  if (v >= 1000) return `$${Math.floor(v / 1000)}K`;
  if (v >= 1) return `$${v.toFixed(0)}`;
  if (v >= 0.01) return `$${v.toFixed(2)}`;
  return `$${Number(v).toFixed(4)}`;
}

/** 비율(0.0~1.0) → "5.4%" */
function fmtPct(val) {
  if (val === null || val === undefined) return '-';
  return `${(Number(val) * 100).toFixed(1)}%`;
}

/** 천 단위 콤마 — 호출 건수용 */
function fmtCount(val) {
  if (val === null || val === undefined) return '-';
  return Number(val).toLocaleString();
}

/** PieChart 라벨 — 모델 + 비율 */
function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, name, ratio }) {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 1.4;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#64748b"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={12}
    >
      {`${name} ${fmtPct(ratio)}`}
    </text>
  );
}

/** 일별 추이 커스텀 Tooltip — 토큰/비용을 각자 포맷으로 표기 */
function DailyTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <TooltipBox>
      <TooltipDate>{label}</TooltipDate>
      {payload.map((entry) => {
        const isCost = entry.dataKey === 'costUsd';
        const value = isCost ? fmtCostUsd(entry.value) : fmtTokens(entry.value);
        return (
          <TooltipRow key={entry.dataKey}>
            <TooltipDot style={{ background: entry.color }} />
            <TooltipLabel>{entry.name}</TooltipLabel>
            <TooltipValue>{value}</TooltipValue>
          </TooltipRow>
        );
      })}
    </TooltipBox>
  );
}

// ──────────────────────────────────────────────
// 메인 컴포넌트
// ──────────────────────────────────────────────

export default function SolarUsageSection() {
  /** Solar 섹션 자체 기간 — 부모 RevenueTab 의 기간과 독립 */
  const [period, setPeriod] = useState('30d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async (p) => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetchSolarUsage({ period: p });
      setData(resp);
    } catch (err) {
      setError(err?.message ?? 'Solar API 사용량 데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(period);
  }, [period, load]);

  function handlePeriodChange(p) {
    setPeriod(p);
  }

  /* 안전 접근 (응답 구조 보장 — null 가드) */
  const d = data ?? {};
  const today = d.today ?? emptyTotals();
  const thisMonth = d.thisMonth ?? emptyTotals();
  const allTime = d.allTimeTotal ?? emptyTotals();
  const periodTotal = d.periodTotal ?? emptyTotals();
  const dailyTrend = Array.isArray(d.dailyTrend) ? d.dailyTrend : [];
  const byModel = Array.isArray(d.byModel) ? d.byModel : [];
  const byAgent = Array.isArray(d.byAgent) ? d.byAgent : [];

  /** 핵심 KPI — 토큰/비용 6장 */
  const kpiCards = [
    {
      key: 'todayTokens',
      icon: <MdToday size={18} />,
      title: '오늘 토큰',
      value: loading ? '...' : fmtTokens(today.totalTokens),
      subtitle: `오늘 호출 ${fmtCount(today.callCount)}건`,
      status: 'info',
    },
    {
      key: 'todayCost',
      icon: <MdAttachMoney size={18} />,
      title: '오늘 비용',
      value: loading ? '...' : fmtCostUsd(today.costUsd),
      subtitle: 'Upstage 추정 USD',
      status: Number(today.costUsd ?? 0) > 0 ? 'warning' : 'info',
    },
    {
      key: 'monthTokens',
      icon: <MdCalendarMonth size={18} />,
      title: '이번달 토큰',
      value: loading ? '...' : fmtTokens(thisMonth.totalTokens),
      subtitle: `이번달 호출 ${fmtCount(thisMonth.callCount)}건`,
      status: 'info',
    },
    {
      key: 'monthCost',
      icon: <MdAttachMoney size={18} />,
      title: '이번달 비용',
      value: loading ? '...' : fmtCostUsd(thisMonth.costUsd),
      subtitle: '월 누적 추정 USD',
      status: 'warning',
    },
    {
      key: 'totalTokens',
      icon: <MdHistoryEdu size={18} />,
      title: '누적 토큰',
      value: loading ? '...' : fmtTokens(allTime.totalTokens),
      subtitle: `누적 호출 ${fmtCount(allTime.callCount)}건`,
      status: 'info',
    },
    {
      key: 'totalCost',
      icon: <MdAttachMoney size={18} />,
      title: '누적 비용',
      value: loading ? '...' : fmtCostUsd(allTime.costUsd),
      subtitle: '서비스 시작 이후 합계',
      status: 'success',
    },
  ];

  /** 호출 건수 + 분리된 토큰 KPI */
  const callKpiCards = [
    {
      key: 'periodCalls',
      icon: <MdReceiptLong size={18} />,
      title: '기간 호출 건수',
      value: loading ? '...' : fmtCount(periodTotal.callCount),
      subtitle: `최근 ${period} 합계`,
      status: 'info',
    },
    {
      key: 'periodPromptTokens',
      icon: <MdToken size={18} />,
      title: '기간 입력 토큰',
      value: loading ? '...' : fmtTokens(periodTotal.promptTokens),
      subtitle: 'prompt_tokens 합',
      status: 'info',
    },
    {
      key: 'periodCompletionTokens',
      icon: <MdToken size={18} />,
      title: '기간 출력 토큰',
      value: loading ? '...' : fmtTokens(periodTotal.completionTokens),
      subtitle: 'completion_tokens 합',
      status: 'info',
    },
    {
      key: 'periodCost',
      icon: <MdAttachMoney size={18} />,
      title: '기간 비용',
      value: loading ? '...' : fmtCostUsd(periodTotal.costUsd),
      subtitle: `최근 ${period} 추정 USD`,
      status: 'warning',
    },
  ];

  return (
    <Wrapper>
      {/* ── 섹션 헤더 + 기간 선택 ── */}
      <SectionHeader>
        <SectionTitleGroup>
          <SectionTitle>Upstage Solar API 사용량 / 비용</SectionTitle>
          <SectionDesc>
            Agent → Backend 적재된 호출 로그(`solar_api_usage_log`) 기준 추정 비용입니다.
            모델별 단가($/1M tokens) 는 코드 상수 (`solar_pricing.py`) 로 관리됩니다.
          </SectionDesc>
        </SectionTitleGroup>
        <PeriodGroup>
          {PERIOD_OPTIONS.map((opt) => (
            <PeriodButton
              key={opt.value}
              $active={period === opt.value}
              onClick={() => handlePeriodChange(opt.value)}
            >
              {opt.label}
            </PeriodButton>
          ))}
        </PeriodGroup>
      </SectionHeader>

      {error && <ErrorMsg>{error}</ErrorMsg>}

      {/* ── Row 1: 핵심 KPI ── */}
      <KpiGrid>
        {kpiCards.map((card) => (
          <StatsCard
            key={card.key}
            icon={card.icon}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            status={card.status}
          />
        ))}
      </KpiGrid>

      {/* ── Row 2: 일별 추이 (토큰 Bar + 비용 Line) ── */}
      <SectionLabel style={{ marginTop: '24px' }}>일별 사용량 추이 ({period})</SectionLabel>
      <ChartCard>
        <ChartTitle>총 토큰 / 비용 USD</ChartTitle>
        <ChartBody>
          {loading ? (
            <LoadingMsg>차트 데이터를 불러오는 중...</LoadingMsg>
          ) : dailyTrend.length === 0 ? (
            <LoadingMsg>표시할 일별 데이터가 없습니다.</LoadingMsg>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart
                data={dailyTrend}
                margin={{ top: 4, right: 24, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={fmtTokensAxis}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={fmtCostAxis}
                />
                <Tooltip content={<DailyTooltip />} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar
                  yAxisId="left"
                  dataKey="totalTokens"
                  name="총 토큰"
                  fill="#6366f1"
                  radius={[3, 3, 0, 0]}
                  barSize={period === '7d' ? 32 : period === '30d' ? 14 : 8}
                />
                <Line
                  yAxisId="right"
                  dataKey="costUsd"
                  name="비용 USD"
                  type="monotone"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </ChartBody>
      </ChartCard>

      {/* ── Row 3: 모델별 + 에이전트별 분포 ── */}
      <SectionLabel style={{ marginTop: '24px' }}>모델 / 에이전트 분포 ({period})</SectionLabel>
      <ChartGrid2>
        {/* 모델별 — Pie */}
        <ChartCard>
          <ChartTitleRow>
            <ChartTitleSmall>
              <MdMemory size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              모델별 비용 분포
            </ChartTitleSmall>
          </ChartTitleRow>
          <ChartBody>
            {loading ? (
              <LoadingMsg>로딩 중...</LoadingMsg>
            ) : byModel.length === 0 ? (
              <LoadingMsg>모델별 데이터가 없습니다.</LoadingMsg>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={byModel}
                    dataKey={(item) => Number(item.costUsd ?? 0)}
                    nameKey="model"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(props) =>
                      PieLabel({ ...props, ratio: props.payload?.ratio })
                    }
                  >
                    {byModel.map((_, idx) => (
                      <Cell key={`m-${idx}`} fill={PALETTE[idx % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name, ctx) => [
                      fmtCostUsd(value),
                      `${name} (${fmtTokens(ctx.payload?.totalTokens)} tok · ${fmtCount(ctx.payload?.callCount)}회)`,
                    ]}
                    contentStyle={tooltipStyle}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartBody>
        </ChartCard>

        {/* 에이전트별 — 가로 Bar */}
        <ChartCard>
          <ChartTitleRow>
            <ChartTitleSmall>
              <MdGroups size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              에이전트별 비용 분포
            </ChartTitleSmall>
          </ChartTitleRow>
          <ChartBody>
            {loading ? (
              <LoadingMsg>로딩 중...</LoadingMsg>
            ) : byAgent.length === 0 ? (
              <LoadingMsg>에이전트별 데이터가 없습니다.</LoadingMsg>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={byAgent.map((a) => ({ ...a, costNum: Number(a.costUsd ?? 0) }))}
                  layout="vertical"
                  margin={{ top: 4, right: 24, left: 64, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={fmtCostAxis}
                  />
                  <YAxis
                    type="category"
                    dataKey="agentName"
                    tick={{ fontSize: 12, fill: '#475569' }}
                    axisLine={false}
                    tickLine={false}
                    width={120}
                  />
                  <Tooltip
                    formatter={(value, _name, ctx) => [
                      fmtCostUsd(value),
                      `${ctx.payload?.agentName} (${fmtTokens(ctx.payload?.totalTokens)} tok · ${fmtCount(ctx.payload?.callCount)}회)`,
                    ]}
                    contentStyle={tooltipStyle}
                  />
                  <Bar
                    dataKey="costNum"
                    name="비용"
                    fill="#10b981"
                    radius={[0, 4, 4, 0]}
                    barSize={20}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartBody>
        </ChartCard>
      </ChartGrid2>

      {/* ── Row 4: 호출 건수 + 입출력 토큰 KPI ── */}
      <SectionLabel style={{ marginTop: '24px' }}>기간 합계 ({period})</SectionLabel>
      <KpiGrid>
        {callKpiCards.map((card) => (
          <StatsCard
            key={card.key}
            icon={card.icon}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            status={card.status}
          />
        ))}
      </KpiGrid>
    </Wrapper>
  );
}

/** 응답이 없을 때 0 채우는 헬퍼 — Backend 응답 구조와 일치. */
function emptyTotals() {
  return {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    costUsd: 0,
    callCount: 0,
  };
}

/* ── 공통 inline 스타일 ── */
const tooltipStyle = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '6px',
  fontSize: '13px',
};

/* ── styled-components ── */

const Wrapper = styled.div``;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  flex-wrap: wrap;
`;

const SectionTitleGroup = styled.div`
  flex: 1;
  min-width: 0;
`;

const SectionTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.heading};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const SectionDesc = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
  margin: 0;
`;

const PeriodGroup = styled.div`
  display: flex;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
`;

const PeriodButton = styled.button`
  padding: 5px ${({ theme }) => theme.spacing.lg};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ $active, theme }) =>
    $active ? '#ffffff' : theme.colors.textSecondary};
  background: ${({ $active, theme }) =>
    $active ? theme.colors.primary : 'transparent'};
  transition: all ${({ theme }) => theme.transitions.fast};
  white-space: nowrap;

  & + & {
    border-left: 1px solid ${({ theme }) => theme.colors.border};
  }

  &:hover {
    background: ${({ $active, theme }) =>
      $active ? theme.colors.primaryHover : theme.colors.bgHover};
  }
`;

const SectionLabel = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textMuted};
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const ErrorMsg = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.error};
  background: ${({ theme }) => theme.colors.errorBg};
  border: 1px solid #fecaca;
  border-radius: 6px;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
`;

const ChartGrid2 = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
`;

const ChartCard = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.layout.cardRadius};
  padding: ${({ theme }) => theme.spacing.xl};
  box-shadow: ${({ theme }) => theme.shadows.card};
`;

const ChartTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.heading};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const ChartTitleRow = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const ChartTitleSmall = styled.h4`
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

const ChartBody = styled.div`
  min-height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LoadingMsg = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
`;

/* ── 커스텀 Tooltip ── */
const TooltipBox = styled.div`
  background: #ffffff;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  min-width: 180px;
`;

const TooltipDate = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const TooltipRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.xs};
`;

const TooltipDot = styled.span`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
`;

const TooltipLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.textSecondary};
  flex: 1;
`;

const TooltipValue = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.textPrimary};
`;
