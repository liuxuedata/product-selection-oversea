import Link from "next/link";

const nav = [
  { label: "推荐产品", href: "/recommendations" },
  { label: "产品列表", href: "/products" },
  { label: "文件导入", href: "/" },
  { label: "配置说明", href: "/config" },
];

export default function Sidebar() {
  return (
    <aside className="w-56 bg-[var(--sidebar)] text-[var(--sidebar-foreground)] flex flex-col">
      <div className="p-4 text-lg font-bold">导航</div>
      <nav className="flex-1 px-2 space-y-1">
        {nav.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="block rounded px-2 py-1 hover:bg-[var(--sidebar-accent)]"
          >
            {n.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
