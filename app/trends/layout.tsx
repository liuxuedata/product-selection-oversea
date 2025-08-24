import TrendsNav from "./TrendsNav";

export default function TrendsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-6">
      <TrendsNav />
      {children}
    </div>
  );
}
