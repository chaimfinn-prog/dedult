import type { Metadata, Viewport } from 'next';
import './globals.css';
import { LangProvider } from '@/lib/i18n';
import { AuthProvider } from '@/lib/auth';
import FirebaseAnalytics from '@/components/FirebaseAnalytics';

export const metadata: Metadata = {
  title: 'PROPCHECK — בדיקת נאותות לנדל"ן',
  description: 'אל תסתפקו בהבטחות, תסתמכו על עובדות. בדיקת כדאיות מקצועית לפרויקטי התחדשות עירונית',
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
          <AuthProvider>
            <FirebaseAnalytics />
            {children}
          </AuthProvider>
        </LangProvider>
      </body>
    </html>
  );
}
