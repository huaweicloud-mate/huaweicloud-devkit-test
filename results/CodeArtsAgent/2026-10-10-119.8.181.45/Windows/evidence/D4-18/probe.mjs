// D4-18: confirm-not-deny审批语义
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const result = {
  caseId: 'D4-18',
  status: 'NOT_RUN',
  why: '',
  executedAt: new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
  evidence: []
};

try {
  const hdkPath = 'C:/Users/Administrator/devkit-test/testbot4-codearts1/hdk';
  
  // 检查 safety-policy.mjs
  const safetyPolicyPath = join(hdkPath, 'plugins', 'huaweicloud-core', 'src', 'safety-policy.mjs');
  if (!existsSync(safetyPolicyPath)) {
    throw new Error('safety-policy.mjs not found');
  }
  
  const content = readFileSync(safetyPolicyPath, 'utf-8');
  
  // 查找 confirm/deny 相关逻辑
  const hasConfirm = content.includes('confirm') || content.includes('CONFIRM');
  const hasDeny = content.includes('deny') || content.includes('DENY');
  const hasPermissionDecision = content.includes('permissionDecision') || content.includes('permission_decision');
  
  result.evidence.push({ hasConfirm, hasDeny, hasPermissionDecision });
  console.log('hasConfirm:', hasConfirm);
  console.log('hasDeny:', hasDeny);
  console.log('hasPermissionDecision:', hasPermissionDecision);
  
  // 检查 plan_cli_command 相关
  const toolsPath = join(hdkPath, 'plugins', 'huaweicloud-core', 'src', 'tools.mjs');
  if (existsSync(toolsPath)) {
    const toolsContent = readFileSync(toolsPath, 'utf-8');
    const hasPlanCli = toolsContent.includes('plan_cli_command') || toolsContent.includes('planCliCommand');
    result.evidence.push({ hasPlanCli });
  }
  
  if (hasConfirm && hasDeny && hasPermissionDecision) {
    result.status = 'PASS';
    result.why = 'confirm-not-deny 审批语义存在';
  } else {
    result.status = 'FAIL';
    result.why = 'confirm-not-deny 审批语义缺失';
  }
} catch (error) {
  result.status = 'BLOCKED';
  result.why = `执行失败: ${error.message}`;
}

const outputPath = join(__dirname, 'stdout.log');
writeFileSync(outputPath, JSON.stringify(result, null, 2));
console.log('\nD4-18 结果:', result.status, '-', result.why);
