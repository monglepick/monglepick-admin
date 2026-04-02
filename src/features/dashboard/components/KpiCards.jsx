/**
 * KPI 카드 그리드 컴포넌트.
 *
 * 6개 핵심 지표를 StatsCard로 표시.
 * - 전체 회원 수
 * - 오늘 신규 가입 (어제 대비 증감률)
 * - 활성 구독
 * - 오늘 결제액 (어제 대비 증감률)
 * - 미처리 신고 (있을 경우 error 강조)
 * - AI 채팅 수
 *
 * @param {Object} props
 * @param {Object|null} props.data  - fetchKpi() 응답 데이터
 * @param {boolean}     props.loading - 로딩 여부
 */

import styled from 'styled-components';
import {
  MdPeople,
  MdPersonAdd,
  MdSubscriptions,
  MdAttachMoney,
  MdReport,
  MdChat,
} from 'react-icons/md';
import StatsCard from '@/shared/components/StatsCard';

/**
 * 어제 대비 증감률 계산.
 *
 * @param {number} today     - 오늘 값
 * @param {number} yesterday - 어제 값
 * @returns {{ text: string, status: 'success'|'error'|'info' }}
 */
function calcChangeRate(today, yesterday) {
  /* 어제 값이 없거나 0이면 비교 불가 */
  if (!yesterday || yesterday === 0) {
    return { text: '전일 데이터 없음', status: 'info' };
  }
  const diff = today - yesterday;
  const rate = ((diff / yesterday) * 100).toFixed(1);

  if (diff > 0) {
    return { text: `어제 대비 ↑${rate}%`, status: 'success' };
  }
  if (diff < 0) {
    return { text: `어제 대비 ↓${Math.abs(rate)}%`, status: 'error' };
  }
  return { text: '어제와 동일', status: 'info' };
}

/**
 * 숫자를 한국어 금액 단위로 포맷.
 * 1000000 → "100만원", 2850000 → "285만원"
 *
 * @param {number} amount - 금액 (원)
 * @returns {string}
 */
function formatAmount(amount) {
  if (!amount && amount !== 0) return '-';
  if (amount >= 100_000_000) {
    return `${(amount / 100_000_000).toFixed(1)}억원`;
  }
  if (amount >= 10_000) {
    return `${Math.floor(amount / 10_000)}만원`;
  }
  return `${amount.toLocaleString()}원`;
}

/**
 * 숫자를 읽기 쉬운 포맷으로 변환.
 * 15420 → "15,420"
 *
 * @param {number|undefined} val
 * @returns {string}
 */
function fmt(val) {
  if (val === null || val === undefined) return '-';
  return Number(val).toLocaleString();
}

export default function KpiCards({ data, loading }) {
  /* 로딩 중이면 placeholder 텍스트로 표시 */
  const d = data ?? {};

  /* 신규 가입 증감 */
  const newUserChange = calcChangeRate(d.todayNewUsers ?? 0, d.yesterdayNewUsers ?? 0);
  /* 결제액 증감 */
  const paymentChange = calcChangeRate(
    d.todayPaymentAmount ?? 0,
    d.yesterdayPaymentAmount ?? 0,
  );

  /** KPI 카드 정의 배열 */
  const cards = [
    {
      key: 'totalUsers',
      icon: <MdPeople size={18} />,
      title: '전체 회원',
      value: loading ? '...' : fmt(d.totalUsers),
      subtitle: '누적 가입자 수',
      status: 'info',
    },
    {
      key: 'todayNewUsers',
      icon: <MdPersonAdd size={18} />,
      title: '오늘 신규 가입',
      value: loading ? '...' : fmt(d.todayNewUsers),
      subtitle: loading ? '' : newUserChange.text,
      status: loading ? 'info' : newUserChange.status,
    },
    {
      key: 'activeSubscriptions',
      icon: <MdSubscriptions size={18} />,
      title: '활성 구독',
      value: loading ? '...' : fmt(d.activeSubscriptions),
      subtitle: '현재 구독 중인 사용자',
      status: 'success',
    },
    {
      key: 'todayPayment',
      icon: <MdAttachMoney size={18} />,
      title: '오늘 결제액',
      value: loading ? '...' : formatAmount(d.todayPaymentAmount),
      subtitle: loading ? '' : paymentChange.text,
      status: loading ? 'info' : paymentChange.status,
    },
    {
      key: 'pendingReports',
      icon: <MdReport size={18} />,
      title: '미처리 신고',
      value: loading ? '...' : fmt(d.pendingReports),
      subtitle: (d.pendingReports ?? 0) > 0 ? '즉시 처리 필요' : '처리 대기 없음',
      /* 미처리 신고가 1건 이상이면 error(빨간색) 강조 */
      status: loading ? 'info' : (d.pendingReports ?? 0) > 0 ? 'error' : 'success',
    },
    {
      key: 'todayAiChats',
      icon: <MdChat size={18} />,
      title: '오늘 AI 채팅',
      value: loading ? '...' : fmt(d.todayAiChats),
      subtitle: '금일 AI 추천 요청 수',
      status: 'info',
    },
  ];

  return (
    <Grid>
      {cards.map((card) => (
        <StatsCard
          key={card.key}
          icon={card.icon}
          title={card.title}
          value={card.value}
          subtitle={card.subtitle}
          status={card.status}
        />
      ))}
    </Grid>
  );
}

/* ── styled-components ── */

/**
 * KPI 카드 그리드.
 * minmax(240px, 1fr)로 화면 크기에 따라 열 수를 자동 조정.
 * - 1400px+: 6열
 * - 960px+:  3열
 * - 640px+:  2열
 * - ~640px:  1열
 */
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: ${({ theme }) => theme.spacing.lg};
`;
