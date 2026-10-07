// D4 安全策略源码级探针（Hermes Linux 每日回归）
// 直接 import 安装包 safety-policy.mjs + risk-rule-engine.mjs 的导出函数，
// 核对 D4-1(凭证文件读取拦截) / D4-2(凭证env打印拦截) / D4-3(明文secret拦截)
//      / D4-15(hook绕过:大小写/编码/拼接) / D4-16(命令包裹穿透: sh -c/bash -c/$()) 的拦截语义。
// 用法: node classify-probe.mjs <huaweicloud-core/src 目录>
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

const srcDir = process.argv[2];
const S = (f) => join(srcDir, f);
const { classifyTextCommand, redactSecrets, loadPolicy } = await import(pathToFileURL(S('safety-policy.mjs')).href);
const { evaluateCommandRisk } = await import(pathToFileURL(S('risk-rule-engine.mjs')).href);

function section(id, run) {
  console.log(`=====CASE ${id}=====`);
  try {
    run();
  } catch (e) {
    console.log(`EXCEPTION: ${e.message}`);
  }
  console.log(`=====END ${id}=====`);
}

const policy = loadPolicy();
console.log('policy version:', policy.version);
console.log('credentialFilePatterns:', JSON.stringify(policy.credentialFilePatterns));

// ---- D4-1 凭证文件读取拦截 ----
section('D4-1', () => {
  for (const cmd of [
    'cat ~/.config/huaweicloud/credentials.json',
    'cat ~/.hcloud/config.json',
    'less /root/.huaweicloud/credentials',
    'Get-Content ~/.hcloud/config.json',
  ]) {
    const r = classifyTextCommand(cmd);
    console.log(`$ ${cmd}\n   decision=${r.decision} risk=${r.risk}`);
  }
});

// ---- D4-2 凭证 env 打印拦截 ----
section('D4-2', () => {
  for (const cmd of [
    'env | grep HW_ACCESS_KEY',
    'printenv HW_SECRET_KEY',
    'env | grep -i access_key',
    'env | grep HUAWEICLOUD_SDK_AK',   // 正对照：HUAWEICLOUD 前缀
    'env | grep HCLOUD_AK',             // 正对照：HCLOUD 前缀
  ]) {
    const r = classifyTextCommand(cmd);
    console.log(`$ ${cmd}\n   decision=${r.decision} risk=${r.risk}`);
  }
});

// ---- D4-3 明文 secret API 拦截 ----
section('D4-3', () => {
  for (const cmd of [
    'hcloud csms ShowSecretVersion --secret-name x',
    'GetSecretValue --secret-id 123',
    'hcloud csms ListSecretVersions --secret-name x',
  ]) {
    const r = classifyTextCommand(cmd);
    console.log(`$ ${cmd}\n   decision=${r.decision} risk=${r.risk}`);
  }
});

// ---- D4-15 hook 绕过尝试（大小写/编码/拼接变体）----
section('D4-15', () => {
  const variants = [
    ['基线', 'hcloud ecs DeleteServer --force'],
    ['大小写', 'hcloud ecs deleteserver --force'],
    ['大小写2', 'HCLOUD ECS DELETESERVER --FORCE'],
    ['拼接引号', 'hcloud ecs DeleteServ"er" --force'],
    ['拼接引号2', "hcloud ecs 'Delete'Server --force"],
    ['base64编码', 'echo ZWNobyBoaQo= | base64 -d | bash'],
    ['编码+shell', 'xxd -r -p <<< 6869 | sh'],
  ];
  for (const [tag, cmd] of variants) {
    const r = classifyTextCommand(cmd);
    const re = evaluateCommandRisk(cmd);
    console.log(`[${tag}] $ ${cmd}`);
    console.log(`   classifyTextCommand -> decision=${r.decision} risk=${r.risk}`);
    console.log(`   evaluateCommandRisk -> decision=${re.decision} findings=${(re.findings || []).map((f) => f.ruleId).join(',')}`);
  }
});

// ---- D4-16 命令包裹穿透（sh -c / bash -c / eval / $()）----
section('D4-16', () => {
  const wrapped = [
    ['直接', 'hcloud ecs DeleteServer --force'],
    ['sh -c', 'sh -c "hcloud ecs DeleteServer --force"'],
    ['bash -c', 'bash -c "hcloud ecs BatchDeleteServers --recursive"'],
    ['eval', 'eval "hcloud ecs DeleteServer --force"'],
    ['命令替换', '$(hcloud ecs DeleteServer --force)'],
    ['管道', 'echo x | hcloud ecs DeleteServer --force'],
  ];
  for (const [tag, cmd] of wrapped) {
    const r = classifyTextCommand(cmd);
    console.log(`[${tag}] $ ${cmd}`);
    console.log(`   decision=${r.decision} risk=${r.risk} reason=${r.reason}`);
  }
});

// ---- 脱敏冒烟 ----
section('D2-4-smoke', () => {
  const out = redactSecrets('AK=AKID1234567890ABCDEF SK=mysecretvalue123456 securityToken=TOKEN123');
  console.log('redactSecrets:', out);
});

console.log('=== DONE ===');