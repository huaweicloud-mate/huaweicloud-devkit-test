// D3-S5 复合意图分层路由探针 (2026-09-20 Hermes/Linux)
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

const SRC = process.env.HDK_SRC || join(process.cwd(), '..', 'hdk', 'plugins', 'huaweicloud-core', 'src');
const { callTool } = await import(pathToFileURL(join(SRC, 'tools.mjs')).href);

const results = [];
const log = (name, pass, actual, expected, note) =>
  results.push({ name, pass: !!pass, actual: String(actual ?? '').slice(0, 240), expected: String(expected ?? ''), note: String(note ?? '').slice(0, 160) });

async function route(intent) {
  try {
    const r = await callTool('huaweicloud_service_catalog', { intent });
    return r;
  } catch (e) {
    return { __error: String(e).slice(0, 160) };
  }
}

// 复合意图 1：存储 + 静态网站托管（期望命中 OBS + Sandbox/DevStation 多服务）
{
  const r = await route('把本地 dist 目录存到对象存储并部署一个公网静态网站，同时用数据库存数据');
  const svc = (Array.isArray(r?.services) ? r.services : (r?.matched || []).map(x => x.service)).flat();
  const flat = JSON.stringify(r).toLowerCase();
  const hitObs = flat.includes('obs');
  const hitSandbox = flat.includes('sandbox');
  log('composite-obs+sandbox', hitObs && hitSandbox, JSON.stringify(r).slice(0, 220), '同时命中 OBS + Sandbox', '存储+网站托管复合意图');
}

// 复合意图 2：Web应用 + RDS（期望命中 sandbox/website + RDS）
{
  const r = await route('部署一个带 MySQL 数据库的 Web 应用');
  const flat = JSON.stringify(r).toLowerCase();
  const hitWeb = flat.includes('sandbox') || flat.includes('website') || flat.includes('web');
  const hitRds = flat.includes('rds') || flat.includes('mysql') || flat.includes('database');
  log('composite-web+rds', hitWeb && hitRds, JSON.stringify(r).slice(0, 220), '命中 部署目标 + RDS', 'Web+RDS 复合意图');
}

// 单一意图对照（应命中单一 service）
{
  const r = await route('创建一台 Ubuntu 云服务器');
  const flat = JSON.stringify(r).toLowerCase();
  log('single-ecs', flat.includes('ecs'), JSON.stringify(r).slice(0, 200), '命中 ECS', '单一 ECS 意图');
}

console.log(JSON.stringify({ total: results.length, generatedAt: new Date().toISOString(), results }, null, 2));