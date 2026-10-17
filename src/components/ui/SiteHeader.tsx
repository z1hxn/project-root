import Link from 'next/link';
import { ArrowRight, RotateCcw, UserRound } from 'lucide-react';
import type { User } from '@prisma/client';
import { Brand } from './Brand';
import { authPath } from '@/lib/return-path';
import { SiteLogout } from './SiteLogout';

export function SiteHeader({ user }: { user: User | null }) {
  return <header className="public-header">
    <Link className="public-logo" href="/" aria-label="PROJECT ROOT 홈"><Brand /></Link>
    <nav className="public-nav" aria-label="주 메뉴">
      <Link href="/">홈</Link>
      <Link href="/game">워크스테이션</Link>
      <Link href="/community">커뮤니티</Link>
    </nav>
    <div className="public-account">
      {user ? <details className="account-menu">
        <summary><UserRound size={17} /><span>{user.displayName}</span></summary>
        <div className="account-dropdown">
          <Link href="/game">워크스테이션 <ArrowRight size={15} /></Link>
          {user.introCompleted && <Link href="/intro?replay=1">인트로 다시 보기 <RotateCcw size={15} /></Link>}
          <SiteLogout />
        </div>
      </details> : <>
        <Link className="public-login" href={authPath('login')}>로그인</Link>
        <Link className="public-signup" href={authPath('register')}>회원가입 <ArrowRight size={15} /></Link>
      </>}
    </div>
  </header>;
}
