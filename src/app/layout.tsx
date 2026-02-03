import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { ZoningProvider } from '@/context/ZoningContext';

export const metadata: Metadata = {
  title: 'Zchut.AI | Real Estate Intelligence Platform',
  description:
    'מנוע AI שהופך קבצי תב"ע מורכבים לדו"ח היתכנות כלכלי-תכנוני פשוט. גלה מה אפשר לבנות על המגרש שלך בשניות.',
  keywords: [
    'זכויות בנייה',
    'תב"ע',
    'תכנית בניין עיר',
    'שמאות',
    'אדריכלות',
    'רעננה',
    'נדל"ן',
    'בנייה',
  ],
  authors: [{ name: 'Zchut.AI' }],
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0b0f19',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <ZoningProvider>
            {children}
          </ZoningProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
