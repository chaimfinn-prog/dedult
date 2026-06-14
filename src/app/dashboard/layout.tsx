import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'מערכת ניתוח פינוי-בינוי | PROPCHECK',
  description: 'תוכנית עסקית אוטומטית ליזמי התחדשות עירונית — ניתוח כדאיות, פיצוי דיירים, הצעת יזם חלופי',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
