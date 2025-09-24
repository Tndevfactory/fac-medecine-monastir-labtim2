// app/sign-up/page.tsx
import SignupPage from '@/components/Auth/signupPage'

export const metadata = {
  title: 'Inscription - LABTIM',
  description: 'Page d insription compte admin pour accéder à votre compte LABTIM.',
};

export default function signupPage() {
    
  return <SignupPage  />;
}
