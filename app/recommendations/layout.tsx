'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

const tabs = [
  { label: '平台站推荐', href: '/recommendations/platform' },
  { label: '独立站推荐', href: '/recommendations/independent' },
];

export default function RecommendationsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">推荐产品</h1>
      <nav className="flex gap-4 border-b">
        {tabs.map((t) => {
          const active = pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`px-3 py-2 -mb-px border-b-2 ${active ? 'border-[var(--foreground)]' : 'border-transparent hover:border-[var(--border)]'}`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
