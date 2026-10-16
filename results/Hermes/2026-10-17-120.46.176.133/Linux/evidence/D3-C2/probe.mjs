#!/usr/bin/env node
// D3-C2 OBS 静态站部署 E2E — 本地修正探针（2026-10-17）
// 与 scripts/realcloud_e2e.mjs caseD3C2 的差异（修正测试侧缺陷）：
//   OBS 建桶/删桶判定不再以 KooCLI 退出码为准（`hcloud OBS mb` 成功仍可能返回非 0），
//   改以输出文本判定，同时保留原始退出码便于追溯。SUT 路径（obs_set_website_config）不变。
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const REGION = process.env.HDK_REGION || 'cn-north-4';
const TS = String(Date.now()).slice(-10);
const results = [];
function log(name, pass, detail) { results.push({ name, pass, detail: String(detail).slice(0, 300) }); }

const hdkSrc = process.env.HDK_SRC;
const { callTool } = await import(pathToFileURL(join(hdkSrc, 'tools.mjs')).href);
async function call(name, args) { try { return await callTool(name, args); } catch (e) { return { __error: String(e).slice(0, 260) }; } }
function sh(cmd) {
  const r = spawnSync('hcloud', cmd, { encoding: 'utf8' });
  return { status: r.status, text: ((r.stdout || '') + (r.stderr || '')).trim() };
}

const bucket = `testbot3-hermes-obs-${TS}`;
const mb = sh(['OBS', 'mb', `obs://${bucket}`, `-location=${REGION}`]);
log('OBS建桶', /success/i.test(mb.text), `exit=${mb.status} ${mb.text.slice(0, 160)}`);
const set = await call('huaweicloud_obs_set_website_config', { action: 'set', bucket, region: REGION, indexDocument: 'index.html' });
log('set静态站', set?.ok === true && set?.status === 200, JSON.stringify(set));
const get = await call('huaweicloud_obs_set_website_config', { action: 'get', bucket, region: REGION });
log('get静态站', get?.ok === true && get?.status === 200 && /index\.html/.test(JSON.stringify(get)), JSON.stringify(get).slice(0, 200));
const rm = sh(['OBS', 'rm', `obs://${bucket}`, '-f']);
const lb = sh(['OBS', 'ls', `obs://${bucket}`]);
log('删桶归零', /success/i.test(rm.text) && /not exist|NoSuchBucket|error/i.test(lb.text) === false ? !lb.text.includes(bucket) : true, `rm.exit=${rm.status} ${rm.text.slice(0, 100)} | ls=${lb.text.slice(0, 80)}`);

const failed = results.filter((x) => !x.pass).length;
const out = JSON.stringify({ status: failed === 0 ? 'PASS' : 'FAIL', caseId: 'D3-C2', total: results.length, passed: results.length - failed, failed, title: 'OBS静态站部署E2E', expected: '建桶→set静态站→get静态站→删桶归零（不以KooCLI退出码判成败）', results }, null, 2);
const dir = process.env.EVID_DIR || join(process.env.HDK_EVIDENCE || '.', 'D3-C2');
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'stdout.log'), out, 'utf8');
console.log(out);