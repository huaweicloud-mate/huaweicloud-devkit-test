#!/usr/bin/env node
// D2-26 凭证备份与恢复（backupGlobalCredentials / restoreGlobalCredentialsBackup）
// Hermes Linux 2026-09-18 每日测试 —— 隔离 HUAWEICLOUD_HOME，不触碰真实凭证库。
// 步骤：
//   ① 隔离 HUAWEICLOUD_HOME 到临时目录，写入假 AK/SK credentials.json
//   ② 调 backupGlobalCredentials()，核对 .bak 生成 + 内容指纹一致
//   ③ 篡改 credentials.json
//   ④ 调 restoreGlobalCredentialsBackup()，核对恢复为 backup 前内容
//   ⑤ 清理临时目录
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SRC = process.env.HDK_SRC || '/home/testbot2/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/src';

// ① 隔离 HOME + HUAWEICLOUD_HOME（baseHome 读取 HUAWEICLOUD_HOME 优先）
const iso = mkdtempSync(join(tmpdir(), 'hdk-d226-'));
const cfgDir = join(iso, '.config', 'huaweicloud');
mkdirSync(cfgDir, { recursive: true });
process.env.HUAWEICLOUD_HOME = iso;
process.env.HOME = iso;

const CRED_PATH = join(cfgDir, 'credentials.json');
const ORIG = {
  ak: 'AKIAIOSFODNN7EXAMPLE',          // 假 AK（20 位，满足 isPlaceholder 非占位符）
  sk: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
  region: 'cn-north-4',
};
writeFileSync(CRED_PATH, JSON.stringify(ORIG, null, 2), { encoding: 'utf8', mode: 0o600 });

const { backupGlobalCredentials, restoreGlobalCredentialsBackup, globalCredentialsPath } =
  await import(pathToFileURL(join(SRC, 'auth', 'credentials.mjs')).href);

const hash = (p) => existsSync(p) ? createHash('sha256').update(readFileSync(p)).digest('hex') : null;
const h0 = hash(CRED_PATH);

const out = [];
function record(name, ok, detail) {
  const d = typeof detail === 'object' && detail !== null ? JSON.stringify(detail) : String(detail);
  out.push({ name, ok, detail: d.slice(0, 400) });
  console.log(`[${ok ? 'OK' : 'FAIL'}] ${name}`);
}

// ② backup
const bakPath = backupGlobalCredentials();
record('backup 返回 .bak 路径且文件生成', typeof bakPath === 'string' && bakPath.endsWith('.bak') && existsSync(bakPath), { bakPath: bakPath?.replace(iso, '<ISO>') });
record('backup 内容指纹 == 原始指纹', existsSync(bakPath) && hash(bakPath) === h0, { h0: h0?.slice(0, 16), hBak: hash(bakPath)?.slice(0, 16) });

// ③ 篡改
const TAMPER = { ak: 'TAMPERED_AK', sk: 'TAMPERED_SK', region: 'cn-north-4' };
writeFileSync(CRED_PATH, JSON.stringify(TAMPER, null, 2), { encoding: 'utf8' });
record('篡改后指纹 != 原始指纹', hash(CRED_PATH) !== h0, { hTamper: hash(CRED_PATH)?.slice(0, 16) });

// ④ restore
const restored = restoreGlobalCredentialsBackup();
const hRestored = hash(CRED_PATH);
record('restore 返回 true', restored === true, { restored });
record('restore 后凭证文件恢复为 backup 前内容', hRestored === h0, { hRestored: hRestored?.slice(0, 16), h0: h0?.slice(0, 16) });
record('恢复后内容 == 原始 AK/SK', (() => { try { const d = JSON.parse(readFileSync(CRED_PATH, 'utf8')); return d.ak === ORIG.ak && d.sk === ORIG.sk; } catch { return false; } })(), {});

// ⑤ 清理
try { rmSync(iso, { recursive: true, force: true }); record('清理隔离目录', !existsSync(iso), { iso }); }
catch (e) { record('清理隔离目录', false, e.message); }

const summary = {
  generatedAt: new Date().toISOString(),
  total: out.length,
  passed: out.filter((o) => o.ok).length,
  backupPathGenerated: typeof bakPath === 'string' && bakPath.endsWith('.bak'),
  restoreOk: restored === true,
  hashRestored: hRestored === h0,
  results: out,
};
console.log('\n=====SUMMARY JSON=====');
console.log(JSON.stringify(summary, null, 2));
process.exit(0);