import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RegisterForm } from '@/features/auth';
import { AuthShell } from '@/widgets/auth-shell';

export function RegisterPage() {
  const { t } = useTranslation();
  return (
    <AuthShell
      title={t('auth.joinPulse')}
      footer={
        <>
          {t('auth.hasAccount')}{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            {t('auth.signIn')}
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
