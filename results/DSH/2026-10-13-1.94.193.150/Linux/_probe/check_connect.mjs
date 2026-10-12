import { hdk } from './core.mjs';
const h = await hdk();
const t0 = Date.now();
try {
  const c = await h.tools.callTool('huaweicloud_sandbox_connect', { source: 'DSH' });
  console.log('sandbox_connect (', Date.now()-t0, 'ms) =>', JSON.stringify(c).slice(0, 1200));
} catch(e){ console.log('sandbox_connect threw after', Date.now()-t0, 'ms:', String(e).slice(0, 500)); }
