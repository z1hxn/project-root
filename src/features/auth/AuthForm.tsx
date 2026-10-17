'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, LoaderCircle, LockKeyhole, Mail } from 'lucide-react';
import { SiteHeader } from '@/components/ui/SiteHeader';
import { registrationSchema, loginSchema } from '@/lib/validation';
import { authPath } from '@/lib/return-path';
import { api } from '@/lib/api';

export function AuthForm({ mode, next }: { mode: 'register' | 'login'; next: string }) {
  const register = mode === 'register';
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const form = e.currentTarget;
    const parsed = (register ? registrationSchema : loginSchema).safeParse(Object.fromEntries(new FormData(form)));
    setError('');
    setErrors({});
    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) fields[String(issue.path[0])] ??= issue.message;
      setErrors(fields);
      (form.elements.namedItem(Object.keys(fields)[0]) as HTMLInputElement)?.focus();
      return;
    }
    setBusy(true);
    try {
      await api(`/api/auth/${mode}`, 'POST', parsed.data);
      form.reset();
      window.location.assign(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : '연결을 확인해 주세요.');
      setBusy(false);
    }
  }
  const fields = register ? [
    { name: 'username', label: '사용자명', type: 'text', autocomplete: 'username', placeholder: '영문 소문자로 시작하는 이름', hint: '영문 소문자, 숫자, 밑줄 · 3–20자' },
    { name: 'email', label: '이메일', type: 'email', autocomplete: 'email', placeholder: 'you@example.com' },
    { name: 'password', label: '비밀번호', type: 'password', autocomplete: 'new-password', placeholder: '10자 이상' },
    { name: 'confirmPassword', label: '비밀번호 확인', type: 'password', autocomplete: 'new-password', placeholder: '비밀번호 다시 입력' },
  ] : [
    { name: 'username', label: '사용자명 또는 이메일', type: 'text', autocomplete: 'username', placeholder: '사용자명 또는 이메일' },
    { name: 'password', label: '비밀번호', type: 'password', autocomplete: 'current-password', placeholder: '비밀번호' },
  ];
  return <main className="public-shell auth-page">
    <SiteHeader user={null} />
    <div className="auth-new-layout">
      <aside className="auth-new-aside">
        <span className="section-kicker">PROJECT ROOT 계정</span>
        <h1>{register ? <>조사의 시작을<br /><em>준비하세요.</em></> : <>다시 단서로<br /><em>돌아가세요.</em></>}</h1>
        <p>{register ? '한 계정으로 조사 기록과 워크스테이션을 이어 갑니다. 첫 접속에서는 사건의 시작을 안내합니다.' : '저장된 조사 환경과 사건 기록이 기다리고 있습니다. 로그인 후 이어서 플레이할 수 있습니다.'}</p>
        <div className="auth-context"><span><Mail size={17} /> 사건 요청 읽기</span><span><LockKeyhole size={17} /> 조사 기록 보관</span></div>
      </aside>
      <section className="auth-new-panel" aria-labelledby="auth-title">
        <span className="section-kicker">{register ? '새 계정 만들기' : '계정으로 계속하기'}</span>
        <h2 id="auth-title">{register ? '회원가입' : '로그인'}</h2>
        <p>PROJECT ROOT 계정으로 안전하게 시작하세요.</p>
        <form onSubmit={submit} noValidate>
          {fields.map((field) => <div className="auth-new-field" key={field.name}>
            <label htmlFor={field.name}>{field.label}</label>
            <input id={field.name} name={field.name} type={field.type} autoComplete={field.autocomplete} placeholder={field.placeholder} aria-invalid={!!errors[field.name]} aria-describedby={errors[field.name] ? `${field.name}-error` : undefined} disabled={busy} maxLength={field.type === 'password' ? 128 : 254} />
            {errors[field.name] ? <small id={`${field.name}-error`} className="field-error">{errors[field.name]}</small> : 'hint' in field && <small>{field.hint}</small>}
          </div>)}
          {error && <p className="auth-new-error" role="alert">{error}</p>}
          <button disabled={busy} className="public-button primary-action auth-submit" type="submit">{busy ? <><LoaderCircle className="spin" size={18} /> 처리 중…</> : <>{register ? '계정 만들고 시작하기' : '로그인하고 계속하기'} <ArrowRight size={18} /></>}</button>
        </form>
        <p className="auth-new-switch">{register ? '이미 계정이 있나요?' : '아직 계정이 없나요?'} <Link href={authPath(register ? 'login' : 'register', next)}>{register ? '로그인' : '회원가입'}</Link></p>
      </section>
    </div>
    <footer className="public-footer"><span>PROJECT ROOT</span><span>한 계정으로, 이어지는 조사.</span></footer>
  </main>;
}
