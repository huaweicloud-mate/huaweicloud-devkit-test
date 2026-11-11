// Real probe for EXP-D5-7-3 (OfficeAce tools/list enumeration) + EXP-E01 route root cause
import { createRequire } from 'module';
const require = createRequire('file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-3/node_modules/huaweicloud-devkit/');
const pkgPath = 'C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-3/node_modules/huaweicloud-devkit/package.json';
const fs = await import('fs');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
console.log('installed version:', pkg.version);

// load tool registry from installed package
const toolsMod = await import('file:///C:/Users/Administrator/.workbuddy/binaries/node/versions/22.22.2-3/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src/tools.mjs');
const keys = Object.keys(toolsMod);
console.log('tools.mjs exports:', keys.join(','));
let tools = null;
for (const k of keys) {
  const v = toolsMod[k];
  if (Array.isArray(v) && v.length > 10 && v[0] && v[0].name) { tools = v; console.log('candidate array:', k, v.length); }
  else if (v && typeof v === 'object' && !Array.isArray(v) && v.tools) { tools = v.tools; console.log('candidate obj.tools:', k, v.tools.length); }
}
if (!tools) { console.log('NO tool registry found in exports'); process.exit(0); }
const names = tools.map(t => t.name);
console.log('tool count:', names.length);
const huawei = names.filter(n => n.startsWith('huaweicloud_'));
console.log('huaweicloud_* count:', huawei.length);
const noSchema = tools.filter(t => !t.inputSchema || typeof t.inputSchema !== 'object').map(t => t.name);
const noDesc = tools.filter(t => !t.description).map(t => t.name);
console.log('schema missing:', JSON.stringify(noSchema), 'desc missing:', JSON.stringify(noDesc));
console.log('sample:', names.slice(0, 12).join(', '));
