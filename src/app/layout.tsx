import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/providers/QueryProvider';
import { NoodknopButton } from '@/components/emergency/NoodknopButton';
import common from '@/content/nl/common.json';

export const metadata: Metadata = {
  title: {
    default: common.app.name,
    template: `%s — ${common.app.name}`,
  },
  description: common.app.tagline,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>
        <QueryProvider>
          {children}
          {/* Noodknop: fixed position, visible on every screen — non-negotiable */}
          <NoodknopButton />
        </QueryProvider>
      </body>
    </html>
  );
}
