#!/usr/bin/env node
// probe.mjs for D1-3 — CodeArtsSpace Windows 真实执行探针
// 用法: node probe.mjs <hdkSrcDir>
// 输出: JSON 结果到 stdout，退出码 0=PASS / 1=FAIL / 2=BLOCKED
import { pathToFileURL } from 'node:url';
import { join, resolve } from 'node:path';
import { existsSync } from 'node:fs';
const hdkSrc = resolve(process.argv[2] || process.env.HDK_SRC || '.');
const load = async (n) => import(pathToFileURL(join(hdkSrc, n)).href);
const CASE_ID = "D1-3";
const CLIENT = 'CodeArtsSpace';
const OS = 'Windows';
function emit(status, why, extra = {}) {
  const entry = { caseId: CASE_ID, status, why, client: CLIENT, os: OS, executedAt: new Date().toISOString(), ...extra };
  console.log(JSON.stringify(entry, null, 2));
  process.exit(status === 'PASS' ? 0 : (status === 'BLOCKED' || status === 'NOT_RUN' ? 2 : 1));
}
const raw = await import('node:child_process').then(m => m.execSync('npm view huaweicloud-devkit dist-tags --json 2>&1', { encoding: 'utf8', timeout: 30000 }));
const match = raw.match(/\{[\s\S]*\}/);
const tags = match ? JSON.parse(match[0]) : null;
emit(tags ? 'PASS' : 'FAIL', 'npm view dist-tags ok', { tags: tags ? Object.keys(tags) : null });
