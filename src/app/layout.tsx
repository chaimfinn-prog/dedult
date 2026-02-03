import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ViewProvider } from '@/context/ViewContext';

export const metadata: Metadata = {
  title: 'Zchut.AI | מנוע זכויות בנייה חכם',
  description: 'מנוע בינה מלאכותית לניתוח זכויות בנייה, תב"עות ופוטנציאל נדל"ן בישראל',
  keywords: ['זכויות בנייה', 'תב"ע', 'נדל"ן', 'גוש חלקה', 'תמ"א 38', 'היטל השבחה'],
  authors: [{ name: 'Zchut.AI' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0B0F19',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ViewProvider>
          <div className="gradient-bg" />
          <main className="min-h-screen safe-area-top safe-area-bottom">
            {children}
          </main>
        </ViewProvider>
      </body>
    </html>
  );
}
