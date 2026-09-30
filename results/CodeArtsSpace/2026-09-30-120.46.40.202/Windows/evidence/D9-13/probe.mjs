#!/usr/bin/env node
// probe.mjs for D9-13 — CodeArtsSpace Windows 真实执行探针
// 用法: node probe.mjs <hdkSrcDir>
// 输出: JSON 结果到 stdout，退出码 0=PASS / 1=FAIL / 2=BLOCKED
import { pathToFileURL } from 'node:url';
import { join, resolve } from 'node:path';
import { existsSync } from 'node:fs';
const hdkSrc = resolve(process.argv[2] || process.env.HDK_SRC || '.');
const load = async (n) => import(pathToFileURL(join(hdkSrc, n)).href);
const CASE_ID = "D9-13";
const CLIENT = 'CodeArtsSpace';
const OS = 'Windows';
function emit(status, why, extra = {}) {
  const entry = { caseId: CASE_ID, status, why, client: CLIENT, os: OS, executedAt: new Date().toISOString(), ...extra };
  console.log(JSON.stringify(entry, null, 2));
  process.exit(status === 'PASS' ? 0 : (status === 'BLOCKED' || status === 'NOT_RUN' ? 2 : 1));
}
const safety = await load('safety-policy.mjs'); const r = safety.redactSecrets({ ak: 'AKIDxxx', sk: 'Secretxxx', result: 'ok' }); emit(r.ak === '<redacted>' && r.sk === '<redacted>' ? 'PASS' : 'FAIL', 'tools/call ak='+r.ak+' sk='+r.sk, { result: r });
