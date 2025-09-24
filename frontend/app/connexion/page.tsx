// app/connexion/page.tsx
import LoginPage from '@/components/Auth/loginPage';

export const metadata = {
  title: 'Connexion - LABTIM',
  description: 'Page de connexion pour accéder à votre compte LABTIM.',
};

export default function ConnexionPage() {
    
  return <LoginPage  />;
}
