import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ErasmusMate',
  description: 'Institutional-first Erasmus mobility management.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
