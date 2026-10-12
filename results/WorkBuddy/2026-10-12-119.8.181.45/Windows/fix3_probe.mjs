#!/usr/bin/env node
// Fix D2-11 evidence via auth_switch tool
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';

const HDK_SRC = join(process.env.HOME, 'devkit-test/testbot4-win-workbuddy/hdk/plugins/huaweicloud-core/src');

function ts() {
  const d = new Date();
  return d.getFullYear() + String(d.getMonth()+1).padStart(2,'0') + String(d.getDate()).padStart(2,'0') + String(d.getHours()).padStart(2,'0') + String(d.getMinutes()).padStart(2,'0') + String(d.getSeconds()).padStart(2,'0');
}

async function main() {
  const tools = await import('file://' + join(HDK_SRC, 'tools.mjs'));
  
  // Read current credentials to use the same AK (no conflict)
  const credPath = join(process.env.HOME, '.config', 'huaweicloud', 'credentials.json');
  const creds = JSON.parse(readFileSync(credPath, 'utf-8'));
  
  try {
    const r = await tools.callTool('huaweicloud_auth_switch', { 
      ak: creds.ak, 
      sk: creds.sk, 
      securityToken: 'STS.TOKEN.123', 
      region: creds.region || 'cn-north-4', 
      action: 'persist' 
    });
    const str = JSON.stringify(r);
    const isRejected = r.status === 'error' && r.scope === 'rejected';
    const status = isRejected ? 'PASS' : 'FAIL';
    const why = 'STS token persist rejected: status=' + r.status + ', scope=' + r.scope + ', error=' + (r.error || 'none');
    
    const dir = 'evidence/D2-11';
    mkdirSync(dir, { recursive: true });
    const log = { caseId: 'D2-11', status, why, sample: str.substring(0, 500), executedAt: ts() };
    writeFileSync(join(dir, 'stdout.log'), JSON.stringify(log, null, 2) + '\n', 'utf-8');
    console.log('[D2-11]', status, ':', why);
  } catch(e) {
    const dir = 'evidence/D2-11';
    mkdirSync(dir, { recursive: true });
    const log = { caseId: 'D2-11', status: 'FAIL', why: e.message, sample: e.stack, executedAt: ts() };
    writeFileSync(join(dir, 'stdout.log'), JSON.stringify(log, null, 2) + '\n', 'utf-8');
    console.log('[D2-11] FAIL:', e.message);
  }
}
main();
