import { redirect } from 'next/navigation';
import { currentUser, publicProfile } from '@/server/auth';
import { Workstation } from '@/features/onboarding/Workstation';
export default async function Page() {
  const user = await currentUser();
  if (!user) redirect('/login?next=%2Fgame');
  if (!user.introCompleted) redirect('/intro');
  return <Workstation initialProfile={publicProfile(user)} />;
}
