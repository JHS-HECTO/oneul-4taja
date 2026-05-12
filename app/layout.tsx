import './globals.scss';
import { Press_Start_2P } from 'next/font/google';

const pixel = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-pixel',
});

export const metadata = {
  title: '오늘의 4번타자',
  description: '폴리볼 야구 타격 미니게임',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={pixel.variable}>
      <body>{children}</body>
    </html>
  );
}
