import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LoginForm } from '@/features/auth';
import { AuthShell } from '@/widgets/auth-shell';

export function LoginPage() {
  const { t } = useTranslation();
  return (
    <AuthShell
      title={t('auth.welcomeBack')}
      footer={
        <>
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="font-medium text-primary hover:underline">
            {t('auth.signUp')}
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
