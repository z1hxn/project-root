'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, LoaderCircle, ShieldCheck } from 'lucide-react';
import { Brand } from '@/components/ui/Brand';
import { registrationSchema, loginSchema } from '@/lib/validation';
import { api } from '@/lib/api';
export function AuthForm({ mode }: { mode: 'register' | 'login' }) {
  const register = mode === 'register';
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const parsed = (register ? registrationSchema : loginSchema).safeParse(data);
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
      router.replace('/game');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '연결을 확인해 주세요.');
      setBusy(false);
    }
  }
  const fields = register
    ? [
        {
          name: 'username',
          label: 'Username',
          type: 'text',
          autocomplete: 'username',
          placeholder: 'your_identity',
          hint: '영문 소문자, 숫자, 밑줄 · 3–20자',
        },
        {
          name: 'email',
          label: 'Email',
          type: 'email',
          autocomplete: 'email',
          placeholder: 'you@example.com',
        },
        {
          name: 'password',
          label: 'Password',
          type: 'password',
          autocomplete: 'new-password',
          placeholder: '10자 이상',
        },
        {
          name: 'confirmPassword',
          label: 'Confirm password',
          type: 'password',
          autocomplete: 'new-password',
          placeholder: '비밀번호 다시 입력',
        },
      ]
    : [
        {
          name: 'username',
          label: 'Username or email',
          type: 'text',
          autocomplete: 'username',
          placeholder: 'your_identity',
        },
        {
          name: 'password',
          label: 'Password',
          type: 'password',
          autocomplete: 'current-password',
          placeholder: '비밀번호',
        },
      ];
  return (
    <main className="auth-screen">
      <header className="site-header">
        <Link href="/">
          <Brand />
        </Link>
        <span className="eyebrow subtle">WORKSTATION ACCESS</span>
      </header>
      <div className="auth-layout">
        <aside className="auth-aside">
          <span className="eyebrow">
            {register ? 'YOUR NEXT CHAPTER' : 'BACK TO THE WORKSPACE'}
          </span>
          <h1>
            {register ? (
              <>
                A new identity.
                <br />A different
                <br />
                <em>perspective.</em>
              </>
            ) : (
              <>
                The traces
                <br />
                are still
                <br />
                <em>waiting.</em>
              </>
            )}
          </h1>
          <p>
            {register
              ? '하나의 계정으로 시작되는 당신의 조사 환경.\n이 이름은 워크스테이션에서도 사용됩니다.'
              : '당신의 워크스테이션으로 돌아오세요.\n저장된 환경이 기다리고 있습니다.'}
          </p>
          <div className="aside-caption">
            <ShieldCheck size={18} />
            <span>
              PROJECT ROOT
              <br />
              <small>INVESTIGATION WORKSPACE</small>
            </span>
          </div>
        </aside>
        <section className="auth-panel">
          <span className="eyebrow subtle">
            {register ? '01 / IDENTITY' : 'IDENTITY VERIFICATION'}
          </span>
          <h2>{register ? '계정 생성' : '다시 오셨군요.'}</h2>
          <p>
            {register
              ? '첫 번째 워크스테이션을 준비합니다.'
              : '계정 정보로 워크스테이션에 연결하세요.'}
          </p>
          <form onSubmit={submit} noValidate>
            {fields.map((field) => (
              <div className="form-field" key={field.name}>
                <label htmlFor={field.name}>{field.label}</label>
                <input
                  id={field.name}
                  name={field.name}
                  type={field.type}
                  autoComplete={field.autocomplete}
                  placeholder={field.placeholder}
                  aria-invalid={!!errors[field.name]}
                  aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
                  disabled={busy}
                  maxLength={field.type === 'password' ? 128 : 254}
                />
                {errors[field.name] ? (
                  <span id={`${field.name}-error`} className="field-error">
                    {errors[field.name]}
                  </span>
                ) : (
                  'hint' in field && <small>{field.hint}</small>
                )}
              </div>
            ))}
            {error && (
              <p className="error-banner" role="alert">
                {error}
              </p>
            )}
            <button disabled={busy} className="button primary full-width" type="submit">
              {busy ? (
                <>
                  <LoaderCircle className="spin" size={18} /> 연결 중...
                </>
              ) : (
                <>
                  {register ? '계정 생성 및 시작' : '워크스테이션 연결'}
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>
          <p className="auth-switch">
            {register ? '이미 계정이 있나요?' : '아직 계정이 없나요?'}{' '}
            <Link href={register ? '/login' : '/register'}>
              {register ? '로그인' : '계정 생성'}
            </Link>
          </p>
        </section>
      </div>
      <footer className="site-footer">
        <span>PROJECT ROOT / IDENTITY SERVICE</span>
        <span>
          <span className="status-dot" /> SECURE WORKSPACE
        </span>
      </footer>
    </main>
  );
}
