product-selection-oversea
基于跨境站选品

Database
The SQL schema for this project lives in db/init.sql. Run the script in the Supabase SQL editor (or via the Supabase CLI) to create tables, indexes, and seed the default scoring profiles.

选品平台（文本导入版）开发指导（for Codex）

目标：

支持上传 Helium10 BlackBox 的 Excel/CSV，完整存储所有列（jsonb），并按 ASIN 或 URL 任一重复即跳过。

内置两套评分方案（平台站 / 独立站），在前端可视化展示和微调参数，支持实时预览与一键全量重算。

前端可分页展示所有原始列 + 两套综合分。

环境准备
Supabase：创建项目 → 复制 Project URL 和 anon key

Vercel：用于部署 Next.js

Node ≥ 18

仓库初始化 npx create-next-app@latest product-selection-platform --typescript --tailwind --eslint cd product-selection-platform
依赖
npm i @supabase/supabase-js formidable xlsx npm i -D @types/formidable

可选：表格虚拟滚动组件
npm i @tanstack/react-table @tanstack/react-virtual

Supabase 数据库初始化
将下列 SQL 一次性执行到 Supabase SQL Editor（或 psql）。 （已包含：文件&行表、去重索引、评分结果、评分方案与版本、行+分数字段视图、两套默认评分方案的种子数据）

⚠️ 你之前已贴过这份 SQL，如已执行可跳过本节。

-- Database initialization script for product scoring -- Creates tables, indexes, view, and inserts default scoring profiles and revisions.

-- 1) File dimension table create table if not exists blackbox_files ( id uuid primary key default gen_random_uuid(), filename text not null, sheet_name text, row_count int, column_names jsonb, uploaded_by text, inserted_count int default 0, skipped_count int default 0, invalid_count int default 0, uploaded_at timestamptz default now() );

-- 2) Row dimension table with original data create table if not exists blackbox_rows ( id uuid primary key default gen_random_uuid(), file_id uuid not null references blackbox_files(id) on delete cascade, row_index int, asin text, url text, title text, data jsonb not null, inserted_at timestamptz default now(), asin_norm text generated always as (nullif(lower(btrim(asin)), '')) stored, url_norm text generated always as (nullif(lower(btrim(url)), '')) stored ); create unique index if not exists uq_blackbox_rows_asin_norm on blackbox_rows(asin_norm) where asin_norm is not null; create unique index if not exists uq_blackbox_rows_url_norm on blackbox_rows(url_norm) where url_norm is not null; create index if not exists idx_blackbox_rows_file on blackbox_rows(file_id);

-- 3) Scoring results bound to individual rows create table if not exists product_scores ( id uuid primary key default gen_random_uuid(), row_id uuid not null references blackbox_rows(id) on delete cascade, platform_score numeric, independent_score numeric, meta jsonb, scored_at timestamptz default now() ); create index if not exists idx_product_scores_row on product_scores(row_id);

-- 4) Scoring profiles and revisions create table if not exists scoring_profiles ( id uuid primary key default gen_random_uuid(), name text not null, description text, is_active boolean default false, created_by text, created_at timestamptz default now() ); create table if not exists scoring_profile_revisions ( id uuid primary key default gen_random_uuid(), profile_id uuid not null references scoring_profiles(id) on delete cascade, version int not null, params jsonb not null, changelog text, created_by text, created_at timestamptz default now() ); create index if not exists idx_spr_profile on scoring_profile_revisions(profile_id);

-- 5) View joining rows with scores create or replace view v_blackbox_rows_with_scores as select r.id as row_id, r.file_id, r.row_index, r.asin, r.url, r.title, r.data, s.platform_score, s.independent_score, s.scored_at from blackbox_rows r left join product_scores s on s.row_id = r.id;

-- Seed default scoring profiles and revisions -- Platform default profile with platform_profile as ( insert into scoring_profiles (name, description, is_active, created_by) values ('platform_default', '平台站V3默认评分方案', true, 'system') returning id ) insert into scoring_profile_revisions (profile_id, version, params, changelog, created_by) select id, 1, $$ { ...平台方案 JSON（略，已在你上一条 SQL 中包含） ... } $$, '初始默认版本', 'system' from platform_profile;

-- Independent default profile with independent_profile as ( insert into scoring_profiles (name, description, is_active, created_by) values ('independent_default', '独立站V3默认评分方案', true, 'system') returning id ) insert into scoring_profile_revisions (profile_id, version, params, changelog, created_by) select id, 1, $$ { ...独立站方案 JSON（略，已在你上一条 SQL 中包含） ... } $$, '初始默认版本', 'system' from independent_profile;

注：为节省篇幅，上面 ...平台方案 JSON... 与 ...独立站方案 JSON... 就用你已成功粘贴执行的完整版本。若尚未执行，可使用我之前给你的完整 JSON 版本。

目录结构 product-selection-platform/ ├─ pages/ │ ├─ index.tsx # 首页：上传入口（文件 -> /api/upload） │ ├─ settings.tsx # 评分参数可视化&微调 + 实时预览 + 保存版本 + 全量重算 │ ├─ file/ │ │ └─ [id].tsx # 文件详情（动态全列表 + 分数） │ └─ api/ │ ├─ upload.ts # 上传/解析/入库（去重） │ ├─ files/ │ │ └─ [id]/rows.ts # 分页返回 v_blackbox_rows_with_scores │ ├─ scoring-profiles/ │ │ ├─ index.ts # GET 列表；POST 新建 │ │ └─ [id].ts # GET 最新参数；POST revisions 新版本 │ └─ score/ │ ├─ preview.ts # 预览：params + sampleRows -> 分数（不落库） │ └─ apply.ts # 全量重算：params/profileId + fileId -> 写 product_scores ├─ lib/ │ ├─ supabase.ts # Supabase 客户端 │ └─ scoring/ │ ├─ field.ts # pickNumber / pickString │ ├─ engine.ts # scoreRowByParams（通用执行器） │ └─ mapping.ts # 可选：字段别名/抽取 ├─ utils/ │ └─ parseExcel.ts # 解析 Excel/CSV -> {sheetName, columns, rows} ├─ components/ │ ├─ UploadForm.tsx # 上传组件 │ ├─ DynamicTable.tsx # 虚拟滚动全列表格 │ └─ ScoreChart.tsx # 可选：雷达/柱状 ├─ styles/... ├─ .env.local # Supabase 环境变量 └─ README.md

环境变量

在 .env.local 与 Vercel 环境变量中配置：

NEXT_PUBLIC_SUPABASE_URL=你的_supabase_url NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_supabase_anon_key

基础库代码 5.1 lib/supabase.ts import { createClient } from '@supabase/supabase-js';
export const supabase = createClient( process.env.NEXT_PUBLIC_SUPABASE_URL as string, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string );

5.2 utils/parseExcel.ts import * as XLSX from 'xlsx';

export function parseExcelToRows(buffer: Buffer) { const wb = XLSX.read(buffer, { type: 'buffer' }); const sheetName = wb.SheetNames[0]; const ws = wb.Sheets[sheetName]; const json = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });

const columnSet = new Set(); json.forEach(r => Object.keys(r).forEach(k => columnSet.add(k))); const columns = Array.from(columnSet);

return { sheetName, columns, rows: json }; }

5.3 lib/scoring/field.ts export function pickNumber(row: Record<string, any>, keys: string[], fallback = 0) { for (const k of keys) { const v = row?.[k]; if (v === undefined || v === null || String(v).trim() === '') continue; const n = Number(String(v).replace(/[^\d.\-]/g, '')); if (!Number.isNaN(n)) return n; } return fallback; } export function pickString(row: Record<string, any>, keys: string[], fallback = '') { for (const k of keys) { const v = row?.[k]; if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim(); } return fallback; }

5.4 lib/scoring/engine.ts import { pickNumber } from './field';

type Segment = { gte?:number; lte?:number; lt?:number; gt?:number; score?:number; scoreExpr?:string }; type Dimension = { key: string; label: string; weight: number; // 0~1 explain?: string; formula: 'piecewise' | 'composite' | 'linear'; segments?: Segment[]; // piecewise parts?: any[]; // composite aggregate?: 'multiplyReview' | 'sum' | 'product'; fieldCandidates?: string[]; bounds?: { min?: number; max?: number }; };

export function evalExpr(expr: string, x: number, row: Record<string, any>) { // 仅允许数字、x、Math、() 和基本运算；避免注入 const safe = expr.replace(/[^0-9x\+\-\*\/\.\(\)\sA-Za-z\[\]'_]/g, ''); // eslint-disable-next-line no-new-func return Function('x','row', with(Math){ return (${safe}); })(x, row); } function clip(v: number, b?: {min?:number; max?:number}) { if (!b) return v; if (b.min !== undefined) v = Math.max(b.min, v); if (b.max !== undefined) v = Math.min(b.max, v); return v; } function inSeg(x:number, s:Segment){ const okGte = s.gte === undefined || x >= s.gte; const okLte = s.lte === undefined || x <= s.lte; const okLt = s.lt === undefined || x < s.lt; const okGt = s.gt === undefined || x > s.gt; return okGte && okLte && okLt && okGt; } function scorePiecewise(x: number, segs: Segment[], row: Record<string, any>) { for (const s of segs) { if (inSeg(x, s)) { if (s.score !== undefined) return s.score; if (s.scoreExpr) return Math.max(0, Math.min(100, evalExpr(s.scoreExpr, x, row))); } } return 0; }

export function scoreRowByParams(row: Record<string, any>, params: {dimensions: Dimension[]}) { let total = 0; for (const d of params.dimensions || []) { let dimScore = 0; if (d.formula === 'piecewise') { const x = pickNumber(row, d.fieldCandidates || []); dimScore = scorePiecewise(clip(x, d.bounds), d.segments || [], row); } else if (d.formula === 'composite' && d.key === 'review_combo') { const partCount:any = d.parts?.find((p:any)=>p.type==='reviewCount'); const partRate:any = d.parts?.find((p:any)=>p.type==='reviewRating'); const x1 = pickNumber(row, partCount?.fieldCandidates || []); const x2 = pickNumber(row, partRate?.fieldCandidates || []); const s1 = scorePiecewise(x1, partCount?.rules || [], row); const s2 = scorePiecewise(x2, partRate?.rules || [], row); dimScore = s1 * (s2 / 100); } total += Math.max(0, Math.min(100, dimScore)) * (d.weight || 0); } return Math.max(0, Math.min(100, total)); }

API 路由 6.1 /pages/api/upload.ts（去重入库） import type { NextApiRequest, NextApiResponse } from 'next'; import formidable from 'formidable'; import fs from 'fs'; import { supabase } from '@/lib/supabase'; import { parseExcelToRows } from '@/utils/parseExcel';
export const config = { api: { bodyParser: false } };

function pickString(row: Record<string,any>, keys: string[]) { for (const k of keys) { const v = row?.[k]; if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim(); } return null; }

export default function handler(req: NextApiRequest, res: NextApiResponse) { if (req.method !== 'POST') return res.status(405).end(); const form = formidable({}); form.parse(req, async (err, _fields, files) => { if (err) return res.status(500).json({ error: 'Upload error' }); const file = files.file as formidable.File; const buf = fs.readFileSync(file.filepath); const { sheetName, columns, rows } = parseExcelToRows(buf);

// 记录文件
const { data: f, error: ferr } = await supabase
  .from('blackbox_files')
  .insert({
    filename: file.originalFilename || 'upload.xlsx',
    sheet_name: sheetName,
    row_count: rows.length,
    column_names: columns
  })
  .select('id')
  .single();
if (ferr) return res.status(500).json({ error: ferr.message });

let inserted = 0, skipped = 0, invalid = 0;
// 逐行插入（建议生产用批量 & 预查已存在集合优化）
for (let i = 0; i < rows.length; i++) {
  const r = rows[i];
  const asin = pickString(r, ['ASIN','asin','Asin']);
  const url  = pickString(r, ['URL','Url','url']);
  const title= pickString(r, ['Product Title','Title','title']);

  if (!asin && !url) { invalid++; continue; }
  const payload = { file_id: f.id, row_index: i + 2, asin, url, title, data: r };

  const { error: insErr } = await supabase.from('blackbox_rows').insert(payload);
  if (insErr) {
    // 23505 = unique_violation（ASIN 或 URL 任一重复）
    if ((insErr as any).code === '23505') { skipped++; continue; }
    return res.status(500).json({ error: insErr.message });
  }
  inserted++;
}

res.status(200).json({ fileId: f.id, stats: { inserted, skipped, invalid } });
}); }

6.2 /pages/api/files/[id]/rows.ts（分页读取） import type { NextApiRequest, NextApiResponse } from 'next'; import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) { const { id } = req.query as { id: string }; const page = Number(req.query.page || 1); const pageSize = Math.min(Number(req.query.pageSize || 100), 500); const from = (page - 1) * pageSize; const to = from + pageSize - 1;

const { data, error, count } = await supabase .from('v_blackbox_rows_with_scores') .select('*', { count: 'exact' }) .eq('file_id', id) .order('row_index', { ascending: true }) .range(from, to);

if (error) return res.status(500).json({ error: error.message }); res.status(200).json({ page, pageSize, total: count || 0, rows: data }); }

6.3 评分方案（profiles）

/pages/api/scoring-profiles/index.ts

import type { NextApiRequest, NextApiResponse } from 'next'; import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) { if (req.method === 'GET') { const { data: profiles, error } = await supabase.from('scoring_profiles').select('*').order('created_at', { ascending: false }); if (error) return res.status(500).json({ error: error.message }); res.status(200).json({ profiles }); } else if (req.method === 'POST') { const { name, description, params } = req.body; const { data: p, error: e1 } = await supabase.from('scoring_profiles').insert({ name, description, is_active: false, created_by: 'web' }).select('id').single(); if (e1) return res.status(500).json({ error: e1.message }); const { error: e2 } = await supabase.from('scoring_profile_revisions').insert({ profile_id: p.id, version: 1, params, changelog: 'init', created_by: 'web' }); if (e2) return res.status(500).json({ error: e2.message }); res.status(200).json({ profileId: p.id }); } else { res.status(405).end(); } }

/pages/api/scoring-profiles/[id].ts

import type { NextApiRequest, NextApiResponse } from 'next'; import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) { const { id } = req.query as { id: string };

if (req.method === 'GET') { // 取最新版本的 params const { data, error } = await supabase .from('scoring_profile_revisions') .select('version, params') .eq('profile_id', id) .order('version', { ascending: false }) .limit(1) .single();

if (error) return res.status(500).json({ error: error.message });
return res.status(200).json({ latest: data });
}

if (req.method === 'POST') { // 新建一个版本 const { params, changelog } = req.body; const { data: last, error: e1 } = await supabase .from('scoring_profile_revisions') .select('version') .eq('profile_id', id) .order('version', { ascending: false }) .limit(1) .single(); if (e1) return res.status(500).json({ error: e1.message });

const nextVersion = (last?.version || 0) + 1;
const { error: e2 } = await supabase
  .from('scoring_profile_revisions')
  .insert({ profile_id: id, version: nextVersion, params, changelog: changelog || `v${nextVersion}`, created_by: 'web' });

if (e2) return res.status(500).json({ error: e2.message });
return res.status(200).json({ version: nextVersion });
}

res.status(405).end(); }

6.4 评分预览与全量重算

/pages/api/score/preview.ts

import type { NextApiRequest, NextApiResponse } from 'next'; import { scoreRowByParams } from '@/lib/scoring/engine';

export default function handler(req: NextApiRequest, res: NextApiResponse) { if (req.method !== 'POST') return res.status(405).end(); const { params, sampleRows = [], limit = 100 } = req.body as { params:any; sampleRows:any[]; limit?:number }; const scored = sampleRows.map(r => ({ ...r, _score: scoreRowByParams(r.data || r, params) })) .sort((a,b)=>b._score - a._score) .slice(0, limit); res.status(200).json({ top: scored }); }

/pages/api/score/apply.ts

import type { NextApiRequest, NextApiResponse } from 'next'; import { supabase } from '@/lib/supabase'; import { scoreRowByParams } from '@/lib/scoring/engine';

export default async function handler(req: NextApiRequest, res: NextApiResponse) { if (req.method !== 'POST') return res.status(405).end(); const { fileId, params, writeTo = 'both' } = req.body as { fileId:string; params:any; writeTo?: 'platform'|'independent'|'both' };

// 分页读取 blackbox_rows const pageSize = 500; let from = 0; let totalWritten = 0;

while (true) { const { data: rows, error, count } = await supabase .from('blackbox_rows') .select('*', { count: 'exact' }) .eq('file_id', fileId) .order('row_index', { ascending: true }) .range(from, from + pageSize - 1);

if (error) return res.status(500).json({ error: error.message });
if (!rows || rows.length === 0) break;

// 批量打分
const payload = rows.map(r => {
  const s = scoreRowByParams(r.data, params);
  return {
    row_id: r.id,
    platform_score: (writeTo === 'platform' || writeTo === 'both') ? s : undefined,
    independent_score: (writeTo === 'independent' || writeTo === 'both') ? s : undefined,
    meta: null,
  };
});

// upsert by row_id（使用 insert + on conflict 需要 Supabase RLS 关闭或配置）
for (const item of payload) {
  const { error: e } = await supabase
    .from('product_scores')
    .upsert(item, { onConflict: 'row_id' });
  if (e) return res.status(500).json({ error: e.message });
}

totalWritten += rows.length;
from += pageSize;
if (rows.length < pageSize) break;
}

res.status(200).json({ ok: true, updated: totalWritten }); }

前端页面 7.1 /pages/index.tsx（上传入口） import UploadForm from '@/components/UploadForm';
export default function Home() { return (

产品选品平台（文本导入）
); }
7.2 components/UploadForm.tsx 'use client'; import { useState } from 'react';

export default function UploadForm() { const [file, setFile] = useState<File | null>(null); const [msg, setMsg] = useState('');

const handleUpload = async () => { if (!file) return; const fd = new FormData(); fd.append('file', file); const res = await fetch('/api/upload', { method: 'POST', body: fd }); const data = await res.json(); if (!res.ok) { setMsg(data.error || '上传失败'); return; } setMsg(完成：新增 ${data.stats.inserted} 行，跳过 ${data.stats.skipped} 行，非法 ${data.stats.invalid} 行。FileId=${data.fileId}); // 可跳转到 /file/${data.fileId} };

return (

<input type="file" accept=".xlsx,.csv" onChange={e=>setFile(e.target.files?.[0] || null)} /> 上传并入库 {msg &&
{msg}
}
); }
7.3 /pages/file/[id].tsx（文件详情：动态全列 + 分数） 'use client'; import { useEffect, useMemo, useState } from 'react'; import { useRouter } from 'next/router';

export default function FileDetail() { const router = useRouter(); const { id } = router.query as { id: string }; const [rows, setRows] = useState<any[]>([]); const [page, setPage] = useState(1); const [total, setTotal] = useState(0); const pageSize = 100;

useEffect(() => { if (!id) return; (async () => { const res = await fetch(/api/files/${id}/rows?page=${page}&pageSize=${pageSize}); const data = await res.json(); setRows(data.rows || []); setTotal(data.total || 0); })(); }, [id, page]);

const columns = useMemo(() => { // 聚合所有 data 的键作为表头 const set = new Set(); rows.forEach(r => Object.keys(r.data || {}).forEach(k => set.add(k))); const cols = Array.from(set); // 附加两个评分列 return ['ASIN','URL','Product Title', ...cols.filter(c=>!['ASIN','URL','Product Title'].includes(c)), 'platform_score','independent_score']; }, [rows]);

return (

文件详情 #{id}
{columns.map(c=>)} {rows.map((r, i)=>( <tr key={r.row_id || i} className="border-b"> {columns.map(c=>{ if (c==='platform_score') return ; if (c==='independent_score') return ; if (c==='ASIN') return ; if (c==='URL') return ; if (c==='Product Title') return ; return ; })} ))}
{c}
{r.platform_score?.toFixed?.(1) ?? ''}	{r.independent_score?.toFixed?.(1) ?? ''}	{r.asin || r.data?.ASIN || ''}	<a className="text-blue-600 underline" href={r.url || r.data?.URL} target="_blank">{r.url || r.data?.URL || ''}	{r.title || r.data?.['Product Title'] || ''}	{String(r.data?.[c] ?? '')}
<button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="px-3 py-1 border rounded">上一页 第 {page} 页 / 共 {Math.ceil(total/pageSize)} 页 =Math.ceil(total/pageSize)} onClick={()=>setPage(p=>p+1)} className="px-3 py-1 border rounded">下一页
); }
7.4 /pages/settings.tsx（评分参数配置 + 实时预览 + 保存 + 全量重算） 'use client'; import { useEffect, useMemo, useState } from 'react'; import { scoreRowByParams } from '@/lib/scoring/engine';

export default function SettingsPage() { const [profiles, setProfiles] = useState<any[]>([]); const [profileId, setProfileId] = useState(''); const [latest, setLatest] = useState(null); const [sample, setSample] = useState<any[]>([]); const [fileId, setFileId] = useState(''); const [msg, setMsg] = useState('');

useEffect(()=>{ (async()=>{ const res = await fetch('/api/scoring-profiles'); const data = await res.json(); setProfiles(data.profiles || []); if (data.profiles?.[0]?.id) setProfileId(data.profiles[0].id); })(); },[]);

useEffect(()=>{ (async()=>{ if (!profileId) return; const res = await fetch(/api/scoring-profiles/${profileId}); const data = await res.json(); setLatest(data.latest || null); })(); },[profileId]);

// 拉一点样本数据 const loadSample = async () => { if (!fileId) { setMsg('请先输入 fileId'); return; } const res = await fetch(/api/files/${fileId}/rows?page=1&pageSize=200); const data = await res.json(); setSample(data.rows || []); setMsg(已加载样本 ${data.rows?.length || 0} 行); };

const weightsSum = useMemo(()=> (latest?.params?.dimensions||[]).reduce((a:number,d:any)=>a+(d.weight||0),0), [latest]); const scored = useMemo(()=>{ if (!latest?.params || sample.length===0) return []; return sample.map(r => ({ ...r, _score: scoreRowByParams(r.data || r, latest.params) })) .sort((a,b)=>b._score - a._score) .slice(0,100); }, [latest, sample]);

const saveNewRevision = async () => { if (!profileId || !latest?.params) return; const res = await fetch(/api/scoring-profiles/${profileId}, { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ params: latest.params, changelog: 'adjust weights' }) }); const data = await res.json(); if (!res.ok) setMsg(data.error || '保存失败'); else setMsg(已保存版本 v${data.version}); };

const applyAll = async (writeTo: 'platform'|'independent'|'both' = 'both') => { if (!fileId || !latest?.params) { setMsg('缺少 fileId 或 params'); return; } const res = await fetch('/api/score/apply', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ fileId, params: latest.params, writeTo }) }); const data = await res.json(); if (!res.ok) setMsg(data.error || '重算失败'); else setMsg(重算完成，更新 ${data.updated} 行); };

return (

评分参数设置
  <div className="flex gap-3 items-center">
    <select value={profileId} onChange={e=>setProfileId(e.target.value)} className="border px-2 py-1">
      {profiles.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
    </select>
    <input placeholder="fileId（用于样本/全量）" value={fileId} onChange={e=>setFileId(e.target.value)} className="border px-2 py-1" />
    <button onClick={loadSample} className="px-3 py-1 border rounded">加载样本</button>
    <span className="text-sm text-gray-500">{msg}</span>
  </div>

  {latest?.params && (
    <>
      <div className="text-sm">
        权重合计：<b>{weightsSum.toFixed(2)}</b>（应为 1.00）
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {(latest.params.dimensions || []).map((d:any, i:number)=>(
          <div key={d.key} className="border rounded p-3 space-y-2">
            <div className="font-semibold">{d.label} <span className="text-xs text-gray-500">({d.key})</span></div>
            <div className="text-xs text-gray-500">{d.explain}</div>
            <div className="flex items-center gap-2">
              <input type="range" min={0} max={0.2} step={0.005}
                value={d.weight}
                onChange={e=>{
                  const np = { ...latest, params: {...latest.params} };
                  np.params.dimensions = [...latest.params.dimensions];
                  np.params.dimensions[i] = { ...d, weight: Number(e.target.value) };
                  setLatest(np);
                }}
              />
              <span className="w-16 text-right">{d.weight.toFixed(3)}</span>
            </div>
            {/* 可加更细分段编辑UI，这里略 */}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button className="px-3 py-2 bg-gray-200 rounded" onClick={()=>window.location.reload()}>恢复页面初始</button>
        <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={saveNewRevision}>保存为新版本</button>
        <button className="px-3 py-2 bg-emerald-600 text-white rounded" onClick={()=>applyAll('both')}>应用到全量（两套分）</button>
      </div>

      <h2 className="text-lg font-semibold mt-4">实时预览 Top 100</h2>
      <div className="border rounded max-h-[400px] overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="sticky top-0 bg-white">
            <tr><th className="text-left px-2 py-1">#</th><th className="text-left px-2 py-1">ASIN</th><th className="text-left px-2 py-1">Title</th><th className="text-left px-2 py-1">Price</th><th className="text-left px-2 py-1">Score</th></tr>
          </thead>
          <tbody>
            {scored.map((r:any, idx:number)=>(
              <tr key={r.row_id || idx} className="border-b">
                <td className="px-2 py-1">{idx+1}</td>
                <td className="px-2 py-1">{r.asin || r.data?.ASIN}</td>
                <td className="px-2 py-1 max-w-[520px] truncate">{r.title || r.data?.['Product Title']}</td>
                <td className="px-2 py-1">{r.data?.Price}</td>
                <td className="px-2 py-1 font-semibold">{r._score.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )}
</main>
); }

运行与部署 本地开发 npm run dev
部署到 Vercel

连接 GitHub 仓库

Vercel → Project Settings → Environment Variables：

NEXT_PUBLIC_SUPABASE_URL

NEXT_PUBLIC_SUPABASE_ANON_KEY

Deploy

测试流程（端到端）
执行数据库脚本（建表/索引/视图 + 两套默认评分方案）。

本地 npm run dev，打开 http://localhost:3000/。

首页上传 US_AMAZON_blackBoxProducts_*.xlsx（或 CSV）。完成后得到 fileId 和插入统计（重复/非法行会被跳过）。

打开 /file/{fileId} 查看全列+分数。

打开 /settings：

在输入框填入 fileId，点击“加载样本”。

拖动权重滑杆，右侧实时 Top100 排名变更。

“保存为新版本”生成 profile 新 revision。

“应用到全量”对该 fileId 的所有行写入 product_scores（可按需只写某一套分）。

备注与可选增强
URL 规范化：上传 API 可在写库前去除 utm_* 等追踪参数，增强去重效果。

超大数据集：将行插入改为分批批量 + “预查已存在 ASIN/URL 集合后本地过滤”，会更快更省配额。

RLS：若开启 Supabase RLS，请为相关表配置政策，或在服务端使用 Service Role Key。

参数编辑器：当前仅做权重滑杆；维度分段（segments）可做弹窗表单编辑。

多文件合并筛选：可增 /api/search 支持跨文件条件查询（价格/评分区间/关键词等）。


# PROJECT_GUIDE.md（合并版）

## 1. 项目简介
本项目是一个综合选品平台，支持 **平台站** 与 **独立站** 两套不同的选品逻辑。  
- 数据来源：Helium10 BlackBox 导出表格（Excel/CSV）。  
- 存储层：Supabase PostgreSQL。  
- 前端框架：Next.js + Vercel 部署。  
- 功能目标：上传选品表 → 自动计算评分 → 推荐 ≥55 分的产品，并用颜色区分 ≥70 分（绿色）与 55–69.9（橙色）。点击产品行可进入详情页展示完整数据。  

---

## 2. 数据库设计（Supabase SQL 初始化）

```sql
-- 文件表
create table if not exists blackbox_files (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  sheet_name text,
  row_count int,
  column_names jsonb,
  uploaded_by text,
  inserted_count int default 0,
  skipped_count int default 0,
  invalid_count int default 0,
  uploaded_at timestamptz default now()
);

-- 行表
create table if not exists blackbox_rows (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references blackbox_files(id) on delete cascade,
  row_index int,
  asin text,
  url text,
  title text,
  data jsonb not null,
  inserted_at timestamptz default now(),
  asin_norm text generated always as (nullif(lower(btrim(asin)), '')) stored,
  url_norm  text generated always as (nullif(lower(btrim(url)),  '')) stored
);
create unique index if not exists uq_blackbox_rows_asin_norm on blackbox_rows(asin_norm) where asin_norm is not null;
create unique index if not exists uq_blackbox_rows_url_norm  on blackbox_rows(url_norm)  where url_norm  is not null;

-- 打分表
create table if not exists product_scores (
  id uuid primary key default gen_random_uuid(),
  row_id uuid not null references blackbox_rows(id) on delete cascade,
  platform_score numeric,
  independent_score numeric,
  meta jsonb,
  scored_at timestamptz default now()
);

-- 评分配置表
create table if not exists scoring_profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  is_active boolean default false,
  created_by text,
  created_at timestamptz default now()
);

create table if not exists scoring_profile_revisions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references scoring_profiles(id) on delete cascade,
  version int not null,
  params jsonb not null,
  changelog text,
  created_by text,
  created_at timestamptz default now()
);
```

---

## 3. 评分标准

### 平台站
- **85–100**：优质产品 → 重点关注  
- **70–85**：潜力产品 → 小批量试水  
- **55–70**：一般产品 → 可少量关注  
- **<55**：低潜产品 → 不建议  

主要权重：ASIN 销量（0.11）、销量趋势（0.09）、评论数量 & 评分（各 0.09）、卖家数（0.07）、历史销量/同比（各 0.07）。  

### 独立站
- **85–100**：优质产品  
- **70–85**：潜力产品  
- **55–70**：一般产品  
- **<55**：低潜产品  

主要权重：价格（≥400 满分，权重 0.08）、新品年龄 ≤6 月（权重 0.09）、评论联动（0.12）、卖家数（0.08）、销量趋势/收入等。  

---

## 4. Google Apps Script 脚本（旧流程参考）

- **平台站打分**：`平台选品评分.js`  
- **独立站打分**：`独立站选品评分.js`  
- **选品归集**：筛选综合评分 ≥55 的产品，同步到 `recommendation production` Sheet。  

> 现已迁移到 Supabase + Next.js，但评分逻辑保持一致，供 Codex 转换为 `lib/scoring/engine.ts`。

---

## 5. Web 前端设计

### 上传页 `/`
- Excel 上传 → 调用 `/api/upload`  
- 自动去重（asin/url），存储入库  
- 上传后跳转到 `/file/{fileId}?scheme=platform&minScore=55`  

### 文件页 `/file/[fileId]`
- 表格展示产品：
- - **≥85 分** → 红色标识 
  - **70–84.99 ** → 绿色标识  
  - **55–69.9** → 橙色标识  
- 支持切换 scoring scheme：platform / independent  
- 点击行 → 跳 `/product/[rowId]`  

### 产品详情 `/product/[rowId]`
- 展示：标题、URL（点击跳亚马逊）、价格、销量、收入、评论、卖家数、仓储费用、年龄等完整字段。  
- 展示两套评分（平台站 / 独立站），并标明等级（优质、潜力、一般、低潜）。  

### 设置页 `/settings`
- 展示当前参数 JSON（weights & rules）  
- 支持调整权重（表单输入）  
- “保存新版本” → 新建 `scoring_profile_revisions`  
- “应用” → 重新计算全量评分  

---

## 6. 部署要求（Vercel）

- Framework Preset: **Next.js**  
- Build Command: `next build`  
- Output Directory: **留空**（Vercel 自动用 `.next`）  
- 环境变量：  
  - `NEXT_PUBLIC_SUPABASE_URL`  
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`  

---

## 7. Codex 执行指令

1. 按本文档创建 Next.js + Supabase 项目。  
2. 文件输出规则：  
   - 用 `### File: <路径>` 标明  
   - 紧随代码块完整写出文件内容（不要省略）。  
3. 必须创建：  
   - `lib/supabase.ts`  
   - `lib/scoring/field.ts`  
   - `lib/scoring/engine.ts`  
   - `utils/parseExcel.ts`  
   - `pages/api/upload.ts`  
   - `pages/file/[id].tsx`  
   - `pages/product/[id].tsx`  
   - `pages/settings.tsx`  
   - `pages/index.tsx`  
4. 完成后打印 `tree` 目录结构和启动命令。  

---

## 8. 颜色 & 推荐逻辑
- **score ≥85**：红色徽章 → 推荐重点关注 
- **70 ≤ score < 85**：绿色徽章 → 推荐重点关注  
- **55 ≤ score < 70**：橙色徽章 → 潜力观察  
- **<55**：默认隐藏（仅在详情页可见）  

