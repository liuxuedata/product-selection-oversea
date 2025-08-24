export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get("keyword") || "";
  const country = searchParams.get("country") || "";
  const time = searchParams.get("time") || "";
  const category = searchParams.get("category") || "";
  const results = Array.from({ length: 5 }).map((_, i) => ({
    term: keyword ? `${keyword} ${i + 1}` : `示例${i + 1}`,
    value: Math.round(Math.random() * 100),
  }));
  return Response.json({ params: { country, time, category, keyword }, results });
}
