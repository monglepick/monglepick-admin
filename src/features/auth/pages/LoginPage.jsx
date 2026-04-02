/**
 * 관리자 로그인 페이지.
 * 일반 로그인 폼 (이메일 + 비밀번호) → ADMIN 역할 검증.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { backendApi } from '@/shared/api/axiosInstance';
import { AUTH_ENDPOINTS } from '@/shared/constants/api';
import { ADMIN_ROUTES } from '@/shared/constants/routes';
import useAuthStore from '@/shared/stores/useAuthStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /** 로그인 폼 제출 */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      /* /api/v1/admin/auth/login — 백엔드에서 ADMIN role 검증 (일반 유저 403 차단) */
      const data = await backendApi.post(AUTH_ENDPOINTS.LOGIN, { email, password });

      /* Zustand + localStorage 저장 */
      login({ accessToken: data.accessToken, user: data.user });
      navigate(ADMIN_ROUTES.DASHBOARD, { replace: true });
    } catch (err) {
      setError(err.message || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Wrapper>
      <Card>
        <Logo>몽글픽</Logo>
        <SubTitle>관리자 로그인</SubTitle>

        <Form onSubmit={handleSubmit}>
          <Input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
          <Input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <ErrorMsg>{error}</ErrorMsg>}
          <SubmitButton type="submit" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </SubmitButton>
        </Form>
      </Card>
    </Wrapper>
  );
}

/* ── styled-components ── */

const Wrapper = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.bgMain};
`;

const Card = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  padding: 48px 40px;
  border-radius: 12px;
  box-shadow: ${({ theme }) => theme.shadows.lg};
  width: 100%;
  max-width: 400px;
  text-align: center;
`;

const Logo = styled.h1`
  font-size: 28px;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  color: ${({ theme }) => theme.colors.primary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const SubTitle = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: ${({ theme }) => theme.spacing.xxl};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const Input = styled.input`
  padding: 12px 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  font-size: ${({ theme }) => theme.fontSizes.md};
  outline: none;
  transition: border-color ${({ theme }) => theme.transitions.fast};

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const ErrorMsg = styled.p`
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-align: left;
`;

const SubmitButton = styled.button`
  padding: 12px;
  background: ${({ theme }) => theme.colors.primary};
  color: #fff;
  border-radius: 8px;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  transition: background ${({ theme }) => theme.transitions.fast};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.primaryHover};
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
