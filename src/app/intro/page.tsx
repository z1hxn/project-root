import { redirect } from 'next/navigation';
import { currentUser } from '@/server/auth';
import { Intro } from '@/features/intro/Intro';
export default async function Page() {
  if (await currentUser()) redirect('/game');
  return <Intro />;
}
