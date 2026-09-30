#!/usr/bin/env node
// probe.mjs for D4-2 — CodeArtsSpace Windows 真实执行探针
// 用法: node probe.mjs <hdkSrcDir>
// 输出: JSON 结果到 stdout，退出码 0=PASS / 1=FAIL / 2=BLOCKED
import { pathToFileURL } from 'node:url';
import { join, resolve } from 'node:path';
import { existsSync } from 'node:fs';
const hdkSrc = resolve(process.argv[2] || process.env.HDK_SRC || '.');
const load = async (n) => import(pathToFileURL(join(hdkSrc, n)).href);
const CASE_ID = "D4-2";
const CLIENT = 'CodeArtsSpace';
const OS = 'Windows';
function emit(status, why, extra = {}) {
  const entry = { caseId: CASE_ID, status, why, client: CLIENT, os: OS, executedAt: new Date().toISOString(), ...extra };
  console.log(JSON.stringify(entry, null, 2));
  process.exit(status === 'PASS' ? 0 : (status === 'BLOCKED' || status === 'NOT_RUN' ? 2 : 1));
}
const safety = await load('safety-policy.mjs'); const r1 = safety.classifyTextCommand('printenv HW_SECRET_KEY'); const r2 = safety.classifyTextCommand('env | grep HW_'); const r3 = safety.classifyTextCommand('set | grep HW_'); const r4 = safety.classifyTextCommand('printenv HW_SECRET_ACCESS_KEY'); const allDeny = r1.decision === 'deny' && r2.decision === 'deny' && r3.decision === 'deny' && r4.decision === 'deny'; emit(allDeny ? 'PASS' : 'FAIL', 'HW_ env-dump: '+r1.decision+'/'+r2.decision+'/'+r3.decision+'/'+r4.decision, { r1, r2, r3, r4 });
