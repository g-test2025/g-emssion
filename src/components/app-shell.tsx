'use client';

import Link from 'next/link';
import { useLanguage } from './language-provider';

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/organization-boundary', label: 'Organization' },
  { href: '/activity-data', label: 'Activity Data' },
  { href: '/emission-factors', label: 'Emission Factors' },
  { href: '/reports', label: 'Reports' },
  { href: '/verification', label: 'Verification' },
  { href: '/evidence', label: 'Evidence' }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="min-h-screen bg-carbon-bg text-carbon-ink">
      <aside className="fixed inset-y-0 left-0 w-72 bg-[#10251d] p-6 text-white max-lg:static max-lg:w-full">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-[#51b879] font-bold text-[#0d2118]">C</div>
          <div>
            <div className="font-bold">{t('G-Emission Assistant')}</div>
            <div className="text-sm text-[#a8c6b6]">ISO 14064-1 / TGO CFO</div>
          </div>
        </div>
        <div className="mb-5 grid grid-cols-2 gap-2 rounded-lg bg-white/5 p-1">
          <button className={'rounded-md px-3 py-2 text-sm font-bold ' + (language === 'en' ? 'bg-[#51b879] text-[#0d2118]' : 'text-[#c8ded0]')} onClick={() => setLanguage('en')}>EN</button>
          <button className={'rounded-md px-3 py-2 text-sm font-bold ' + (language === 'th' ? 'bg-[#51b879] text-[#0d2118]' : 'text-[#c8ded0]')} onClick={() => setLanguage('th')}>TH</button>
        </div>
        <nav className="grid gap-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-lg px-4 py-3 text-[#c8ded0] hover:bg-[#214634] hover:text-white">
              {t(item.label)}
            </Link>
          ))}
        </nav>
        <div className="mt-8 rounded-lg border border-white/10 p-4 text-sm text-[#c8ded0]">
          <div className="font-semibold text-white">{t('Role context')}</div>
          <p className="mt-2">{t('Admin, ESG Manager, Data Owner, Reviewer, and Viewer are modeled in Prisma for RBAC.')}</p>
        </div>
      </aside>
      <main className="ml-72 p-8 max-lg:ml-0 max-sm:p-4">{children}</main>
    </div>
  );
}
