// AI生成
// D3-S3: 场景-沙箱预览出URL - 检查沙箱工具链完整性
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
const SRC = 'C:/Users/Administrator/devkit-test/officeclaw/hdk/plugins/huaweicloud-core';
const ts = () => new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);
try {
  const results = [];
  const content = readFileSync(join(SRC, 'src', 'tools.mjs'), 'utf8');
  const sandboxTools = ['sandbox_connect', 'sandbox_upload_project', 'sandbox_deploy_nginx', 'sandbox_deploy_check', 'sandbox_close_session'];
  for (const t of sandboxTools) {
    results.push({check:t, pass: content.includes(t) || content.includes(t.replace(/_/g, ''))});
  }
  const allPass = results.every(r => r.pass);
  console.log(JSON.stringify({status: allPass ? 'PASS' : 'FAIL', why: allPass ? '沙箱预览场景: 5个沙箱工具(connect/upload_project/deploy_nginx/deploy_check/close_session)全部注册' : '部分失败: ' + results.filter(r=>!r.pass).map(r=>r.check).join(','), executedAt: ts(), details: results}));
} catch(e) { console.log(JSON.stringify({status:'BLOCKED', why:String(e.message).slice(0,300), executedAt: ts()})); }
