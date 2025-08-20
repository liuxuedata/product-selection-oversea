import "../styles/globals.css";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex">
        <aside className="w-60 bg-gray-900 text-white p-4">导航</aside>
        <main className="flex-1 bg-gray-50 text-gray-900">{children}</main>
      </body>
    </html>
  );
}
