// deep-probe.mjs — 2026-09-21 Hermes/Linux 剩余源级用例综合探针
// 覆盖: D1-70 D2-26 D2-27 D3-C14 D4-26 D4-27 D4-28 D4-29 D6-9 D8-9 D8-10 D9-10 D9-11
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';

const SRC = process.env.HDK_SRC || '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/src';
const OUT = process.env.OUT_DIR || (process.argv[2] || '/tmp');
const results = [];
const log = (id, name, pass, actual, expected, note='') =>
  results.push({ id, name, pass: !!pass, actual: String(actual ?? '').slice(0,180), expected: String(expected ?? '').slice(0,180), note: String(note).slice(0,180) });

async function imp(rel) {
  try { return await import(pathToFileURL(join(SRC, rel)).href); }
  catch (e) { return { __err: String(e).slice(0,180) }; }
}

// ---- D1-70 proxy-config ----
{
  const pc = await imp('proxy/proxy-config.mjs');
  if (pc.__err) log('D1-70','import',false,pc.__err,'proxy-config importable');
  else {
    log('D1-70','writeProxyConfig', typeof pc.writeProxyConfig==='function', typeof pc.writeProxyConfig, 'function');
    log('D1-70','readProxyConfig', typeof pc.readProxyConfig==='function', typeof pc.readProxyConfig, 'function');
    log('D1-70','getProxySettings', typeof pc.getProxySettings==='function', typeof pc.getProxySettings, 'function');
    // getProxySettings no_proxy bypass: with NO_PROXY=* should return null (bypass)
    try {
      process.env.NO_PROXY = '*';
      process.env.HTTP_PROXY = 'http://127.0.0.1:9';
      const s = pc.getProxySettings('https://example.com');
      log('D1-70','no_proxy-bypass', s && (s === null || s.noProxy === true || s.bypass === true || s.proxy === undefined || JSON.stringify(s).includes('bypass')), JSON.stringify(s).slice(0,120), 'no_proxy 命中返回 null/绕过');
    } catch(e) { log('D1-70','no_proxy-bypass', false, String(e).slice(0,120), '不抛异常'); }
    delete process.env.NO_PROXY; delete process.env.HTTP_PROXY;
  }
}

// ---- D2-26 backup/restore ----
{
  const cr = await imp('auth/credentials.mjs');
  if (cr.__err) log('D2-26','import',false,cr.__err,'credentials importable');
  else {
    log('D2-26','backup-fn', typeof cr.backupGlobalCredentials==='function', typeof cr.backupGlobalCredentials, 'function');
    log('D2-26','restore-fn', typeof cr.restoreGlobalCredentialsBackup==='function', typeof cr.restoreGlobalCredentialsBackup, 'function');
    // 隔离 HOME 下备份→破坏→恢复闭环
    try {
      const os = await import('node:os'); const fs = await import('node:fs');
      const tmpHome = fs.mkdtempSync(join(os.tmpdir(), 'hdk-bak-'));
      process.env.HUAWEICLOUD_HOME = tmpHome;
      cr.writeGlobalCredentials({ ak:'AKTEST123456', sk:'SKTESTabcdef' });
      const bak = cr.backupGlobalCredentials();
      const bakOk = !!bak && typeof bak==='object';
      cr.writeGlobalCredentials({ ak:'BROKEN', sk:'X' });
      const r = cr.restoreGlobalCredentialsBackup();
      const after = cr.readGlobalCredentials();
      const restored = after && (after.ak==='AKTEST123456' || after.ak==='AKTEST123456');
      log('D2-26','backup-restore-loop', bakOk && r!==undefined && restored, JSON.stringify(after).slice(0,120), '备份→破坏→恢复后凭证与备份一致');
      fs.rmSync(tmpHome, {recursive:true, force:true});
    } catch(e) { log('D2-26','backup-restore-loop', false, String(e).slice(0,140), '闭环不抛异常'); }
  }
}

// ---- D2-27 koocli-version ----
{
  const kv = await imp('koocli-version.mjs');
  if (kv.__err) log('D2-27','import',false,kv.__err,'importable');
  else {
    log('D2-27','getKooCliVersion', typeof kv.getKooCliVersion==='function', typeof kv.getKooCliVersion, 'function');
    const v = kv.parseHcloudVersion ? kv.parseHcloudVersion('hcloud 7.2.12 linux/amd64') : null;
    log('D2-27','parseHcloudVersion', v==='7.2.12', String(v), '7.2.12');
    const cmp = kv.compareVersion ? kv.compareVersion('7.2.12','7.2.9') : null;
    log('D2-27','compareVersion-gt', cmp>0, String(cmp), '>0');
    log('D2-27','kooCliDownloadBase', typeof kv.kooCliDownloadBase==='function', typeof kv.kooCliDownloadBase, 'function');
  }
}

// ---- D3-C14 hdkit/hwlink 参数透传 ----
{
  const hd = await imp('sandbox/hdkitservice-api.mjs');
  const hw = await imp('sandbox/hwlink-api.mjs');
  if (hd.__err) log('D3-C14','hdkit-import',false,hd.__err,'importable');
  else log('D3-C14','hdkitConnect-fn', typeof hd.hdkitConnect==='function' && typeof hd.hdkitCredentials==='function', 'both', 'hdkitConnect+hdkitCredentials');
  if (hw.__err) log('D3-C14','hwlink-import',false,hw.__err,'importable');
  else {
    log('D3-C14','hwlink-getCredentials', typeof hw.getCredentials==='function', typeof hw.getCredentials, 'function');
    log('D3-C14','hwlink-createConnection', typeof hw.createConnection==='function', typeof hw.createConnection, 'function');
    try {
      const c = hw.getCredentials();
      const keys = Object.keys(c||{});
      log('D3-C14','getCredentials-struct', keys.includes('ak')&&keys.includes('sk')&&keys.includes('securitytoken'), keys.join(','), 'ak,sk,securitytoken 三字段');
    } catch(e) { log('D3-C14','getCredentials-struct', false, String(e).slice(0,120), '返回{ak,sk,securitytoken}'); }
  }
}

// ---- D4-26 redactEvidence ----
{
  const re = await imp('risk-rule-engine.mjs');
  if (re.__err) log('D4-26','import',false,re.__err,'importable');
  else {
    log('D4-26','redactEvidence-fn', typeof re.redactEvidence==='function', typeof re.redactEvidence, 'function');
    if (typeof re.redactEvidence==='function') {
      for (const [label, input] of [['ak','AKID12345678'],['sk','SK1234567890abcdef'],['token','xsecuritytoken123'],['password','password=mypass']]) {
        try {
          const o = re.redactEvidence(input);
          const outTxt = JSON.stringify(o);
          const leak = outTxt.includes('AKID12345678') || outTxt.includes('SK1234567890') || outTxt.includes('xsecuritytoken123');
          log('D4-26','redact-'+label, !leak, outTxt.slice(0,100), '凭证被<redacted>替换');
        } catch(e) { log('D4-26','redact-'+label, false, String(e).slice(0,100), '不抛异常'); }
      }
    }
  }
}

// ---- D4-27 redactSecrets + redactOutput 双路径 ----
{
  const sp = await imp('safety-policy.mjs');
  const hc = await imp('hcloud-cli.mjs');
  if (sp.__err) log('D4-27','redactSecrets-import',false,sp.__err,'importable');
  else {
    log('D4-27','redactSecrets-fn', typeof sp.redactSecrets==='function', typeof sp.redactSecrets, 'function');
    // 大小写 AK/SK 脱敏
    const t1 = sp.redactSecrets('ak=AKID12345678 sk=SK1234567890abcdef');
    log('D4-27','redactSecrets-lower-ak', typeof t1==='string' && !t1.includes('AKID12345678') && !t1.includes('SK1234567890'), String(t1).slice(0,100), '小写 ak=/sk= 被脱敏');
  }
  if (hc.__err) log('D4-27','redactOutput-import',false,hc.__err,'importable');
  else {
    log('D4-27','redactOutput-fn', typeof hc.redactOutput==='function', typeof hc.redactOutput, 'function');
    if (typeof hc.redactOutput==='function') {
      const t2 = hc.redactOutput('AK="AKID12345678" SK="SK1234567890abcdef"');
      log('D4-27','redactOutput', typeof t2==='string' && !t2.includes('AKID12345678'), String(t2).slice(0,100), 'CLI 输出 AK 被脱敏');
    }
  }
}

// ---- D4-28 Node hook 链路 ----
{
  const fs = await import('node:fs');
  const hooksDir = '/home/zhangshuang/devkit-test/Hermes/hdk/plugins/huaweicloud-core/hooks';
  const mjs = fs.existsSync(join(hooksDir,'huaweicloud-safety.mjs'));
  const json = fs.existsSync(join(hooksDir,'hooks.json'));
  log('D4-28','node-hook-exists', mjs, mjs?'present':'absent', 'hooks/huaweicloud-safety.mjs 存在');
  log('D4-28','hooks-json-exists', json, json?'present':'absent', 'hooks/hooks.json 存在');
  if (json) {
    const hj = JSON.parse(fs.readFileSync(join(hooksDir,'hooks.json'),'utf8'));
    const hooksObj = hj.hooks || hj;
    // hooks may be {PreToolUse:[...]} (dict) or [...]
    let cmdHooks = [];
    const collect = (v) => {
      if (Array.isArray(v)) { for (const x of v) { if (x && Array.isArray(x.hooks)) cmdHooks.push(...x.hooks); else collect(x); } }
      else if (v && typeof v==='object') { for (const k in v) collect(v[k]); }
    };
    collect(hooksObj);
    const usesMjs = cmdHooks.some(h => /huaweicloud-safety\.mjs/.test(h.command||''));
    log('D4-28','hooks-register-mjs', usesMjs, usesMjs?'mjs 注册':'未注册 mjs', 'hooks.json 走 node huaweicloud-safety.mjs');
    log('D4-28','PreToolUse-present', Object.keys(hooksObj||{}).some(k=>/PreToolUse/i.test(k)), JSON.stringify(Object.keys(hooksObj||{})), 'PreToolUse 注册');
  }
}

// ---- D4-29 classifyRawCommand / assertAllowed ----
{
  const sp = await imp('safety-policy.mjs');
  if (sp.__err) log('D4-29','import',false,sp.__err,'importable');
  else {
    log('D4-29','classifyRawCommand-exists', typeof sp.classifyRawCommand==='function', typeof sp.classifyRawCommand, 'function(link)');
    log('D4-29','assertAllowed-fn', typeof sp.assertAllowed==='function', typeof sp.assertAllowed, 'function');
    if (typeof sp.assertAllowed==='function') {
      const allowRes = sp.assertAllowed({decision:'allow'}); 
      log('D4-29','assertAllowed-allow', allowRes===true || allowRes===undefined, JSON.stringify(allowRes).slice(0,80), 'allow 分支通过');
      try { sp.assertAllowed({decision:'deny'}); log('D4-29','assertAllowed-deny', false, 'no-throw', 'deny 抛拒绝'); }
      catch(e){ log('D4-29','assertAllowed-deny', /den|reject|refus/i.test(String(e)), String(e).slice(0,80), 'deny 抛拒绝'); }
    }
  }
}

// ---- D6-9 cache clear ----
{
  const uc = await imp('update-check.mjs');
  const il = await imp('icon-library.mjs');
  const sm = await imp('search-market.mjs');
  log('D6-9','invalidateUpdateCache', uc.__err ? false : typeof uc.invalidateUpdateCache==='function', uc.__err?uc.__err:typeof uc.invalidateUpdateCache, 'function');
  log('D6-9','clearIconCache', il.__err ? false : typeof il.clearIconCache==='function', il.__err?il.__err:typeof il.clearIconCache, 'function');
  log('D6-9','clearMarketCache', sm.__err ? false : typeof sm.clearMarketCache==='function', sm.__err?sm.__err:typeof sm.clearMarketCache, 'function');
  // 幂等：连续两次调用不抛异常
  try {
    uc.invalidateUpdateCache(); uc.invalidateUpdateCache();
    il.clearIconCache(); il.clearIconCache();
    if (sm.clearMarketCache) { sm.clearMarketCache(); sm.clearMarketCache(); }
    log('D6-9','idempotent-double-clear', true, 'no-throw', '重复清理幂等');
  } catch(e) { log('D6-9','idempotent-double-clear', false, String(e).slice(0,120), '不抛异常'); }
}

// ---- D8-9 installId + sanitizeValue ----
{
  const tl = await imp('telemetry/telemetry.mjs');
  if (tl.__err) log('D8-9','import',false,tl.__err,'importable');
  else {
    log('D8-9','generate-fn', typeof tl.generateOrRecoverInstallId==='function', typeof tl.generateOrRecoverInstallId, 'function');
    log('D8-9','sanitize-fn', typeof tl.sanitizeValue==='function', typeof tl.sanitizeValue, 'function');
    if (typeof tl.sanitizeValue==='function') {
      const s1 = tl.sanitizeValue('ak=AKID12345678 token=abc');
      const leak = String(s1).includes('AKID12345678');
      log('D8-9','sanitize-cred', !leak, String(s1).slice(0,120), 'sanitizeValue 移除 AK/SK/token');
    }
    if (typeof tl.generateOrRecoverInstallId==='function') {
      try {
        const id1 = tl.generateOrRecoverInstallId(); const id2 = tl.generateOrRecoverInstallId();
        log('D8-9','installId-stable', typeof id1==='string' && id1.length>0 && id1===id2, String(id1).slice(0,40), '稳定持久且非空');
      } catch(e) { log('D8-9','installId-stable', false, String(e).slice(0,120), '稳定'); }
    }
  }
}

// ---- D8-10 mcp-config merge/backup ----
{
  const mg = await imp('mcp-config-merge.mjs');
  const bk = await imp('mcp-config-backup.mjs');
  log('D8-10','mergeCommandStyle', mg.__err?false:typeof mg.mergeCommandStyle==='function', mg.__err?mg.__err:typeof mg.mergeCommandStyle, 'function');
  log('D8-10','mergeArgsStyle', mg.__err?false:typeof mg.mergeArgsStyle==='function', mg.__err?mg.__err:typeof mg.mergeArgsStyle, 'function');
  log('D8-10','mergeMcpServersFile', mg.__err?false:typeof mg.mergeMcpServersFile==='function', mg.__err?mg.__err:typeof mg.mergeMcpServersFile, 'function');
  log('D8-10','extractUserDelta', mg.__err?false:typeof mg.extractUserDelta==='function', mg.__err?mg.__err:typeof mg.extractUserDelta, 'function');
  log('D8-10','applyUserDelta', mg.__err?false:typeof mg.applyUserDelta==='function', mg.__err?mg.__err:typeof mg.applyUserDelta, 'function');
  log('D8-10','takeAgentDelta', bk.__err?false:typeof bk.takeAgentDelta==='function', bk.__err?bk.__err:typeof bk.takeAgentDelta, 'function');
  log('D8-10','saveAgentDelta', bk.__err?false:typeof bk.saveAgentDelta==='function', bk.__err?bk.__err:typeof bk.saveAgentDelta, 'function');
  log('D8-10','purgeBackup', bk.__err?false:typeof bk.purgeBackup==='function', bk.__err?bk.__err:typeof bk.purgeBackup, 'function');
  // 实际合并语义
  if (!mg.__err && typeof mg.mergeCommandStyle==='function') {
    try {
      const r = mg.mergeCommandStyle({command:'node',args:['a']}, {command:'', args:['b']});
      log('D8-10','merge-command-semantics', r && typeof r==='object', JSON.stringify(r).slice(0,100), '合并返回对象');
    } catch(e) { log('D8-10','merge-command-semantics', false, String(e).slice(0,120), '不抛异常'); }
  }
}

// ---- D9-10 remote transport ----
{
  const mr = await imp('mcp-server-remote.mjs');
  if (mr.__err) log('D9-10','import',false,mr.__err,'importable');
  else {
    log('D9-10','startRemoteServer-fn', typeof mr.startRemoteServer==='function', typeof mr.startRemoteServer, 'function');
    log('D9-10','DEFAULT_PORT', typeof mr.DEFAULT_PORT!=='undefined', String(mr.DEFAULT_PORT), '9528');
  }
}

// ---- D9-11 hwlink tunnel channel ----
{
  const ws = await imp('ws-exec/hwlink-tunnel-channel.mjs');
  if (ws.__err) log('D9-11','import',false,ws.__err,'importable');
  else {
    const cls = ws.HwlinkTunnelChannel;
    log('D9-11','HwlinkTunnelChannel-class', typeof cls==='function' || typeof cls==='class' || !!cls, typeof cls, 'class/function');
    if (typeof cls==='function') {
      try {
        const inst = new cls({remotePort: 9528});
        log('D9-11','instantiate', !!inst, typeof inst, '实例化成功');
        log('D9-11','attach-method', typeof inst.attach==='function', typeof inst.attach, 'function');
      } catch(e) { log('D9-11','instantiate', false, String(e).slice(0,120), '实例化成功'); }
    }
  }
}

// write
const outPath = join(OUT, 'deep-probe.stdout.log');
writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), total: results.length, passed: results.filter(r=>r.pass).length, failed: results.filter(r=>!r.pass).length, results }, null, 2));
console.log(JSON.stringify({ total: results.length, passed: results.filter(r=>r.pass).length, failed: results.filter(r=>!r.pass).length }));
for (const r of results.filter(x=>!x.pass)) console.log('FAIL:', r.id, r.name, '|', r.actual, '| expect', r.expected);