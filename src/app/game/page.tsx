import { redirect } from 'next/navigation';
import { currentUser, publicProfile } from '@/server/auth';
import { Workstation } from '@/features/onboarding/Workstation';
export default async function Page() {
  const user = await currentUser();
  if (!user) redirect('/');
  return <Workstation initialProfile={publicProfile(user)} />;
}
