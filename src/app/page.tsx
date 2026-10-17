import Link from 'next/link';
import { ArrowRight, ArrowUpRight, FileText, Mail, Monitor, Search, UsersRound } from 'lucide-react';
import { currentUser } from '@/server/auth';
import { SiteHeader } from '@/components/ui/SiteHeader';

export default async function Landing() {
  const user = await currentUser();
  return <main className="public-shell landing-page">
    <SiteHeader user={user} />
    <section className="landing-hero" aria-labelledby="hero-title">
      <div className="landing-hero-copy">
        <span className="genre-label"><span /> 온라인 추리 게임</span>
        <h1 id="hero-title">흩어진 단서,<br /><em>하나의 진실.</em></h1>
        <p>가상의 웹사이트와 컴퓨터 환경을 탐색하고,<br className="wide-only" /> 흩어진 단서를 연결해 사건의 진실을 밝혀내는 온라인 추리 게임.</p>
        <div className="landing-hero-actions">
          <Link className="public-button primary-action" href="/game">추리 시작하기 <ArrowRight size={18} /></Link>
          <Link className="public-button quiet-action" href="#how-it-works">게임 알아보기 <ArrowUpRight size={17} /></Link>
        </div>
        <span className="hero-footnote">브라우저에서 바로 시작 · 설치 필요 없음</span>
      </div>
      <div className="case-preview" aria-label="PROJECT ROOT의 디지털 조사 방식">
        <div className="case-preview-top"><span className="preview-mark" /> 디지털 조사</div>
        <div className="case-preview-body">
          <div className="preview-method"><Mail size={20} /><div><strong>기록을 조사하다</strong><p>이메일과 문서, 웹사이트에 남겨진 정보를 분석하세요.</p></div></div>
          <div className="preview-method"><Search size={20} /><div><strong>단서를 연결하다</strong><p>서로 다른 정보 속에서 숨겨진 연관성을 발견하세요.</p></div></div>
          <div className="preview-result"><span>조사의 시작</span><strong>모든 단서는 연결되어 있다.</strong><p>당신은 PROJECT ROOT의 조사관이 되어 가상의 디지털 공간을 탐색합니다. 흩어진 기록을 수집하고, 서로 모순되는 정보를 비교하며 사건의 진실에 다가가세요.</p></div>
        </div>
        <div className="case-preview-bottom"><span className="preview-pulse" /> 당신의 관찰과 판단이 이야기의 방향을 결정합니다.</div>
      </div>
    </section>
    <section className="platform-section play-section" id="how-it-works">
      <div className="section-heading"><span>PROJECT ROOT 소개</span><h2>읽고, 비교하고, 결론을 내립니다.</h2><p>정답을 찍는 퀴즈가 아닙니다. 직접 자료를 열어 보고 근거를 모아 사건 보고서를 작성합니다.</p></div>
      <div className="play-steps">
        <article><div className="step-icon"><Mail size={22} /></div><span>01</span><h3>요청을 읽습니다</h3><p>KMail에 도착한 업무 요청에서 사건의 시작점과 확인해야 할 자료를 찾습니다.</p></article>
        <article><div className="step-icon"><Search size={22} /></div><span>02</span><h3>흔적을 확인합니다</h3><p>Firefox에서 현재 페이지와 공개 변경 이력을 찾아 서로 맞는지 비교합니다.</p></article>
        <article><div className="step-icon"><FileText size={22} /></div><span>03</span><h3>근거를 제출합니다</h3><p>확인한 자료를 선택하고 판단 이유를 적어 다음 사건으로 이어 갑니다.</p></article>
      </div>
    </section>
    <section className="platform-section workstation-section">
      <div className="workstation-symbol"><Monitor size={42} strokeWidth={1.35} /><span>Plasma</span></div>
      <div><span className="section-kicker">당신의 조사 공간</span><h2>브라우저 안의 Linux 워크스테이션</h2><p>Dolphin에서 파일을 살펴보고, Firefox로 웹을 탐색하고, Konsole에서 기록을 읽습니다. 익숙한 도구를 오가며 단서를 연결하세요.</p></div>
      <Link href="/game" aria-label="워크스테이션 열기">워크스테이션 열기 <ArrowRight size={17} /></Link>
    </section>
    <section className="platform-section community-teaser">
      <div><UsersRound size={23} /><span className="section-kicker">커뮤니티</span><h2>혼자 시작해도, 함께 이야기할 수 있도록.</h2><p>플레이어가 조사 경험을 나눌 공간을 준비하고 있습니다.</p></div>
      <Link href="/community">커뮤니티 알아보기 <ArrowRight size={17} /></Link>
    </section>
    <footer className="public-footer"><span>PROJECT ROOT</span><span>기록을 읽는 순간, 사건이 시작됩니다.</span></footer>
  </main>;
}
