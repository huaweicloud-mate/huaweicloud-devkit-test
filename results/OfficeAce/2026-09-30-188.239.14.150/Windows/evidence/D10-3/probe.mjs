// D10-3: 评测集路由覆盖率 — verify all test dimensions have corresponding tools/routes
import { loadTools } from '../_helper.mjs';
const { TOOL_DEFINITIONS } = await loadTools();

// Define the evaluation dimensions and which tools should cover them
const dimensionCoverage = {
  'D1-install-upgrade': ['huaweicloud_check_update', 'huaweicloud_upgrade', 'huaweicloud_check_cli'],
  'D2-auth': ['huaweicloud_auth_status', 'huaweicloud_auth_init', 'huaweicloud_auth_confirm', 'huaweicloud_auth_sync', 'huaweicloud_auth_switch'],
  'D3-function': ['huaweicloud_list_operations', 'huaweicloud_detect_framework', 'huaweicloud_service_catalog', 'huaweicloud_search_marketplace', 'huaweicloud_search_docs'],
  'D4-security': ['huaweicloud_hook_check_command', 'huaweicloud_hook_check_artifacts', 'huaweicloud_hook_check_deploy_plan', 'huaweicloud_run_readonly_command', 'huaweicloud_run_approved_command', 'huaweicloud_show_profile_redacted'],
  'D5-discovery': ['huaweicloud_service_catalog', 'huaweicloud_list_operations'],
  'D6-performance': ['huaweicloud_check_cli'],
  'D8-config': ['huaweicloud_setup_obs_config', 'huaweicloud_show_profile_redacted'],
  'D9-protocol': ['huaweicloud_check_cli'],
  'D10-eval': ['huaweicloud_service_catalog'],
};

const toolNames = new Set(TOOL_DEFINITIONS.map(t => t.name));
const results = {};
let allCovered = true;

for (const [dim, tools] of Object.entries(dimensionCoverage)) {
  const covered = tools.filter(t => toolNames.has(t));
  const missing = tools.filter(t => !toolNames.has(t));
  results[dim] = { expected: tools.length, covered: covered.length, missing };
  if (missing.length > 0) allCovered = false;
}

// Also check overall tool count
const totalTools = TOOL_DEFINITIONS.length;
const countOk = totalTools >= 40;

const ok = allCovered && countOk;
console.log(JSON.stringify({
  status: ok ? 'PASS' : 'FAIL',
  caseId: 'D10-3',
  why: ok ? `All ${Object.keys(dimensionCoverage).length} dimensions have tool coverage. ${totalTools} tools available.` : 'Some dimensions lack tool coverage.',
  executedAt: '20260930103000',
  totalTools,
  results
}, null, 2));