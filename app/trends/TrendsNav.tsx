"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/trends/google", label: "Google Trend" },
  { href: "/trends/tiktok", label: "TikTok Trend" },
];

export default function TrendsNav() {
  const pathname = usePathname() ?? "";
  return (
    <nav className="mb-4 flex gap-4 border-b border-[var(--border)]">
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              active
                ? "pb-1 text-blue-600 border-b-2 border-blue-600"
                : "pb-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
