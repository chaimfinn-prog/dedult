import type { Metadata, Viewport } from 'next';
import './globals.css';
import { LangProvider } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'THE REALITY CHECK — בדיקת נאותות להתחדשות עירונית',
  description: 'ניתוח אנליטי של פרויקטי התחדשות עירונית: לו״ז אמיתי למפתח, מדד וודאות וציון סיכון',
  icons: { icon: '/favicon.ico' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0b0f19',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body className="antialiased">
        <LangProvider>
          {children}
        </LangProvider>
      </body>
    </html>
  );
}
