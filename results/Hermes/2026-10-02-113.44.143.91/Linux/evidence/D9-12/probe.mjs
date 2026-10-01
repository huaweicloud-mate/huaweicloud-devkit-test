// D9-12 initialize 握手协议安全基线 — 非法时序 tools/list 应 -32600
const HDK = process.env.HDK_PLUGIN_SRC || '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core';
import { writeFileSync } from 'node:fs';
const proto = await import(`file://${HDK}/src/mcp-protocol.mjs`);
const dispatch = proto.dispatch || proto.default?.dispatch;
let r, threw = false, code = null;
try { r = await dispatch('tools/list', {}); } catch (e) { threw = true; code = e.code; }
const illegalTiming = threw && String(code) === '-32600';
const status = illegalTiming ? 'PASS' : 'FAIL';
const why = illegalTiming ? '' : 'mcp-protocol.mjs dispatch 无 initialize 状态机，非法时序 tools/list 未返回 -32600（got=' + JSON.stringify(r).slice(0,60) + '）';
const obj = { status, why: why || undefined, executedAt: new Date().toISOString().replace(/[-:TZ.]/g,'').slice(0,14) };
writeFileSync(new URL('file:///home/zhangshuang/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-10-02-113.44.143.91/Linux/evidence/D9-12/stdout.log'), JSON.stringify(obj, null, 2), 'utf8');
console.log('D9-12 => ' + status + ' threw=' + threw + ' code=' + code);
