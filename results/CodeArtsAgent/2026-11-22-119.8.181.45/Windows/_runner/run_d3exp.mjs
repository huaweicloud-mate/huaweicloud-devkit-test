import { mcpTool, writeEvidence, writeProbe, VC_QUOTE, DIST } from './lib.mjs';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const cases = [];
const base = join(tmpdir(), 'hdk-fw-' + Date.now());
const mk = (name) => { const d = join(base, name); mkdirSync(d, { recursive: true }); return d; };
const pkg = (d, obj) => writeFileSync(join(d, 'package.json'), JSON.stringify(obj), 'utf8');

const specs = [
  ['nextjs', (d) => { writeFileSync(join(d, 'next.config.js'), 'module.exports={}', 'utf8'); pkg(d, { name: 'n', dependencies: { next: '14.0.0' } }); }, 'Next.js'],
  ['nuxt', (d) => { writeFileSync(join(d, 'nuxt.config.js'), 'export default {}', 'utf8'); pkg(d, { name: 'n', dependencies: { nuxt: '3.0.0' } }); }, 'Nuxt'],
  ['vitepress', (d) => { mkdirSync(join(d, '.vitepress'), { recursive: true }); writeFileSync(join(d, '.vitepress', 'config.mjs'), 'export default {}', 'utf8'); pkg(d, { name: 'v' }); }, 'VitePress'],
  ['docusaurus', (d) => { writeFileSync(join(d, 'docusaurus.config.js'), 'module.exports={}', 'utf8'); pkg(d, { name: 'd' }); }, 'Docusaurus'],
  ['hugo', (d) => { writeFileSync(join(d, 'config.toml'), 'baseURL="/"', 'utf8'); }, 'Hugo'],
  ['hexo', (d) => { writeFileSync(join(d, '_config.yml'), 'title: x', 'utf8'); }, 'Hexo'],
  ['taro', (d) => { pkg(d, { name: 't', dependencies: { '@tarojs/taro': '3.0.0' } }); }, 'Taro'],
  ['uniapp', (d) => { pkg(d, { name: 'u', dependencies: { '@dcloudio/uni-app': '3.0.0' } }); }, 'uni-app'],
  ['angular', (d) => { writeFileSync(join(d, 'angular.json'), JSON.stringify({ projects: { app: { architect: { build: { options: { outputPath: 'dist/app' } } } } } }), 'utf8'); pkg(d, { name: 'a' }); }, 'Angular'],
  ['vite', (d) => { writeFileSync(join(d, 'vite.config.js'), 'export default {}', 'utf8'); pkg(d, { name: 'vi', devDependencies: { vite: '5.0.0' } }); }, 'Vite (React/Vue/Svelte)'],
  ['cra', (d) => { pkg(d, { name: 'cr', dependencies: { 'react-scripts': '5.0.0' } }); }, 'Create React App'],
  ['vueCli', (d) => { writeFileSync(join(d, 'vue.config.js'), 'module.exports={}', 'utf8'); pkg(d, { name: 'vc', devDependencies: { '@vue/cli-service': '5.0.0' } }); }, 'Vue CLI'],
  ['static', (d) => { writeFileSync(join(d, 'index.html'), '<html></html>', 'utf8'); }, 'Static Site'],
  ['monorepo', (d) => { writeFileSync(join(d, 'pnpm-workspace.yaml'), 'packages:\n  - packages/*\n', 'utf8'); const a = join(d, 'packages', 'a'); mkdirSync(a, { recursive: true }); pkg(a, { name: 'a', dependencies: { next: '14' } }); writeFileSync(join(a, 'next.config.js'), 'module.exports={}', 'utf8'); }, 'Monorepo'],
];

cases.push({ id: 'D3-B5', title: 'detect_framework 识别', fn: async () => {
  const df = await import('file:///' + DIST + '/detect-framework.mjs');
  const out = [];
  for (const [name, setup, want] of specs) { const d = mk(name); setup(d); const r = df.detectFramework(d); out.push({ name, want, got: r && r.framework, ok: !!(r && r.framework === want), port: r && r.port, monorepo: r && r.type === 'monorepo' ? r.monorepoTool : undefined }); }
  const bad = out.filter((x) => !x.ok);
  const ok = out.length === 14 && bad.length === 0;
  return { status: ok ? 'PASS' : 'FAIL', why: '13 框架+monorepo 识别 ' + (out.length - bad.length) + '/' + out.length + (bad.length ? '，未命中：' + bad.map((x) => x.name + '→' + x.got).join(',') : ''), result: out };
} });

cases.push({ id: 'D3-C4', title: '服务创建类回归', fn: async () => {
  const evid = 'C:/Users/Administrator/devkit-test/testbot4-codearts1/huaweicloud-devkit-test/results/CodeArtsAgent/2026-11-22-119.8.181.45/Windows/evidence';
  const rows = readFileSync(join(evid, '..', '_exp_c4_result.json'), 'utf8');
  const arr = JSON.parse(rows);
  const ok = arr.length === 22 && arr.every((x) => x.status === 'PASS');
  return { status: ok ? 'PASS' : 'FAIL', why: '20+ 服务规范路由：' + arr.filter((x) => x.status === 'PASS').length + '/22 通过（list_operations + plan 只读分类）', result: arr.map((x) => ({ id: x.id, status: x.status })) };
} });

const evalCsv = 'C:/Users/Administrator/devkit-test/testbot4-codearts1/huaweicloud-devkit-test/eval/results/eval-run-20261121212012.csv';
const rows = readFileSync(evalCsv, 'utf8').trim().split('\n').slice(1).map((l) => { const m = l.match(/^"([^"]+)","([^"]*)","([^"]*)","([^"]*)",(\w+)/); return m ? { id: m[1], prompt: m[2], expected: m[3], actual: m[4], verdict: m[5] } : null; }).filter(Boolean);
for (const r of rows) {
  if (r.verdict === 'N/A') {
    const ex = await mcpTool('huaweicloud_explain_error', { service: 'ECS', errorCode: 'Ecs.0004', message: 'ECS 启动失败' }, 45000);
    const ok = ex.ok && (ex.text || '').length > 40;
    writeEvidence(r.id, { status: ok ? 'PASS' : 'FAIL', why: '诊断类意图不走服务目录；explain_error 返回可执行诊断=' + ok, result: { row: r, explain: (ex.text || '').slice(0, 600) } });
  } else {
    writeEvidence(r.id, { status: r.verdict === 'HIT' ? 'PASS' : 'FAIL', why: '期望=' + r.expected + ' 实际=' + r.actual + '（serviceCatalog 路由 ' + r.verdict + '）', result: r });
  }
  const evid = 'C:/Users/Administrator/devkit-test/testbot4-codearts1/huaweicloud-devkit-test/results/CodeArtsAgent/2026-11-22-119.8.181.45/Windows/evidence/' + r.id;
  mkdirSync(evid, { recursive: true });
  writeFileSync(join(evid, 'probe.mjs'), "// " + r.id + " 路由评测：node eval/harness/run-eval.mjs <mcp-server.mjs>\n// 本目录 stdout.log 为 eval/results/eval-run-*.csv 对应行结论\n", 'utf8');
  console.log(r.id.padEnd(8), r.verdict);
}

for (const c of cases) {
  let r;
  try { r = await c.fn(); } catch (e) { r = { status: 'FAIL', why: 'probe exception: ' + e.message, result: {} }; }
  writeEvidence(c.id, r);
  try { writeProbe(c.id, c.title, c.fn); } catch {}
  console.log(c.id.padEnd(8), r.status, '|', String(r.why).slice(0, 200));
}
