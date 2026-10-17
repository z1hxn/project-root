import { redirect } from 'next/navigation';
import { currentUser } from '@/server/auth';
import { Intro } from '@/features/intro/Intro';
export default async function Page({ searchParams }: PageProps<'/intro'>) {
  const user = await currentUser();
  if (!user) redirect('/login?next=%2Fgame');
  const replay = (await searchParams).replay === '1' && user.introCompleted;
  if (user.introCompleted && !replay) redirect('/game');
  return <Intro displayName={user.displayName} replay={replay} />;
}
