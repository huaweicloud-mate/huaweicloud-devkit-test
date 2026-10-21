import { readFileSync } from 'node:fs';
import { join } from 'node:path';
const hdkSrc = 'C:\\Users\\Administrator\\multica_workspaces\\vector-8988c3df7bc9\\task-fe1b399ab162\\hermes-home\\tools\\node-26.7.0-win32-x64\\node_modules\\huaweicloud-devkit\\plugins\\huaweicloud-core\\src';
const src = readFileSync(join(hdkSrc, 'tools.mjs'), 'utf-8');

// Extract just the serviceCatalog function
const start = src.indexOf('function serviceCatalog');
// Find matching closing brace
let depth = 0;
let end = start;
for (let i = start; i < src.length; i++) {
  if (src[i] === '{') depth++;
  if (src[i] === '}') depth--;
  if (depth === 0 && i > start) { end = i + 1; break; }
}
const fnSrc = src.slice(start, end);

// Eval the function
eval(fnSrc);

// Test with various intents
const tests = [
  {intent: '查看ECS实例', expect: 'ecs'},
  {intent: '创建一台ECS云服务器', expect: 'ecs'},
  {intent: '上传文件到OBS对象存储', expect: 'obs'},
  {intent: '申请弹性公网IP', expect: 'eip'},
  {intent: '创建RDS数据库实例', expect: 'rds'},
  {intent: '查看VPC虚拟私有云', expect: 'vpc'},
  {intent: '创建云硬盘备份CBR', expect: 'cbr'},
  {intent: '查看IAM用户列表', expect: 'iam'},
  {intent: '创建KMS密钥', expect: 'kms'},
  {intent: '部署FunctionGraph函数', expect: 'functiongraph'},
  {intent: '查询BSS账单', expect: 'bss'},
  {intent: '设置CES云监控告警', expect: 'ces'},
  {intent: '创建ELB负载均衡', expect: 'elb'},
  {intent: '查看CTS云审计日志', expect: 'cts'},
  {intent: '管理DMS分布式消息服务', expect: 'dms'},
];

const results = [];
for (const t of tests) {
  try {
    const r = serviceCatalog(t.intent);
    const content = JSON.stringify(r).toLowerCase();
    const hit = content.includes(t.expect);
    results.push({id: t.intent.slice(0,15), hit, expect: t.expect, services: r?.services || r?.recommendations?.map(x=>x.service) || 'none'});
  } catch(e) {
    results.push({id: t.intent.slice(0,15), hit: false, error: e.message.slice(0,50)});
  }
}
console.log(JSON.stringify(results, null, 2));
