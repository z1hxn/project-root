import type { Metadata } from 'next';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/noto-sans-kr/400.css';
import '@fontsource/noto-sans-kr/500.css';
import '@fontsource/noto-sans-kr/700.css';
import '@fontsource/noto-sans/400.css';
import '@fontsource/noto-sans/600.css';
import '@fontsource/jetbrains-mono/400.css';
import './globals.css';
import './plasma.css';
export const metadata: Metadata = {
  title: 'PROJECT ROOT — Trace the signal.',
  description: '웹과 시스템에 남겨진 흔적을 추적하는 사이버 미스터리.',
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
