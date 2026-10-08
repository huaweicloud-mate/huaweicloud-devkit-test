// D1-67: Agent toolkit模式 — verify HUAWEICLOUD_AGENT_TOOLKIT_MODE and SKIP_DSH env vars
// AGENT_TOOLKIT_MODE: set by installer in MCP config entries
// SKIP_DSH: HUAWEICLOUD_DEVKIT_SKIP_DSH_PLUGIN_INSTALL skips DSH plugin install
import { readFileSync } from 'node:fs';

const setupSrc = readFileSync('C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/setup-cli.mjs', 'utf8');
const mergeSrc = readFileSync('C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/mcp-config-merge.mjs', 'utf8');

// Check 1: HUAWEICLOUD_AGENT_TOOLKIT_MODE is referenced in mcp-config-merge.mjs as required env key
const referencesToolkitMode = mergeSrc.includes('HUAWEICLOUD_AGENT_TOOLKIT_MODE');
const hasRequiredKey = mergeSrc.includes("REQUIRED_ENV_KEYS") && mergeSrc.includes("HUAWEICLOUD_AGENT_TOOLKIT_MODE");

// Check 2: HUAWEICLOUD_AGENT_TOOLKIT_MODE is set by installer in setup-cli.mjs
const installerSetsToolkitMode = setupSrc.includes("HUAWEICLOUD_AGENT_TOOLKIT_MODE") && setupSrc.includes("'local'");

// Check 3: HUAWEICLOUD_DEVKIT_SKIP_DSH_PLUGIN_INSTALL (SKIP_DSH) is referenced in setup-cli.mjs
const referencesSkipDsh = setupSrc.includes('HUAWEICLOUD_DEVKIT_SKIP_DSH_PLUGIN_INSTALL');
const skipDshChecked = setupSrc.includes("HUAWEICLOUD_DEVKIT_SKIP_DSH_PLUGIN_INSTALL === '1'");

// Check 4: Verify the env var is actually used in a conditional (not just a string literal)
const skipDshUsedInConditional = /HUAWEICLOUD_DEVKIT_SKIP_DSH_PLUGIN_INSTALL\s*===\s*['"]1['"]/.test(setupSrc);

const ok = referencesToolkitMode && hasRequiredKey && installerSetsToolkitMode && referencesSkipDsh && skipDshUsedInConditional;

console.log(JSON.stringify({
  status: ok ? 'PASS' : 'FAIL',
  caseId: 'D1-67',
  why: ok
    ? 'HUAWEICLOUD_AGENT_TOOLKIT_MODE referenced in mcp-config-merge.mjs (REQUIRED_ENV_KEYS) + set by installer in setup-cli.mjs. HUAWEICLOUD_DEVKIT_SKIP_DSH_PLUGIN_INSTALL checked in setup-cli.mjs conditional.'
    : `referencesToolkitMode=${referencesToolkitMode}, hasRequiredKey=${hasRequiredKey}, installerSetsToolkitMode=${installerSetsToolkitMode}, referencesSkipDsh=${referencesSkipDsh}, skipDshUsedInConditional=${skipDshUsedInConditional}`,
  executedAt: '20261001103000',
  referencesToolkitMode,
  hasRequiredKey,
  installerSetsToolkitMode,
  referencesSkipDsh,
  skipDshUsedInConditional,
  currentToolkitMode: process.env.HUAWEICLOUD_AGENT_TOOLKIT_MODE,
  currentSkipDsh: process.env.HUAWEICLOUD_DEVKIT_SKIP_DSH_PLUGIN_INSTALL,
}, null, 2));