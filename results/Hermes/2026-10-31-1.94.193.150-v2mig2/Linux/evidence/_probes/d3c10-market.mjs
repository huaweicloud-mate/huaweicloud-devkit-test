// v2mig2 补测 —— D3-C10 市场分类列表 复验（真机执行，直调 dist product）
// 目的：复验前一版 FAIL，判断「分类列表为空」是真缺陷还是上游索引弃用。
import { pathToFileURL } from 'node:url';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const SRC = process.argv[2];   // .../plugins/huaweicloud-core/dist
const OUT = process.argv[3];   // .../evidence
const M = await import(pathToFileURL(`${SRC}/search-market.js`).href);

const lines = [];
const executedAt = new Date().toISOString();

// 1) 直调 getMarketplaceCategories（产品真实路径）
let cats = null, catErr = null;
try { cats = await M.getMarketplaceCategories(); }
catch (e) { catErr = 'getMarketplaceCategories: ' + e.message; }
lines.push(`getMarketplaceCategories -> ${catErr || JSON.stringify(cats)}`);

// 2) 直查上游索引原始内容，判定「空分类」来源
const INDEX_URL = 'https://gitcode.com/api/v5/repos/2501_91318609/skills-for-index/contents/skills-index/index.json?ref=main';
let raw = null, rawErr = null;
try {
  const r = await fetch(INDEX_URL, { headers: { 'User-Agent': 'huaweicloud-devkit/1.0' } });
  const data = await r.json();
  if (data && data.encoding === 'base64' && typeof data.content === 'string') {
    raw = JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'));
  } else {
    raw = data;
  }
} catch (e) { rawErr = 'fetch index: ' + e.message; }
if (raw) {
  lines.push(`上游索引 total_skills=${raw.total_skills} categories.length=${Array.isArray(raw.categories) ? raw.categories.length : 'n/a'} deprecated=${raw.deprecated}`);
  if (raw.migrate_message) lines.push(`上游 migrate_message=${raw.migrate_message}`);
} else {
  lines.push(`上游索引读取失败: ${rawErr}`);
}

// 3) searchMarketplace 空查（确认市场搜索还能给出迁移指引 skill）
let search = null, sErr = null;
try { search = await M.searchMarketplace('', ''); }
catch (e) { sErr = 'searchMarketplace: ' + e.message; }
if (search) {
  const names = (search.results || []).map((x) => x.name).slice(0, 5);
  lines.push(`searchMarketplace('') 空查 -> ok=${search.ok} count=${search.count} 结果=${JSON.stringify(names)}`);
} else {
  lines.push(`searchMarketplace 错误: ${sErr}`);
}

// 判定：机制（fetch→parse→ok:true）正常，但分类列表为空源于上游 gitcode 索引 deprecated
const mechanismOk = !catErr && cats && cats.ok === true;
const sourceDeprecated = raw && raw.deprecated === true;
const emptyCategories = Array.isArray(cats?.categories) && cats.categories.length === 0;
// 真缺陷定性：分类列表为空 = 上游数据源弃用，非 v2 代码路径崩溃
const status = (mechanismOk && emptyCategories && sourceDeprecated) ? 'FAIL'
  : (mechanismOk && Array.isArray(cats?.categories) && cats.categories.length > 0) ? 'PASS'
  : 'FAIL';
const why = (mechanismOk && sourceDeprecated && emptyCategories)
  ? 'getMarketplaceCategories 机制正常(ok:true)，但返回 categories=[] —— 上游 gitcode skills-for-index 索引已弃用(deprecated=true, total_skills=0, migrate_message="本索引已停止维护，请升级 huawei-cloud-find-skills")。search-market.js INDEX_URL 仍指向旧弃用索引(文件:行号 plugins/huaweicloud-core/dist/search-market.js:3)，未迁移到新索引源(huaweicloud/huaweicloud-skills)。属数据源/契约漂移，非 v2 代码回归。'
  : (catErr || rawErr || `分类数=${cats?.categories?.length}`);

const body = `=====CASE D3-C10 =====\nexecutedAt=${executedAt}\nstatus=${status}\n${lines.join('\n')}\nwhy=${why}\n=====CASE D3-C10 RESULT: ${status} =====\n`;
const json = JSON.stringify({ status, why, executedAt }, null, 1);
const dir = join(OUT, 'D3-C10');
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'stdout.log'), json);
writeFileSync(join(dir, 'stdout.txt'), body);
console.log('[D3-C10]', status);
console.log(body);
process.exit(0);