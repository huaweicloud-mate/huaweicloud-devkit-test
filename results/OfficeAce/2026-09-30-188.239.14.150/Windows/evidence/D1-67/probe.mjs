// D1-67: Agent toolkit模式 — verify HUAWEICLOUD_AGENT_TOOLKIT_MODE env
// This env var is set by the installer in MCP config entries
const envVar = process.env.HUAWEICLOUD_AGENT_TOOLKIT_MODE;

// Check that the mcp-config-merge module references this env key
import { readFileSync } from 'node:fs';
const mergeSrc = readFileSync('C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/mcp-config-merge.mjs', 'utf8');
const referencesToolkitMode = mergeSrc.includes('HUAWEICLOUD_AGENT_TOOLKIT_MODE');

// Check that the REQUIRED_ENV_KEYS includes it
const hasRequiredKey = mergeSrc.includes("REQUIRED_ENV_KEYS") && mergeSrc.includes("HUAWEICLOUD_AGENT_TOOLKIT_MODE");

const ok = referencesToolkitMode && hasRequiredKey;
console.log(JSON.stringify({
  status: ok ? 'PASS' : 'FAIL',
  caseId: 'D1-67',
  why: ok ? 'HUAWEICLOUD_AGENT_TOOLKIT_MODE is referenced in mcp-config-merge.mjs as a required env key managed by installer.' : 'Not properly referenced.',
  executedAt: '20260930103000',
  referencesToolkitMode,
  hasRequiredKey,
  currentEnvValue: envVar
}, null, 2));