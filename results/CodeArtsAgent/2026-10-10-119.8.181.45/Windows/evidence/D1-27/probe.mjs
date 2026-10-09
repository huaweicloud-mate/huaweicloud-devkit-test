// D1-27: 检测语义-已是最新
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const result = {
  caseId: 'D1-27',
  status: 'NOT_RUN',
  why: '',
  executedAt: new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
  evidence: []
};

try {
  const hdkPath = 'C:/Users/Administrator/devkit-test/testbot4-codearts1/hdk';
  const updateCheckPath = join(hdkPath, 'plugins', 'huaweicloud-core', 'src', 'update-check.mjs');
  
  if (existsSync(updateCheckPath)) {
    const content = readFileSync(updateCheckPath, 'utf-8');
    const hasJudgeUpdate = content.includes('judgeUpdate') || content.includes('judge_update');
    const hasUpToDate = content.includes('up_to_date') || content.includes('up-to-date');
    const hasUpdateAvailable = content.includes('update_available') || content.includes('updateAvailable');
    
    result.evidence.push({ hasJudgeUpdate, hasUpToDate, hasUpdateAvailable });
    
    if (hasJudgeUpdate && hasUpToDate) {
      result.status = 'PASS';
      result.why = '检测语义-已是最新逻辑完整';
    } else {
      result.status = 'FAIL';
      result.why = '检测语义逻辑缺失';
    }
  } else {
    result.status = 'BLOCKED';
    result.why = 'update-check.mjs 不存在';
  }
} catch (error) {
  result.status = 'BLOCKED';
  result.why = `执行失败: ${error.message}`;
}

const outputPath = join(__dirname, 'stdout.log');
writeFileSync(outputPath, JSON.stringify(result, null, 2));
console.log('D1-27 结果:', result.status, '-', result.why);
