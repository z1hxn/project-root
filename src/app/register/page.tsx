import { redirect } from 'next/navigation';
import { currentUser } from '@/server/auth';
import { AuthForm } from '@/features/auth/AuthForm';
export default async function Page() {
  if (await currentUser()) redirect('/game');
  return <AuthForm mode="register" />;
}
