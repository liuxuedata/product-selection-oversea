"use client";

import Image from "next/image";
import Link from "next/link";

export default function Topbar() {
  return (
    <header className="h-12 border-b border-[var(--border)] bg-[var(--background)] flex items-center justify-between px-4">
      {/* 左侧 Logo + 标题 */}
      <div className="flex items-center">
        <Image src="/logo.svg" alt="logo" width={28} height={28} className="mr-2" />
        <span className="font-medium">选品平台</span>
      </div>

      {/* 右侧导航链接 */}
      <nav className="flex items-center gap-6 text-sm">
        <Link href="/" className="hover:underline">首页</Link>
        <Link href="/trends" className="hover:underline">趋势</Link>
        <Link href="/products" className="hover:underline">产品</Link>
      </nav>
    </header>
  );
}
