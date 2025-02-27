import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useAuth } from '@novu/shared-web';
import { LoginForm } from './components/LoginForm';
import AuthContainer from '../../components/layout/components/AuthContainer';
import { useVercelIntegration, useBlueprint, useVercelParams } from '../../hooks';
import SetupLoader from './components/SetupLoader';
import { useSegment } from '../../components/providers/SegmentProvider';
import { useAcceptInvite } from './components/useAcceptInvite';
import { ROUTES } from '../../constants/routes.enum';

export default function LoginPage() {
  useBlueprint();
  const { login, token: oldToken, currentUser } = useAuth();
  const segment = useSegment();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const queryToken = params.get('token');
  const invitationToken = params.get('invitationToken');
  const source = params.get('source');
  const sourceWidget = params.get('source_widget');
  const token = queryToken ?? oldToken;

  const { startVercelSetup, isLoading } = useVercelIntegration();
  const { code, isFromVercel, next } = useVercelParams();
  const { isLoading: isLoadingAcceptInvite, submitToken } = useAcceptInvite();

  useEffect(() => {
    if (token) {
      if (!invitationToken && currentUser?._id && (!currentUser?.organizationId || !currentUser?.environmentId)) {
        const authApplicationLink = isFromVercel
          ? `${ROUTES.AUTH_APPLICATION}?code=${code}&next=${next}`
          : ROUTES.AUTH_APPLICATION;
        login(token);
        navigate(authApplicationLink);

        return;
      }

      if (isFromVercel) {
        login(token);
        startVercelSetup();

        return;
      }

      if (source === 'cli') {
        segment.track('Dashboard Visit', {
          widget: sourceWidget || 'unknown',
          source: 'cli',
        });
        login(token);
        navigate(ROUTES.GET_STARTED);

        return;
      }

      if (invitationToken) {
        submitToken(token, invitationToken);

        return;
      }

      login(token);
      navigate('/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return isLoading || isLoadingAcceptInvite ? (
    <SetupLoader title="Loading..." />
  ) : (
    <AuthContainer title="Sign In" description="Welcome back! Sign in with the data you entered in your registration">
      <LoginForm />
    </AuthContainer>
  );
}
