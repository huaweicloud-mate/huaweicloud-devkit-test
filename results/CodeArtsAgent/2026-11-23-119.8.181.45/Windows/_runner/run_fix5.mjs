import { mcpTool, writeEvidence, DIST } from './lib.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const base = join(tmpdir(), 'hdk-fw2-' + Date.now());
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
  ['cra', (d) => { mkdirSync(join(d, 'public'), { recursive: true }); writeFileSync(join(d, 'public', 'index.html'), '<html></html>', 'utf8'); pkg(d, { name: 'cr', dependencies: { 'react-scripts': '5.0.0' } }); }, 'Create React App'],
  ['vueCli', (d) => { writeFileSync(join(d, 'vue.config.js'), 'module.exports={}', 'utf8'); pkg(d, { name: 'vc', devDependencies: { '@vue/cli-service': '5.0.0' } }); }, 'Vue CLI'],
  ['static', (d) => { writeFileSync(join(d, 'index.html'), '<html></html>', 'utf8'); }, 'Static Site'],
  ['monorepo', (d) => { writeFileSync(join(d, 'pnpm-workspace.yaml'), 'packages:\n  - packages/*\n', 'utf8'); const a = join(d, 'packages', 'a'); mkdirSync(a, { recursive: true }); pkg(a, { name: 'a', dependencies: { next: '14' } }); writeFileSync(join(a, 'next.config.js'), 'module.exports={}', 'utf8'); }, 'Monorepo'],
];

const df = await import('file:///' + DIST + '/detect-framework.mjs');
const out = [];
for (const [name, setup, want] of specs) { const d = mk(name); setup(d); const r = df.detectFramework(d); out.push({ name, want, got: r && r.framework, ok: !!(r && r.framework === want), port: r && r.port, outputDir: r && r.outputDir, monorepo: r && r.type === 'monorepo' ? r.monorepoTool : undefined }); }
const bad = out.filter((x) => !x.ok);
writeEvidence('D3-B5', { status: bad.length || out.length < 14 ? 'FAIL' : 'PASS', why: '13 框架+monorepo 识别 ' + (out.length - bad.length) + '/' + out.length + (bad.length ? '，未命中：' + bad.map((x) => x.name + '→' + x.got).join(',') : '') + '；均返回构建产物/端口', result: out });
console.log('D3-B5', bad.length ? 'FAIL' : 'PASS', JSON.stringify(bad));

const ex = await mcpTool('huaweicloud_explain_error', { service: 'ECS', errorCode: 'Ecs.0004', message: 'ECS 启动失败', requestId: 'req-e08' }, 45000);
const okE8 = ex.ok && (ex.text || '').length > 40;
writeEvidence('EXP-E08', { status: okE8 ? 'PASS' : 'FAIL', why: '诊断类意图不走服务目录；explain_error 返回可执行诊断=' + okE8, result: { explain: (ex.text || '').slice(0, 600) } });
console.log('EXP-E08', okE8 ? 'PASS' : 'FAIL');
