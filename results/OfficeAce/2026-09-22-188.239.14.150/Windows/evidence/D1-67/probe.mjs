// AI生成
// D1-67: Agent toolkit模式与DSH跳过安装环境变量
// BLOCKED: 需DSH环境 - test what we can without DSH
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ts = () => new Date().toISOString().replace(/[-:T]/g,'').slice(0,14);

const results = {};

try {
  // Check if HUAWEICLOUD_DEVKIT_SKIP_DSH_PLUGIN_INSTALL is referenced in setup-cli.mjs
  const setupCliPath = 'C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/setup-cli.mjs';
  const setupCli = fs.readFileSync(setupCliPath, 'utf8');
  
  results.hasSkipDshEnv = setupCli.includes('HUAWEICLOUD_DEVKIT_SKIP_DSH_PLUGIN_INSTALL');
  results.hasAgentToolkitMode = setupCli.includes('HUAWEICLOUD_AGENT_TOOLKIT_MODE');
  
  // Check mcp-config-merge.mjs for REQUIRED_ENV_KEYS
  const mcpConfigPath = 'C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/mcp-config-merge.mjs';
  let mcpConfig = '';
  try { mcpConfig = fs.readFileSync(mcpConfigPath, 'utf8'); } catch {}
  results.hasRequiredEnvKeys = mcpConfig.includes('REQUIRED_ENV_KEYS') || mcpConfig.includes('HCLOUD_BIN');
  results.hasHCLOUDBin = mcpConfig.includes('HCLOUD_BIN') || setupCli.includes('HCLOUD_BIN');

  // Check if SKIP_DSH logic exists
  const skipDshPattern = /HUAWEICLOUD_DEVKIT_SKIP_DSH_PLUGIN_INSTALL/g;
  const skipDshMatches = setupCli.match(skipDshPattern);
  results.skipDshRefCount = skipDshMatches ? skipDshMatches.length : 0;

  // Check if AGENT_TOOLKIT_MODE logic exists
  const toolkitPattern = /HUAWEICLOUD_AGENT_TOOLKIT_MODE/g;
  const toolkitMatches = setupCli.match(toolkitPattern);
  results.toolkitModeRefCount = toolkitMatches ? toolkitMatches.length : 0;

  // This test is BLOCKED because it requires DSH environment to fully test
  // But we can verify the code references exist
  const codeReferencesExist = results.hasSkipDshEnv && results.hasAgentToolkitMode;
  
  const res = {
    status: 'BLOCKED',
    why: '需DSH环境才能完整测试AGENT_TOOLKIT_MODE注入和SKIP_DSH跳过安装行为',
    blockedReason: 'DSH客户端环境不可用，无法执行真实安装流程验证',
    executedAt: ts(),
    codeReferencesExist,
    ...results
  };
  
  fs.writeFileSync(path.join(__dirname, 'stdout.log'), JSON.stringify(res, null, 2), 'utf8');
  console.log(JSON.stringify(res, null, 2));
} catch (e) {
  const res = { status: 'FAIL', why: `执行失败: ${e.message}`, executedAt: ts(), error: e.stack };
  fs.writeFileSync(path.join(__dirname, 'stdout.log'), JSON.stringify(res, null, 2), 'utf8');
  console.log(JSON.stringify(res, null, 2));
}
process.exit(0);
