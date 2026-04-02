/**
 * 매출 분석 탭 컴포넌트.
 *
 * 구성:
 * 1. 기간 선택 버튼 그룹 (7d / 30d / 90d)
 * 2. KPI 카드 3개 (월매출, MRR, ARPU)
 * 3. 일별 매출 차트 (Recharts BarChart)
 * 4. 구독 현황 (활성 구독 수 카드 + 이탈률 카드 + 플랜별 분포 PieChart)
 *
 * 데이터 패칭:
 * - Promise.allSettled로 매출 + 구독 현황 병렬 호출
 * - 기간 변경 시 매출 API만 재호출 (구독 현황은 기간 무관)
 *
 * @param {Object} props - 없음 (내부 상태 관리)
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
} from 'recharts';
import {
  MdAttachMoney,
  MdTrendingUp,
  MdPerson,
  MdSubscriptions,
  MdExitToApp,
} from 'react-icons/md';
import StatsCard from '@/shared/components/StatsCard';
import { fetchRevenue, fetchSubscription } from '../api/statsApi';

/** 기간 선택 옵션 */
const PERIOD_OPTIONS = [
  { value: '7d',  label: '7일' },
  { value: '30d', label: '30일' },
  { value: '90d', label: '90일' },
];

/** 플랜별 분포 파이차트 색상 */
const PLAN_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

/**
 * 금액을 한국어 단위로 포맷.
 * 1000000 → "100만원", 285000000 → "2.9억원"
 *
 * @param {number|null|undefined} amount
 * @returns {string}
 */
function fmtAmount(amount) {
  if (amount === null || amount === undefined) return '-';
  const n = Number(amount);
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억원`;
  if (n >= 10_000) return `${Math.floor(n / 10_000)}만원`;
  return `${n.toLocaleString()}원`;
}

/**
 * Y축 눈금 금액 포맷 (짧은 버전).
 * 1000000 → "100만", 500000 → "50만"
 *
 * @param {number} v
 * @returns {string}
 */
function fmtAxis(v) {
  if (v >= 100_000_000) return `${(v / 100_000_000).toFixed(0)}억`;
  if (v >= 10_000) return `${Math.floor(v / 10_000)}만`;
  return String(v);
}

/**
 * 퍼센트 포맷. 0.0523 → "5.2%"
 *
 * @param {number|null|undefined} val
 * @returns {string}
 */
function fmtPct(val) {
  if (val === null || val === undefined) return '-';
  return `${(Number(val) * 100).toFixed(1)}%`;
}

/**
 * 숫자 천 단위 포맷.
 *
 * @param {number|null|undefined} val
 * @returns {string}
 */
function fmt(val) {
  if (val === null || val === undefined) return '-';
  return Number(val).toLocaleString();
}

/**
 * 커스텀 Tooltip (일별 매출 차트용).
 */
function RevenueTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <TooltipBox>
      <TooltipDate>{label}</TooltipDate>
      {payload.map((entry) => (
        <TooltipRow key={entry.dataKey}>
          <TooltipDot style={{ background: entry.color }} />
          <TooltipLabel>{entry.name}</TooltipLabel>
          <TooltipValue>{fmtAmount(entry.value)}</TooltipValue>
        </TooltipRow>
      ))}
    </TooltipBox>
  );
}

/**
 * PieChart 커스텀 레이블.
 * 플랜명과 비율을 호 바깥에 표시.
 */
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

export default function RevenueTab() {
  /** 현재 선택된 기간 */
  const [period, setPeriod] = useState('30d');

  /** 매출 데이터 상태 */
  const [revenue, setRevenue] = useState(null);
  const [revenueLoading, setRevenueLoading] = useState(true);
  const [revenueError, setRevenueError] = useState(null);

  /** 구독 현황 상태 */
  const [subscription, setSubscription] = useState(null);
  const [subLoading, setSubLoading] = useState(true);
  const [subError, setSubError] = useState(null);

  /**
   * 최초 마운트: 매출 + 구독 현황 병렬 호출.
   * 구독 현황은 기간 무관이므로 한 번만 호출.
   */
  const loadAll = useCallback(async (p) => {
    setRevenueLoading(true);
    setSubLoading(true);
    setRevenueError(null);
    setSubError(null);

    const [revenueResult, subResult] = await Promise.allSettled([
      fetchRevenue({ period: p }),
      fetchSubscription(),
    ]);

    /* 매출 처리 */
    if (revenueResult.status === 'fulfilled') {
      setRevenue(revenueResult.value);
    } else {
      setRevenueError(
        revenueResult.reason?.message ?? '매출 데이터를 불러올 수 없습니다.',
      );
    }
    setRevenueLoading(false);

    /* 구독 처리 */
    if (subResult.status === 'fulfilled') {
      setSubscription(subResult.value);
    } else {
      setSubError(subResult.reason?.message ?? '구독 현황을 불러올 수 없습니다.');
    }
    setSubLoading(false);
  }, []);

  /**
   * 기간 변경 시 매출 API만 재호출.
   * 구독 현황은 기간과 무관하므로 유지.
   *
   * @param {string} p - 새 기간 값
   */
  const loadRevenue = useCallback(async (p) => {
    setRevenueLoading(true);
    setRevenueError(null);
    try {
      const data = await fetchRevenue({ period: p });
      setRevenue(data);
    } catch (err) {
      setRevenueError(err?.message ?? '매출 데이터를 불러올 수 없습니다.');
    } finally {
      setRevenueLoading(false);
    }
  }, []);

  /* 최초 마운트 시 전체 로드 */
  useEffect(() => {
    loadAll(period);
  }, [loadAll]); // eslint-disable-line react-hooks/exhaustive-deps
  /* period는 loadAll 초기값으로만 사용, 이후 변경은 handlePeriodChange에서 처리 */

  /**
   * 기간 선택 변경 핸들러.
   *
   * @param {string} p - 새 기간
   */
  function handlePeriodChange(p) {
    setPeriod(p);
    loadRevenue(p);
  }

  /* 매출 데이터 안전 접근 */
  const r = revenue ?? {};
  const dailyRevenue = Array.isArray(r.dailyRevenue) ? r.dailyRevenue : [];

  /* 구독 현황 안전 접근 */
  const s = subscription ?? {};
  const planDist = Array.isArray(s.planDistribution) ? s.planDistribution : [];

  /** 매출 KPI 카드 정의 */
  const revenueCards = [
    {
      key: 'monthlyRevenue',
      icon: <MdAttachMoney size={18} />,
      title: '월 매출',
      value: revenueLoading ? '...' : fmtAmount(r.monthlyRevenue),
      subtitle: '이번 달 총 매출',
      status: 'success',
    },
    {
      key: 'mrr',
      icon: <MdTrendingUp size={18} />,
      title: 'MRR',
      value: revenueLoading ? '...' : fmtAmount(r.mrr),
      subtitle: '월간 반복 매출',
      status: 'info',
    },
    {
      key: 'arpu',
      icon: <MdPerson size={18} />,
      title: 'ARPU',
      value: revenueLoading ? '...' : fmtAmount(r.arpu),
      subtitle: '사용자 1인당 평균 매출',
      status: 'info',
    },
  ];

  /** 구독 현황 카드 정의 */
  const subCards = [
    {
      key: 'activeSubs',
      icon: <MdSubscriptions size={18} />,
      title: '활성 구독',
      value: subLoading ? '...' : fmt(s.activeSubscriptions),
      subtitle: '현재 구독 중인 사용자 수',
      status: 'success',
    },
    {
      key: 'churnRate',
      icon: <MdExitToApp size={18} />,
      title: '이탈률',
      value: subLoading ? '...' : fmtPct(s.churnRate),
      subtitle: '구독 취소 비율',
      /* 이탈률 5% 초과 시 warning */
      status: subLoading
        ? 'info'
        : (s.churnRate ?? 0) > 0.05
          ? 'warning'
          : 'success',
    },
  ];

  return (
    <Wrapper>
      {/* ── 기간 선택 ── */}
      <FilterRow>
        <FilterLabel>집계 기간</FilterLabel>
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
      </FilterRow>

      {/* ── 매출 KPI 카드 ── */}
      <SectionLabel>매출 지표</SectionLabel>
      {revenueError && <ErrorMsg>{revenueError}</ErrorMsg>}
      <KpiGrid>
        {revenueCards.map((card) => (
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

      {/* ── 일별 매출 차트 ── */}
      <SectionLabel style={{ marginTop: '32px' }}>일별 매출 추이</SectionLabel>
      <ChartCard>
        <ChartTitle>일별 매출</ChartTitle>
        <ChartBody>
          {revenueLoading ? (
            <LoadingMsg>차트 데이터를 불러오는 중...</LoadingMsg>
          ) : dailyRevenue.length === 0 ? (
            <LoadingMsg>표시할 매출 데이터가 없습니다.</LoadingMsg>
          ) : (
            /*
             * BarChart: X축=날짜, Y축=금액(원).
             * 금액 단위가 크므로 Y축은 만원 단위로 포맷.
             */
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={dailyRevenue}
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
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={fmtAxis}
                />
                <Tooltip content={<RevenueTooltip />} />
                <Bar
                  dataKey="amount"
                  name="매출"
                  fill="#6366f1"
                  radius={[3, 3, 0, 0]}
                  /* 기간에 따라 bar 너비 조정 */
                  barSize={period === '7d' ? 32 : period === '30d' ? 14 : 8}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartBody>
      </ChartCard>

      {/* ── 구독 현황 ── */}
      <SectionLabel style={{ marginTop: '32px' }}>구독 현황</SectionLabel>
      {subError && <ErrorMsg>{subError}</ErrorMsg>}

      {/* 구독 KPI 카드 */}
      <SubKpiGrid>
        {subCards.map((card) => (
          <StatsCard
            key={card.key}
            icon={card.icon}
            title={card.title}
            value={card.value}
            subtitle={card.subtitle}
            status={card.status}
          />
        ))}
      </SubKpiGrid>

      {/* 플랜별 분포 PieChart */}
      <ChartCard style={{ marginTop: '16px' }}>
        <ChartTitle>플랜별 구독 분포</ChartTitle>
        <ChartBody>
          {subLoading ? (
            <LoadingMsg>구독 현황을 불러오는 중...</LoadingMsg>
          ) : planDist.length === 0 ? (
            <LoadingMsg>표시할 구독 분포 데이터가 없습니다.</LoadingMsg>
          ) : (
            /*
             * PieChart: 각 플랜의 구독자 비율을 파이 조각으로 표시.
             * 바깥 레이블로 플랜명 + 비율 표기.
             * Legend로 색상-플랜 매핑 추가 표시.
             */
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={planDist}
                  dataKey="count"
                  nameKey="plan"
                  cx="50%"
                  cy="50%"
                  outerRadius={110}
                  /* 커스텀 레이블 함수에 ratio 전달 */
                  label={(props) =>
                    PieLabel({ ...props, ratio: props.payload?.ratio })
                  }
                  labelLine={true}
                >
                  {planDist.map((_, idx) => (
                    <Cell
                      key={`cell-${idx}`}
                      fill={PLAN_COLORS[idx % PLAN_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [
                    `${fmt(value)}명`,
                    name,
                  ]}
                  contentStyle={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '13px',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '13px', paddingTop: '8px' }}
                  formatter={(value) => value}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartBody>
      </ChartCard>
    </Wrapper>
  );
}

/* ── styled-components ── */

const Wrapper = styled.div``;

const FilterRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
`;

const FilterLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const PeriodGroup = styled.div`
  display: flex;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  overflow: hidden;
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

/** 매출 KPI 카드 그리드 — 3열 */
const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
`;

/** 구독 현황 카드 그리드 — 2열 */
const SubKpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
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

const ChartBody = styled.div`
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LoadingMsg = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textMuted};
  text-align: center;
`;

/* ── 커스텀 Tooltip 스타일 ── */

const TooltipBox = styled.div`
  background: #ffffff;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 6px;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  box-shadow: ${({ theme }) => theme.shadows.lg};
  min-width: 160px;
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
