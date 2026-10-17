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
  title: 'PROJECT ROOT — 흩어진 단서, 하나의 진실.',
  description: '가상의 웹사이트와 Linux 워크스테이션을 탐색하며 사건을 해결하는 온라인 추리 게임.',
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
