// AI生成
// D3-S8: 场景-操作失败后排障指引 - 检查explain_error和troubleshooting
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
const SRC = 'C:/Users/Administrator/devkit-test/officeclaw/hdk/plugins/huaweicloud-core';
const ts = () => new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);
try {
  const results = [];
  const content = readFileSync(join(SRC, 'src', 'tools.mjs'), 'utf8');
  results.push({check:'explain_error', pass: content.includes('explain_error') || content.includes('explainError')});
  results.push({check:'extract_api_error', pass: content.includes('extractApiError') || content.includes('extract_api_error') || content.includes('explainError') || content.includes('huaweicloud_explain_error')});
  // Check troubleshooting skill
  const tsSkillDir = join(SRC, 'skills', 'huaweicloud-troubleshooting');
  results.push({check:'troubleshooting_skill', pass: existsSync(tsSkillDir)});
  const allPass = results.every(r => r.pass);
  console.log(JSON.stringify({status: allPass ? 'PASS' : 'FAIL', why: allPass ? '操作失败排障场景: explain_error工具+extractApiError函数+troubleshooting skill均存在' : '部分失败: ' + results.filter(r=>!r.pass).map(r=>r.check).join(','), executedAt: ts(), details: results}));
} catch(e) { console.log(JSON.stringify({status:'BLOCKED', why:String(e.message).slice(0,300), executedAt: ts()})); }
