'use client';
import { Brand } from '@/components/ui/Brand';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="boot-screen">
      <section className="setup-panel">
        <Brand />
        <h1>연결을 완료하지 못했습니다.</h1>
        <p>잠시 후 다시 시도해 주세요.</p>
        <button className="button primary" style={{ marginTop: 24 }} onClick={reset}>
          다시 연결
        </button>
      </section>
    </main>
  );
}
