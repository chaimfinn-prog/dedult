import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { BasketProvider } from '@/context/BasketContext';

export const metadata: Metadata = {
  title: 'סלי AI | השוואת מחירים חכמה',
  description: 'מנוע חכם להשוואת מחירים ואופטימיזציית סל קניות בישראל',
  keywords: ['השוואת מחירים', 'סופרמרקט', 'קניות', 'ישראל', 'חיסכון'],
  authors: [{ name: 'Sali AI' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0f1a' },
  ],
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
          <BasketProvider>
            <div className="gradient-bg" />
            <main className="min-h-screen safe-area-top safe-area-bottom">
              {children}
            </main>
          </BasketProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
