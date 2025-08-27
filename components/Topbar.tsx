import Image from "next/image";

export default function Topbar() {
  return (
    <header className="h-12 border-b border-[var(--border)] bg-[var(--background)] flex items-center px-4">
      <Image src="/logo.svg" alt="logo" width={28} height={28} className="mr-2" />
      <span className="font-medium">选品平台</span>
    </header>
  );
}
