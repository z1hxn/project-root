import Link from 'next/link';
import { ArrowLeft, UsersRound } from 'lucide-react';
import { currentUser } from '@/server/auth';
import { SiteHeader } from '@/components/ui/SiteHeader';

export default async function Community() {
  const user = await currentUser();
  return <main className="public-shell community-page">
    <SiteHeader user={user} />
    <section className="community-content">
      <div className="community-icon"><UsersRound size={31} strokeWidth={1.5} /></div>
      <span className="section-kicker">커뮤니티</span>
      <h1>함께 이야기할 공간을<br />준비하고 있습니다.</h1>
      <p>사건을 풀면서 발견한 단서와 생각을 나눌 수 있도록 준비 중입니다. 지금은 워크스테이션에서 첫 조사를 시작해 보세요.</p>
      <span className="coming-soon">준비 중</span>
      <div className="community-actions"><Link className="public-button primary-action" href="/game">워크스테이션 열기</Link><Link className="public-button quiet-action" href="/"><ArrowLeft size={16} /> 홈으로</Link></div>
    </section>
    <footer className="public-footer"><span>PROJECT ROOT</span><span>커뮤니티는 곧 열립니다.</span></footer>
  </main>;
}
