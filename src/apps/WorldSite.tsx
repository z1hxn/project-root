'use client';
import {
  ArrowUpRight,
  ArrowRight,
  FileText,
  Globe2,
  ShieldCheck,
  MessageSquare,
  MapPin,
  BriefcaseBusiness,
} from 'lucide-react';
import { RootIcon } from '@/components/desktop/AppIcon';
import { OFFICIAL_URL, PROFILE_URL, THREAD_URL } from '@/game/world';
export function WorldSite({
  kind,
  navigate,
}: {
  kind: 'official' | 'profile' | 'thread';
  navigate: (url: string) => void;
}) {
  if (kind === 'official')
    return (
      <article
        className="root-public-site"
        onClick={(e) => {
          const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
          if (link) {
            e.preventDefault();
            const id = link.getAttribute('href')?.slice(1);
            if (id)
              e.currentTarget
                .querySelector(`[id="${id}"]`)
                ?.scrollIntoView({ block: 'start', behavior: 'smooth' });
          }
        }}
      >
        <header>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate(OFFICIAL_URL);
            }}
          >
            <RootIcon size={31} />
            <strong>PROJECT ROOT</strong>
          </a>
          <nav>
            <a href="#about">단체 소개</a>
            <a href="#principles">조사 원칙</a>
            <a href="#partners">협력 소식</a>
          </nav>
        </header>
        <section className="public-hero">
          <div>
            <span>INDEPENDENT DIGITAL INVESTIGATION</span>
            <h1>
              기록을 읽고,
              <br />
              사실을 연결합니다.
            </h1>
            <p>
              복잡한 디지털 환경 속에서 흩어진 사실을 찾습니다.
              <br />
              PROJECT ROOT는 공개 정보와 허가된 기록을 분석하는 독립 조사 조직입니다.
            </p>
            <a href="#about">
              우리가 하는 일 <ArrowRight size={17} />
            </a>
          </div>
          <div className="public-diagram" aria-hidden="true">
            <span>RECORD</span>
            <i />
            <RootIcon size={88} />
            <i />
            <span>CONTEXT</span>
          </div>
        </section>
        <section id="about" className="public-section">
          <span>01 / ABOUT US</span>
          <h2>하나의 기록만으로 결론 내리지 않습니다.</h2>
          <p>
            사람과 조직이 남긴 디지털 흔적에는 맥락이 있습니다. 우리는 공개된 웹 자료, 계정의 활동,
            문서와 시스템 기록을 교차 검토해 무엇이 실제로 일어났는지 설명합니다.
          </p>
          <div className="public-services">
            {[
              [Globe2, '공개 정보 조사', '웹과 공개 프로필, 커뮤니티의 기록을 살펴봅니다.'],
              [FileText, '기록 분석', '시간과 출처를 확인하고 자료 사이의 관계를 찾습니다.'],
              [ShieldCheck, '검증 가능한 보고', '추측과 사실을 구분하고 근거를 남깁니다.'],
            ].map(([Icon, title, copy]) => {
              const I = Icon as typeof Globe2;
              return (
                <div key={String(title)}>
                  <I size={25} />
                  <h3>{String(title)}</h3>
                  <p>{String(copy)}</p>
                </div>
              );
            })}
          </div>
        </section>
        <section id="principles" className="public-principles">
          <span>02 / OUR PRINCIPLES</span>
          <h2>신뢰는 조사 방법에서 시작됩니다.</h2>
          <div>
            <p>
              <b>01</b>
              <strong>범위를 지킵니다.</strong>공개 자료와 정당하게 접근이 허가된 기록만 조사합니다.
            </p>
            <p>
              <b>02</b>
              <strong>출처를 남깁니다.</strong>확인한 사실을 다른 사람이 검증할 수 있도록
              기록합니다.
            </p>
            <p>
              <b>03</b>
              <strong>성급하게 단정하지 않습니다.</strong>동일한 이름이나 계정만으로 관계를 확정하지
              않습니다.
            </p>
          </div>
        </section>
        <section id="partners" className="public-section">
          <span>03 / PARTNER NOTES</span>
          <h2>기록을 다루는 사람들과 함께합니다.</h2>
          <div className="public-partner">
            <div>
              <small>협력 기관 · 해온 데이터 연구소</small>
              <h3>공개 데이터 아카이브의 연결성 연구</h3>
              <p>
                연구원 윤서하는 공개 기록의 보존과 접근성을 연구합니다. 최근 프로젝트 소식과
                연구원의 공개 활동은 외부 프로필에서 확인할 수 있습니다.
              </p>
            </div>
            <button onClick={() => navigate(PROFILE_URL)}>
              연구원 공개 프로필 <ArrowUpRight size={17} />
            </button>
          </div>
        </section>
        <footer>
          <strong>PROJECT ROOT</strong>
          <span>Digital investigation, grounded in evidence.</span>
          <small>© PROJECT ROOT · 공개 정보 조사 및 기록 분석</small>
        </footer>
      </article>
    );
  if (kind === 'profile')
    return (
      <article className="profile-site">
        <header>
          <strong>
            Profile<span>●</span>
          </strong>
          <button onClick={() => navigate('https://index.root')}>검색으로 돌아가기</button>
        </header>
        <div className="profile-cover" />
        <main>
          <div className="profile-avatar">서하</div>
          <div className="profile-intro">
            <div>
              <h1>윤서하</h1>
              <p>공개 데이터 아카이브 연구원</p>
              <small>
                <BriefcaseBusiness size={14} /> 해온 데이터 연구소 · <MapPin size={14} /> 서울
              </small>
            </div>
            <span>공개 프로필</span>
          </div>
          <section>
            <h2>소개</h2>
            <p>
              사라지기 쉬운 공개 기록이 어떻게 연결되고 보존되는지 연구합니다. 데이터의 내용만큼
              출처와 갱신 시각을 중요하게 생각합니다.
            </p>
            <dl>
              <dt>공개 사용자명</dt>
              <dd>seoha_y</dd>
              <dt>소속</dt>
              <dd>해온 데이터 연구소</dd>
              <dt>연구 분야</dt>
              <dd>공개 데이터 · 디지털 아카이브 · 기록 보존</dd>
            </dl>
          </section>
          <section>
            <h2>최근 활동</h2>
            <small>2026년 9월 24일</small>
            <h3>공개 아카이브 색인 갱신</h3>
            <p>
              이번 주 변경 사항을 공개 데이터 커뮤니티에 정리했습니다. 원문 링크가 이동한 자료는
              갱신된 색인에서 확인할 수 있습니다.
            </p>
            <button onClick={() => navigate(THREAD_URL)}>
              Threads의 공개 글 보기 <ArrowUpRight size={15} />
            </button>
          </section>
          <aside>공개 프로필 정보는 작성자가 제공했습니다. 다른 출처와 함께 확인하세요.</aside>
        </main>
      </article>
    );
  return (
    <article className="threads-site">
      <header>
        <strong>
          <MessageSquare size={24} /> Threads
        </strong>
        <span>공개 데이터 커뮤니티</span>
      </header>
      <main>
        <aside>
          <b>t / open-data</b>
          <p>
            기록을 모으고,
            <br />
            지식을 나눕니다.
          </p>
          <small>자료 공유 · 아카이브 · 토론</small>
        </aside>
        <section>
          <div className="thread-breadcrumb">open-data / 기록 보존</div>
          <h1>공개 아카이브 색인 갱신 안내</h1>
          <div className="thread-author">
            <span>SY</span>
            <div>
              <strong>seoha_y</strong>
              <small>2026. 09. 24. 14:20 · 공개 게시물</small>
            </div>
          </div>
          <div className="thread-copy">
            <p>안녕하세요. 해온 데이터 연구소의 윤서하입니다.</p>
            <p>
              공개 아카이브의 9월 색인을 갱신했습니다. 일부 원문 주소가 변경되어 기존 링크로는
              자료를 찾기 어려울 수 있습니다. 이번 갱신에서는 원문 출처와 마지막 확인 시각을 함께
              정리했습니다.
            </p>
            <p>
              주소가 바뀌었다는 이유만으로 자료가 삭제됐다고 판단하지는 말아 주세요. 기록을 인용할
              때는 출처의 갱신일도 함께 확인하면 좋겠습니다.
            </p>
            <p>작성자와 연구 활동은 제 공개 프로필에서도 확인하실 수 있습니다.</p>
            <button onClick={() => navigate(PROFILE_URL)}>
              윤서하 · Profile <ArrowUpRight size={15} />
            </button>
          </div>
          <footer>원문 출처: threads.root/t/archive-update · 수정되지 않은 공개 기록</footer>
          <div className="thread-comment">
            <b>archive_reader</b>
            <small>2026. 09. 24. 16:03</small>
            <p>업데이트 감사합니다. 출처 확인 시각까지 함께 기록하겠습니다.</p>
          </div>
        </section>
      </main>
    </article>
  );
}
