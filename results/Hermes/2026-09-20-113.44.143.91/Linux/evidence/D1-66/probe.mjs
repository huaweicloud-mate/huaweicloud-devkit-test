// D1-66 (P2): 遥测开关与端点环境变量 — 用正确 env 名 HUAWEICLOUD_DEVKIT_TELEMETRY 复测
// 之前误用 TELEMETRY 导致 isTelemetryEnabled() 恒 true → 误报 FAIL；
// 实现实际读 HUAWEICLOUD_DEVKIT_TELEMETRY (telemetry.mjs:175-177)。
import { isTelemetryEnabled } from 'file:///home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/telemetry/telemetry.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const out = [];
function L(s) { out.push(s); }
function check(name, pass, detail) { L(`${pass ? 'PASS' : 'FAIL'} | ${name} | ${detail}`); return pass; }

let ok = true;
const prev = process.env.HUAWEICLOUD_DEVKIT_TELEMETRY;

// 1) off -> 关闭
process.env.HUAWEICLOUD_DEVKIT_TELEMETRY = 'off';
const rOff = isTelemetryEnabled();
ok = check('off 时 isTelemetryEnabled()=false', rOff === false, `actual=${rOff}`) && ok;

// 2) on -> 开启
process.env.HUAWEICLOUD_DEVKIT_TELEMETRY = 'on';
const rOn = isTelemetryEnabled();
ok = check('on 时 isTelemetryEnabled()=true', rOn === true, `actual=${rOn}`) && ok;

// 3) 未设 -> 默认开启
delete process.env.HUAWEICLOUD_DEVKIT_TELEMETRY;
const rUnset = isTelemetryEnabled();
ok = check('未设时 isTelemetryEnabled()=true(默认开)', rUnset === true, `actual=${rUnset}`) && ok;

// 4) 端点: getEndpoint() 读 HUAWEICLOUD_DEVKIT_TELEMETRY_ENDPOINT || DEFAULT_ENDPOINT
//    (telemetry.mjs:179-181; getEndpoint 为私有故源码级断言)
const srcPath = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src/telemetry/telemetry.mjs';
const src = readFileSync(srcPath, 'utf8');
const hasEndpointLogic = /HUAWEICLOUD_DEVKIT_TELEMETRY_ENDPOINT\s*\|\|\s*DEFAULT_ENDPOINT/.test(src);
const defaultEnd = src.match(/const DEFAULT_ENDPOINT = '([^']+)'/);
ok = check('端点 env 名正确(HUAWEICLOUD_DEVKIT_TELEMETRY_ENDPOINT)', hasEndpointLogic, defaultEnd ? `DEFAULT_ENDPOINT=${defaultEnd[1]}` : '未找到常量') && ok;

if (prev !== undefined) process.env.HUAWEICLOUD_DEVKIT_TELEMETRY = prev;

L('');
L(`=== 结论 D1-66 ===  ${ok ? 'PASS' : 'FAIL'}  (遥测开关+端点均正确；之前 TELEMETRY 为误报)`);

const outDir = '/home/zhangshuang/devkit-test/Hermes/huaweicloud-devkit-test/results/Hermes/2026-09-20-113.44.143.91/Linux/evidence/D1-66';
mkdirSync(outDir, { recursive: true });
writeFileSync(outDir + '/stdout.log', out.join('\n') + '\n', 'utf8');
console.log(out.join('\n'));