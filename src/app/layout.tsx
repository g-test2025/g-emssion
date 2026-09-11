import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/app-shell';
import { LanguageProvider } from '@/components/language-provider';

export const metadata: Metadata = {
  title: 'G-Emission ESG Carbon Report Assistant',
  description: 'ESG, CFO, ISO 14064-1, and GHG Inventory reporting system'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <AppShell>{children}</AppShell>
        </LanguageProvider>
      </body>
    </html>
  );
}
