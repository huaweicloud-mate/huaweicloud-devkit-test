import { hdk, run, sh, ok, fail, blocked } from './core.mjs';
const h = await hdk();
// 1. list regions availability (cross-region D3-C7)
try {
  const lr = await h.tools.callTool('huaweicloud_list_regions', {});
  console.log('list_regions =>', JSON.stringify(lr).slice(0, 600));
} catch(e){ console.log('list_regions threw', String(e).slice(0,200)); }
// 2. sandbox_connect (for D3-C6/C3)
try {
  const c = await h.tools.callTool('huaweicloud_sandbox_connect', { source: 'DSH' });
  console.log('sandbox_connect =>', JSON.stringify(c).slice(0, 600));
} catch(e){ console.log('sandbox_connect threw', String(e).slice(0, 400)); }
