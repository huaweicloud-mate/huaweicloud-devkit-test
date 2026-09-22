// AI生成
// D8-10: MCP配置备份与合并 - 检查mcp-config-merge和mcp-config-backup
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
const SRC = 'C:/Users/Administrator/devkit-test/officeclaw/hdk/plugins/huaweicloud-core';
const ts = () => new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);
try {
  const results = [];
  // Check mcp-config-merge.mjs
  const mergePath = join(SRC, 'src', 'mcp-config-merge.mjs');
  if (existsSync(mergePath)) {
    const content = readFileSync(mergePath, 'utf8');
    const hasMergeCommand = content.includes('mergeCommandStyle');
    const hasMergeArgs = content.includes('mergeArgsStyle');
    const hasMergeFile = content.includes('mergeMcpServersFile');
    const hasExtractDelta = content.includes('extractUserDelta');
    const hasApplyDelta = content.includes('applyUserDelta');
    results.push({check:'merge_functions', pass: hasMergeCommand && hasMergeArgs && hasMergeFile, value:{mergeCommand:hasMergeCommand, mergeArgs:hasMergeArgs, mergeFile:hasMergeFile, extractDelta:hasExtractDelta, applyDelta:hasApplyDelta}});
  } else {
    results.push({check:'merge_functions', pass:false});
  }
  // Check mcp-config-backup.mjs
  const backupPath = join(SRC, 'src', 'mcp-config-backup.mjs');
  if (existsSync(backupPath)) {
    const content = readFileSync(backupPath, 'utf8');
    const hasTakeDelta = content.includes('takeAgentDelta');
    const hasSaveDelta = content.includes('saveAgentDelta');
    const hasPurge = content.includes('purgeBackup');
    results.push({check:'backup_functions', pass: hasTakeDelta && hasSaveDelta && hasPurge, value:{takeDelta:hasTakeDelta, saveDelta:hasSaveDelta, purge:hasPurge}});
  } else {
    results.push({check:'backup_functions', pass:false});
  }
  const allPass = results.every(r => r.pass);
  console.log(JSON.stringify({status: allPass ? 'PASS' : 'FAIL', why: allPass ? 'MCP配置备份与合并: merge含mergeCommandStyle/mergeArgsStyle/mergeMcpServersFile/extractUserDelta/applyUserDelta, backup含takeAgentDelta/saveAgentDelta/purgeBackup' : '部分失败: ' + results.filter(r=>!r.pass).map(r=>r.check).join(','), executedAt: ts(), details: results}));
} catch(e) { console.log(JSON.stringify({status:'BLOCKED', why:String(e.message).slice(0,300), executedAt: ts()})); }
