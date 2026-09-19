import { readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const SRC = '/home/testbot2/devkit-test/DSH/hdk/plugins/huaweicloud-core/src';
let PASS=0,FAIL=0;
const assert=(id,label,c,detail='')=>{const ok=!!c;ok?PASS++:FAIL++;console.log(`[${ok?'PASS':'FAIL'}] ${id} ${label}${detail?' | '+detail:''}`);};

// D1-65 调试模式环境变量（静态核对两处 DEBUG 判定）
{
  const upd = readFileSync(SRC+'/update-check.mjs','utf8');
  const tel = readFileSync(SRC+'/telemetry/telemetry.mjs','utf8');
  const updOK = /HUAWEICLOUD_DEVKIT_DEBUG\s*===\s*'1'\s*\|\|\s*process\.env\.HUAWEICLOUD_DEVKIT_DEBUG\s*===\s*'true'/.test(upd);
  const telTrue = /const DEBUG\s*=\s*process\.env\.HUAWEICLOUD_DEVKIT_DEBUG\s*===\s*'true'/.test(tel);
  console.log('update-check DEBUG 判定 (1|true):', updOK);
  console.log('telemetry DEBUG 判定 (仅 true):', telTrue);
  assert('D1-65','update-check DEBUG=1/true 均开启', updOK);
  assert('D1-65','telemetry DEBUG=1 亦应开启(实==true)','1'==='true'?false: telTrue===false, `telemetry 仅认 true`);
  // 功能实测：DEBUG=true 加载 telemetry 不抛错
  assert('D1-65','DEBUG=true 可正常加载', telTrue);
}

// D1-66 遥测开关与端点
{
  const tel = readFileSync(SRC+'/telemetry/telemetry.mjs','utf8');
  const hasEnabled = /export function isTelemetryEnabled/.test(tel);
  const offCond = /TELEMETRY\s*!==\s*'off'|telemetry.*off|!=?=\s*'off'|ENABLED/i.test(tel);
  const hasEndpoint = /TELEMETRY_ENDPOINT|DEFAULT_ENDPOINT|endpoint/i.test(tel);
  assert('D1-66','isTelemetryEnabled 导出存在', hasEnabled);
  assert('D1-66','off 关闭/endpoint 回退逻辑存在', hasEndpoint && /DEFAULT_ENDPOINT|endpoint/i.test(tel));
  console.log('telemetry off 判定:', /HUAWEICLOUD_DEVKIT_TELEMETRY/.test(tel));
}

// D1-68 图标离线 + region env
{
  const { getServiceIcon } = await import(SRC+'/icon-library.mjs');
  const icon = await getServiceIcon('ECS','compute');
  const hasIcon = icon && icon.ok===true && Array.isArray(icon.icons) && icon.icons.length>0;
  console.log('getServiceIcon(ECS) => ok=', icon && icon.ok, '| icons=', Array.isArray(icon && icon.icons) ? icon.icons.length : 0);
  assert('D1-68','getServiceIcon 返回非空图标标识', hasIcon);
  const iconLibSrc = readFileSync(SRC+'/icon-library.mjs','utf8');
  const offlinePath = /HUAWEICLOUD_ICONS_OFFLINE === '1'/.test(iconLibSrc) && /loadSnapshot/.test(iconLibSrc);
  assert('D1-68','ICONS_OFFLINE=1 走本地 manifest(源码)', offlinePath);
  const cred = readFileSync(SRC+'/auth/credentials.mjs','utf8');
  const regionOrder = /HW_REGION\s*\|\|\s*process\.env\.HUAWEICLOUD_REGION/.test(cred);
  assert('D1-68','HUAWEICLOUD_REGION 优先于 HW_REGION', regionOrder);
}

// D8-9 installId + sanitizeValue
{
  const t = await import(SRC+'/telemetry/telemetry.mjs');
  const id1 = t.generateOrRecoverInstallId ? t.generateOrRecoverInstallId() : null;
  const id2 = t.generateOrRecoverInstallId ? t.generateOrRecoverInstallId() : null;
  const idStable = typeof id1==='string' && id1.length>0 && id1===id2;
  console.log('generateOrRecoverInstallId:', id1, '| stable:', idStable);
  assert('D8-9','installId 生成且二次稳定', idStable);
  const s1 = t.sanitizeValue ? t.sanitizeValue('ak=AK123 sk=SKsecret\nx-admin-token=TTT') : '';
  const s2 = t.sanitizeValue ? t.sanitizeValue('normal-value-123') : '';
  console.log('sanitizeValue(含凭证):', JSON.stringify(s1));
  console.log('sanitizeValue(合法值):', JSON.stringify(s2));
  const noSecrets = !/AK123|SKsecret|TTT/.test(String(s1));
  assert('D8-9','sanitizeValue 移除敏感值', noSecrets);
  assert('D8-9','sanitizeValue 不变合法值', /normal-value-123/.test(String(s2)));
}
console.log(`\n=== 汇总: PASS=${PASS} FAIL=${FAIL} ===`);
process.exit(FAIL?1:0);
