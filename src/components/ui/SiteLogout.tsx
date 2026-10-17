'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export function SiteLogout() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return <>
    <button type="button" disabled={busy} onClick={async () => {
      setBusy(true);
      try {
        await api('/api/auth/logout', 'POST');
        router.replace('/');
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : '로그아웃하지 못했습니다.');
        setBusy(false);
      }
    }}>{busy ? '로그아웃 중…' : '로그아웃'}</button>
    {error && <small role="alert">{error}</small>}
  </>;
}
