'use client';
import { useEffect, useState } from 'react';
import {
  Mail as MailIcon,
  Inbox,
  Send,
  FileEdit,
  Trash2,
  Archive,
  Reply,
  ReplyAll,
  ArrowRight,
  Search,
  ChevronDown,
  Star,
  Paperclip,
  Printer,
  RefreshCw,
  Folder,
  Plus,
  X,
} from 'lucide-react';
import { useWorkspace } from '@/features/workspace/context';
import { NativeMenuBar, NativeDialog, ToolButton } from '@/components/ui/Native';
interface Message {
  id: string;
  subject: string;
  from: string;
  to: string;
  body: string;
  folder: string;
  read: boolean;
  star: boolean;
  date: string;
}
export function Mail() {
  const { profile, notify: workspaceNotify } = useWorkspace();
  const notify = (message: string) => workspaceNotify(message, 'mail');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      subject: 'PROJECT ROOT에 오신 것을 환영합니다',
      from: 'Workspace Services <workspace@root.internal>',
      to: profile.email,
      body: `${profile.displayName}님, 환영합니다.\n\n워크스테이션 등록이 완료되었습니다.\n\n당신은 PROJECT ROOT의 새로운 조사관입니다. 공개된 웹 자료와 시스템에 남겨진 흔적을 조사하고, 발견한 정보들을 연결하는 일을 맡게 됩니다.\n\n먼저 Project Root 앱의 세계관 안내를 확인해 주세요. Firefox, Dolphin, Konsole을 자유롭게 둘러보며 업무 환경을 익힐 수 있습니다.\n\n첫 사건이 준비되면 이 메일함으로 연락드리겠습니다.\n\n감사합니다.\nWorkspace Services\nPROJECT ROOT`,
      folder: 'inbox',
      read: false,
      star: false,
      date: profile.createdAt,
    },
  ]);
  const [folder, setFolder] = useState('inbox');
  const [selected, setSelected] = useState('welcome');
  const [search, setSearch] = useState('');
  const [compose, setCompose] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(`root-mail:${profile.username}`) || 'null');
      if (
        Array.isArray(saved) &&
        saved.every((m) => typeof m.id === 'string' && typeof m.body === 'string')
      )
        setMessages(saved);
    } catch {}
    setLoaded(true);
  }, [profile.username]);
  useEffect(() => {
    if (loaded)
      try {
        localStorage.setItem(`root-mail:${profile.username}`, JSON.stringify(messages));
      } catch {}
  }, [loaded, messages, profile.username]);
  const visible = messages.filter(
    (m) =>
      m.folder === folder &&
      (m.subject + ' ' + m.from + ' ' + m.body).toLowerCase().includes(search.toLowerCase()),
  );
  const current = visible.find((m) => m.id === selected);
  const folders = [
    { id: 'inbox', name: '받은 편지함', icon: Inbox },
    { id: 'outbox', name: '보낼 편지함', icon: Send },
    { id: 'drafts', name: '임시 보관함', icon: FileEdit },
    { id: 'sent', name: '보낸 편지함', icon: Send },
    { id: 'archive', name: '보관함', icon: Archive },
    { id: 'trash', name: '휴지통', icon: Trash2 },
  ];
  function move(dest: string) {
    setMessages((m) => m.map((x) => (x.id === selected ? { ...x, folder: dest } : x)));
  }
  function newMessage(reply = false) {
    setDraftId(null);
    setTo(reply && current ? current.from : '');
    setSubject(reply && current ? 'Re: ' + current.subject : '');
    setBody(reply && current ? '\n\n--- 원본 메시지 ---\n' + current.body : '');
    setCompose(true);
  }
  function saveDraft() {
    setMessages((m) => [
      ...m.filter((message) => message.id !== draftId),
      {
        id: draftId || crypto.randomUUID(),
        subject: subject || '(제목 없음)',
        from: profile.email,
        to,
        body,
        folder: 'drafts',
        read: true,
        star: false,
        date: new Date().toISOString(),
      },
    ]);
    setCompose(false);
    notify('메시지를 임시 보관함에 저장했습니다.');
  }
  return (
    <div className="kmail">
      <NativeMenuBar
        menus={{
          파일: [
            { label: '새 메시지', shortcut: 'Ctrl+N', action: () => newMessage() },
            { label: '메일 확인', action: () => notify('새 메시지가 없습니다.') },
          ],
          편집: [
            {
              label: '모두 읽음으로 표시',
              action: () => setMessages((m) => m.map((x) => ({ ...x, read: true }))),
            },
          ],
          보기: [
            { label: '받은 편지함', action: () => setFolder('inbox') },
            { label: '보관함', action: () => setFolder('archive') },
          ],
          메시지: [
            { label: '답장', action: () => newMessage(true), disabled: !current },
            { label: '보관', action: () => move('archive'), disabled: !current },
            { label: '휴지통으로 이동', action: () => move('trash'), disabled: !current },
          ],
          설정: [
            {
              label: '새 메일 알림 테스트',
              action: () => notify('KMail 알림을 사용할 준비가 되었습니다.'),
            },
          ],
          도움말: [
            {
              label: 'KMail 정보',
              action: () => notify('KMail · PROJECT ROOT 내부 메일 클라이언트'),
            },
          ],
        }}
      />
      <div className="kmail-toolbar">
        <button onClick={() => newMessage()}>
          <MailIcon size={23} />
          <span>새 메시지</span>
          <ChevronDown size={12} />
        </button>
        <button onClick={() => notify('새 메시지가 없습니다.')}>
          <RefreshCw size={21} />
          <span>메일 확인</span>
        </button>
        <span className="toolbar-separator" />
        <button disabled={!current} onClick={() => newMessage(true)}>
          <Reply size={22} />
          <span>답장</span>
        </button>
        <button disabled={!current} onClick={() => newMessage(true)}>
          <ReplyAll size={22} />
          <span>전체 답장</span>
        </button>
        <button disabled={!current} onClick={() => move('archive')}>
          <Archive size={21} />
          <span>보관</span>
        </button>
        <button disabled={!current} onClick={() => move('trash')}>
          <Trash2 size={21} />
          <span>삭제</span>
        </button>
      </div>
      <div className="kmail-body">
        <aside className="kmail-folders">
          <h3>
            <ChevronDown size={14} />
            로컬 폴더
          </h3>
          {folders.map((f) => (
            <button
              key={f.id}
              className={folder === f.id ? 'selected' : ''}
              onClick={() => {
                setFolder(f.id);
                setSelected(messages.find((m) => m.folder === f.id)?.id || '');
              }}
            >
              <f.icon size={17} />
              {f.name}
              <small>{messages.filter((m) => m.folder === f.id).length || ''}</small>
            </button>
          ))}
          <div className="kmail-account">
            <MailIcon size={17} />
            <span>{profile.email}</span>
          </div>
        </aside>
        <div className="kmail-list-and-reader">
          <section className="kmail-message-list">
            <label>
              <Search size={15} />
              <input
                aria-label="메일 검색"
                placeholder="메시지 검색…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <div className="kmail-list-head">
              <span>제목</span>
              <span>보낸 사람</span>
              <span>날짜</span>
            </div>
            {visible.map((m) => (
              <button
                key={m.id}
                className={`${selected === m.id ? 'selected' : ''} ${m.read ? '' : 'unread'}`}
                onClick={() => {
                  setSelected(m.id);
                  setMessages((items) =>
                    items.map((x) => (x.id === m.id ? { ...x, read: true } : x)),
                  );
                  if (m.folder === 'drafts') {
                    setDraftId(m.id);
                    setTo(m.to);
                    setSubject(m.subject);
                    setBody(m.body);
                    setCompose(true);
                  }
                }}
              >
                <span>
                  <MailIcon size={14} />
                  {m.subject}
                </span>
                <span>{m.from.split('<')[0]}</span>
                <span>{new Date(m.date).toLocaleDateString('ko-KR')}</span>
              </button>
            ))}
            {!visible.length && <p className="mail-list-empty">표시할 메시지가 없습니다.</p>}
          </section>
          <article className="kmail-reader">
            {current ? (
              <>
                <header>
                  <h1>{current.subject}</h1>
                  <button
                    aria-label="메일 별표 표시"
                    onClick={() =>
                      setMessages((m) =>
                        m.map((x) => (x.id === current.id ? { ...x, star: !x.star } : x)),
                      )
                    }
                  >
                    <Star
                      size={20}
                      fill={current.star ? '#f2c55b' : 'none'}
                      color={current.star ? '#d49b00' : undefined}
                    />
                  </button>
                  <dl>
                    <dt>보낸 사람:</dt>
                    <dd>{current.from}</dd>
                    <dt>받는 사람:</dt>
                    <dd>{current.to}</dd>
                    <dt>날짜:</dt>
                    <dd>{new Date(current.date).toLocaleString('ko-KR')}</dd>
                  </dl>
                </header>
                <div className="kmail-message-text">{current.body}</div>
              </>
            ) : (
              <div className="kmail-empty">
                <MailIcon size={74} strokeWidth={0.8} />
                <h2>KMail</h2>
                <p>읽을 메시지를 선택하세요.</p>
              </div>
            )}
          </article>
        </div>
      </div>
      <footer className="native-status">
        <span>
          {visible.length}개 메시지 · {visible.filter((m) => !m.read).length}개 읽지 않음
        </span>
        <span>로컬 폴더</span>
      </footer>
      {compose && (
        <NativeDialog
          title="새 메시지 — KMail"
          className="compose-dialog"
          onClose={() => setCompose(false)}
        >
          <div className="compose-fields">
            <label>
              보낸 사람
              <input value={profile.email} readOnly />
            </label>
            <label>
              받는 사람
              <input
                aria-label="메일 받는 사람"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </label>
            <label>
              제목
              <input
                aria-label="메일 제목"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </label>
          </div>
          <textarea
            aria-label="메일 본문"
            placeholder="메시지 작성…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <footer>
            <span>발신 서비스는 첫 사건 배정 후 연결됩니다.</span>
            <button className="native-button" onClick={saveDraft}>
              <FileEdit size={15} />
              임시 저장
            </button>
            <button className="native-button" onClick={() => setCompose(false)}>
              닫기
            </button>
          </footer>
        </NativeDialog>
      )}
    </div>
  );
}
