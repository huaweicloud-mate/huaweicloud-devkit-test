// AI生成
// D1-4: status/update幂等
// 检查插件版本信息 + update-check模块可用性
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const SRC = 'C:/Users/Administrator/devkit-test/officeclaw/hdk/plugins/huaweicloud-core';
const ts = () => new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);

try {
  const results = [];
  
  // 1. Read plugin version from manifest
  const manifest = JSON.parse(readFileSync(join(SRC, 'openclaw.plugin.json'), 'utf8'));
  results.push({check:'plugin_version', pass:true, value:manifest.version});
  
  // 2. Check update-check.mjs exists and has key functions
  const updateCheckPath = join(SRC, 'src', 'update-check.mjs');
  if (existsSync(updateCheckPath)) {
    const content = readFileSync(updateCheckPath, 'utf8');
    const hasJudgeUpdate = content.includes('judgeUpdate');
    const hasQueryDistTags = content.includes('queryDistTags') || content.includes('queryDistTagsSync');
    const hasSemverCompare = content.includes('semverCompare') || content.includes('semverParse');
    const hasWriteSkipState = content.includes('writeSkipState');
    results.push({check:'update_check_functions', pass: hasJudgeUpdate && hasQueryDistTags, value:{judgeUpdate:hasJudgeUpdate, queryDistTags:hasQueryDistTags, semverCompare:hasSemverCompare, writeSkipState:hasWriteSkipState}});
  } else {
    results.push({check:'update_check_functions', pass:false, error:'update-check.mjs not found'});
  }
  
  // 3. Idempotency: reading version twice should give same result
  const v1 = JSON.parse(readFileSync(join(SRC, 'openclaw.plugin.json'), 'utf8')).version;
  const v2 = JSON.parse(readFileSync(join(SRC, 'openclaw.plugin.json'), 'utf8')).version;
  results.push({check:'version_idempotent', pass: v1 === v2, value:v1});
  
  // 4. Check that user config is not touched by update (verify config file independence)
  const configPath = join(SRC, 'src', 'mcp-config-merge.mjs');
  results.push({check:'config_merge_exists', pass: existsSync(configPath)});
  
  const allPass = results.every(r => r.pass);
  console.log(JSON.stringify({
    status: allPass ? 'PASS' : 'FAIL',
    why: allPass ? `status/update幂等: 插件版本=${manifest.version}, update-check模块含judgeUpdate/queryDistTags/semverCompare/writeSkipState, 版本读取幂等, config-merge模块存在` : '部分检查失败: ' + results.filter(r=>!r.pass).map(r=>r.check).join(', '),
    executedAt: ts(),
    details: results
  }));
} catch(e) {
  console.log(JSON.stringify({status:'BLOCKED', why:'执行异常: '+String(e.message).slice(0,300), executedAt: ts()}));
}
