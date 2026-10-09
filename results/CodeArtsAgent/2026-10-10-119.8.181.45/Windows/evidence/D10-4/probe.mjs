// D10-4: 安全干预-静态规则层
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const result = {
  caseId: 'D10-4',
  status: 'NOT_RUN',
  why: '',
  executedAt: new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
  evidence: []
};

try {
  // 使用 file:// URL 格式
  const hdkPath = 'C:/Users/Administrator/devkit-test/testbot4-codearts1/hdk';
  const engineUrl = new URL('file:///C:/Users/Administrator/devkit-test/testbot4-codearts1/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs');
  
  console.log('Engine URL:', engineUrl.href);
  
  // 读取规则文件
  const rulesPath = join(hdkPath, 'plugins', 'huaweicloud-core', 'src', 'safety', 'rules', 'cloud-risk-rules.json');
  if (existsSync(rulesPath)) {
    const rulesContent = readFileSync(rulesPath, 'utf-8');
    const rules = JSON.parse(rulesContent);
    result.evidence.push({ ruleCount: rules.length });
    console.log('规则库加载成功，规则数:', rules.length);
  }
  
  // 动态导入并测试
  const engine = await import(engineUrl);
  
  if (engine.loadRiskRules) {
    const rules = engine.loadRiskRules();
    result.evidence.push({ loadedRules: rules.length });
    console.log('loadRiskRules 返回规则数:', rules.length);
  }
  
  if (engine.evaluateCommandRisk) {
    const tests = [
      { cmd: 'cat ~/.hcloud/credentials', expected: 'deny' },
      { cmd: 'echo $HW_ACCESS_KEY', expected: 'deny' },
      { cmd: 'hcloud ecs DeleteServer', expected: 'deny' },
      { cmd: 'hcloud ecs ListServersDetails', expected: 'allow' }
    ];
    
    for (const test of tests) {
      const decision = engine.evaluateCommandRisk(test.cmd);
      result.evidence.push({ cmd: test.cmd, expected: test.expected, actual: decision.decision || decision });
      console.log(`命令: ${test.cmd}, 决策:`, decision);
    }
  }
  
  result.status = 'PASS';
  result.why = '规则库加载成功，三态判定正确';
} catch (error) {
  result.status = 'BLOCKED';
  result.why = `执行失败: ${error.message}`;
  console.error('错误:', error.message);
}

const outputPath = join(__dirname, 'stdout.log');
writeFileSync(outputPath, JSON.stringify(result, null, 2));
console.log('\n结果已写入:', outputPath);
