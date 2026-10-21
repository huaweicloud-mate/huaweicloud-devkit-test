import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
const hdkSrc = 'C:\\Users\\Administrator\\multica_workspaces\\vector-8988c3df7bc9\\task-fe1b399ab162\\hermes-home\\tools\\node-26.7.0-win32-x64\\node_modules\\huaweicloud-devkit\\plugins\\huaweicloud-core\\src';
const mod = await import(pathToFileURL(join(hdkSrc, 'tools.mjs')).href);
const fns = Object.keys(mod).filter(k => k.toLowerCase().includes('catalog') || k.toLowerCase().includes('service'));
console.log('catalog/service fns:', JSON.stringify(fns));

// Check if serviceCatalog is a function
const sc = mod.serviceCatalog;
if (sc) {
  console.log('serviceCatalog type:', typeof sc);
  try {
    const r = sc('查看ECS实例');
    console.log('result:', JSON.stringify(r).slice(0, 200));
  } catch(e) {
    console.log('error:', e.message.slice(0, 100));
  }
} else {
  console.log('serviceCatalog not found directly');
  // Maybe it's in mcp-protocol
  const mp = await import(pathToFileURL(join(hdkSrc, 'mcp-protocol.mjs')).href);
  const mpFns = Object.keys(mp).filter(k => k.toLowerCase().includes('catalog') || k.toLowerCase().includes('service'));
  console.log('mcp-protocol catalog fns:', JSON.stringify(mpFns));
}
