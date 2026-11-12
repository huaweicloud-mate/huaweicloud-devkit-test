// D1-39 每日测试探针（真实执行，SUT=npm huaweicloud-devkit@2.0.0-next.3 (gitHead 4b718720)）
import { pathToFileURL } from 'node:url';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const SRC = '/home/testbot1/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core/dist';
const CORE = '/home/testbot1/nodejs/lib/node_modules/huaweicloud-devkit/plugins/huaweicloud-core';
const OUT = '/home/testbot1/devkit-test/testbot1-linux-atomcode/huaweicloud-devkit-test/results/AtomCode/2026-11-13-120.46.222.180/Linux/evidence/D1-39/stdout.log';
const _m = async (f) => await import(pathToFileURL(SRC + '/' + f).href);
const executedAt = '20261113060346';
const META = { case: 'D1-39', assistant: 'AtomCode(deepseek-v4-pro-0813)', os: 'Linux', sut: 'npm huaweicloud-devkit@2.0.0-next.3 (gitHead 4b718720)' };
function finish(r) { const o = { ...META, status: r.status, why: r.why || '', actual: r.actual, executedAt };
  writeFileSync(OUT, JSON.stringify(o, null, 2), 'utf8'); console.log('D1-39 ' + r.status + ' ' + (r.actual||'').slice(0,80)); }
async function run() {
  return { status: 'NOT_RUN', why: 'OS 专属：Windows 升级检测链 EINVAL 语义；OS 列标注「专属」，Linux 由 d1-upgrade queryDistTagsSync-no-EINVAL 代表覆盖', actual: 'N/A' };

}
run().then(finish).catch(e => finish({ status:'BLOCKED', why:String(e).slice(0,200), actual:String(e).slice(0,120) }));
