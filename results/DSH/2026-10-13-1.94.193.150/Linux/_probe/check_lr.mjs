import { hdk } from './core.mjs';
const h = await hdk();
const t0 = Date.now();
try {
  const lr = await h.tools.callTool('huaweicloud_list_regions', {});
  console.log('list_regions (', Date.now()-t0, 'ms) =>', JSON.stringify(lr).slice(0, 900));
} catch(e){ console.log('list_regions threw after', Date.now()-t0, 'ms:', String(e).slice(0,300)); }
