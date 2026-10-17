import { redirect } from 'next/navigation';
import { currentUser } from '@/server/auth';
import { AuthForm } from '@/features/auth/AuthForm';
import { safeReturnPath } from '@/lib/return-path';
export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const next = safeReturnPath((await searchParams).next, '/game');
  if (await currentUser()) redirect(next);
  return <AuthForm mode="login" next={next} />;
}
