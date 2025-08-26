import Link from "next/link";

export default function Topbar() {
  return (
    <header className="h-12 border-b border-[var(--border)] bg-[var(--background)] flex items-center px-4">
      <span className="font-medium flex-1">选品平台</span>
      <nav>
        <Link href="/trends" className="text-blue-600 font-medium">
          Trends
        </Link>
      </nav>
    </header>
  );
}
