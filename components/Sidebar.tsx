"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const defaultNav = [
  { label: "推荐产品", href: "/recommendations" },
  { label: "产品列表", href: "/products" },
  { label: "文件导入", href: "/upload" },
  { label: "配置说明", href: "/config" },
];

const trendsNav = [
  { label: "Google Trend", href: "/trends/google" },
  { label: "TikTok Trend", href: "/trends/tiktok" },
];

export default function Sidebar() {
  const pathname = usePathname() ?? "";
  const nav = pathname.startsWith("/trends") ? trendsNav : defaultNav;

  return (
    <aside className="w-56 bg-[var(--sidebar)] text-[var(--sidebar-foreground)] flex flex-col">
      <div className="p-4 text-lg font-bold">导航</div>
      <nav className="flex-1 px-2 space-y-1">
        {nav.map((n) => {
          const active = pathname.startsWith(n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={
                "block rounded px-2 py-1 hover:bg-[var(--sidebar-accent)]" +
                (active ? " bg-[var(--sidebar-accent)]" : "")
              }
            >
              {n.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
