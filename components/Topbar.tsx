"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/recommendations", label: "选品" },
  { href: "/trends", label: "趋势" },
  { href: "/keywords", label: "关键词推荐" },
];

export default function Topbar() {
  const pathname = usePathname();
  return (
    <header className="h-12 border-b border-[var(--border)] bg-[var(--background)] flex items-center px-4">
      <nav className="flex gap-4">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                active
                  ? "text-blue-600 font-medium"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
