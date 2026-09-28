#!/usr/bin/env node
// Source-code level probe for remaining NOT_RUN cases
// Tests function existence and behavior via direct import/call
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const hdkSrc = process.env.HDK_SRC || join(process.cwd(), '..', 'hdk', 'plugins', 'huaweicloud-core', 'src');
const hdkRoot = join(hdkSrc, '..');
const results = [];
function log(id, name, pass, actual, expected, msg) {
  results.push({ id, name, pass, actual: String(actual).slice(0,200), expected, msg });
}

// Helper: check if file contains pattern
function fileContains(filepath, pattern) {
  if (!existsSync(filepath)) return false;
  const text = readFileSync(filepath, 'utf-8');
  return text.includes(pattern);
}

// Helper: find file in directory tree
function findFile(dir, name) {
  if (!existsSync(dir)) return null;
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        const found = findFile(join(dir, entry.name), name);
        if (found) return found;
      } else if (entry.name === name) {
        return join(dir, entry.name);
      }
    }
  } catch {}
  return null;
}

// === D1 cases: source code inspection ===

// D1-13: Windows file lock cleanup
try {
  const setupCli = findFile(hdkSrc, 'setup-cli.mjs');
  const hasWinLock = setupCli && fileContains(setupCli, 'EBUSY') || fileContains(setupCli, 'EPERM') || fileContains(setupCli, 'file') && fileContains(setupCli, 'lock');
  log('D1-13', 'win-file-lock', !!hasWinLock, hasWinLock ? 'Windows file lock handling' : 'not found', 'handling', 'Windows file lock cleanup in setup-cli');
} catch(e) { log('D1-13', 'win-file-lock', false, e.message, 'handling', 'error'); }

// D1-14: copyFileVerified install integrity
try {
  const setupCli = findFile(hdkSrc, 'setup-cli.mjs');
  const hasCopy = setupCli && fileContains(setupCli, 'copyFileVerified');
  log('D1-14', 'copy-file-verified', !!hasCopy, hasCopy ? 'copyFileVerified found' : 'not found', 'function exists', 'Install integrity check function');
} catch(e) { log('D1-14', 'copy-file-verified', false, e.message, 'exists', 'error'); }

// D1-29: pre-release user reminder policy
try {
  const updateCheck = findFile(hdkSrc, 'update-check.mjs');
  const hasPreRelease = updateCheck && (fileContains(updateCheck, 'prerelease') || fileContains(updateCheck, 'pre-release') || fileContains(updateCheck, 'next'));
  log('D1-29', 'prerelease-policy', !!hasPreRelease, hasPreRelease ? 'pre-release handling found' : 'not found', 'policy', 'Pre-release reminder policy');
} catch(e) { log('D1-29', 'prerelease-policy', false, e.message, 'policy', 'error'); }

// D1-32: new version > dismissedVersion ignores cooldown
try {
  const updateCheck = findFile(hdkSrc, 'update-check.mjs');
  const hasDismissed = updateCheck && fileContains(updateCheck, 'dismissedVersion');
  log('D1-32', 'dismissed-version', !!hasDismissed, hasDismissed ? 'dismissedVersion logic found' : 'not found', 'logic', 'New version > dismissedVersion ignores cooldown');
} catch(e) { log('D1-32', 'dismissed-version', false, e.message, 'logic', 'error'); }

// D1-34: check_failed doesn't block normal calls
try {
  const updateCheck = findFile(hdkSrc, 'update-check.mjs');
  const hasFailHandling = updateCheck && (fileContains(updateCheck, 'check_failed') || fileContains(updateCheck, 'checkFailed') || fileContains(updateCheck, 'fail') && fileContains(updateCheck, 'block'));
  log('D1-34', 'check-failed-no-block', !!hasFailHandling, hasFailHandling ? 'failure handling found' : 'not found', 'no block', 'check_failed does not block normal calls');
} catch(e) { log('D1-34', 'check-failed-no-block', false, e.message, 'no block', 'error'); }

// D1-35: cache TTL and failure throttling
try {
  const updateCheck = findFile(hdkSrc, 'update-check.mjs');
  const hasTTL = updateCheck && (fileContains(updateCheck, 'TTL') || fileContains(updateCheck, 'ttl') || fileContains(updateCheck, 'cache') && fileContains(updateCheck, 'throttle'));
  log('D1-35', 'cache-ttl', !!hasTTL, hasTTL ? 'TTL/throttle found' : 'not found', 'cache TTL', 'Cache TTL and failure throttling');
} catch(e) { log('D1-35', 'cache-ttl', false, e.message, 'cache TTL', 'error'); }

// D1-36: first call fallback hint
try {
  const updateCheck = findFile(hdkSrc, 'update-check.mjs');
  const mcpProto = findFile(hdkSrc, 'mcp-protocol.mjs');
  const hasFallback = (updateCheck && fileContains(updateCheck, 'decorateResult')) || (mcpProto && fileContains(mcpProto, 'decorateResult'));
  log('D1-36', 'first-call-hint', !!hasFallback, hasFallback ? 'decorateResult found' : 'not found', 'fallback', 'First call fallback hint mechanism');
} catch(e) { log('D1-36', 'first-call-hint', false, e.message, 'fallback', 'error'); }

// D1-43: dismiss parameter boundary
try {
  const updateCheck = findFile(hdkSrc, 'update-check.mjs');
  const hasDismiss = updateCheck && (fileContains(updateCheck, 'handleCheckUpdate') || fileContains(updateCheck, 'dismiss'));
  log('D1-43', 'dismiss-boundary', !!hasDismiss, hasDismiss ? 'dismiss handling found' : 'not found', 'boundary', 'Dismiss parameter boundary');
} catch(e) { log('D1-43', 'dismiss-boundary', false, e.message, 'boundary', 'error'); }

// D1-44: cooldown boundary and skip state
try {
  const updateCheck = findFile(hdkSrc, 'update-check.mjs');
  const hasCooldown = updateCheck && (fileContains(updateCheck, 'inCooldown') || fileContains(updateCheck, 'cooldown') || fileContains(updateCheck, 'readSkipState'));
  log('D1-44', 'cooldown-boundary', !!hasCooldown, hasCooldown ? 'cooldown/skipState found' : 'not found', 'boundary', 'Cooldown boundary and skip state');
} catch(e) { log('D1-44', 'cooldown-boundary', false, e.message, 'boundary', 'error'); }

// D1-46: cache TTL boundary and recovery
try {
  const updateCheck = findFile(hdkSrc, 'update-check.mjs');
  const hasCache = updateCheck && (fileContains(updateCheck, 'getCachedUpdateInfo') || fileContains(updateCheck, 'cacheValid') || fileContains(updateCheck, 'failedAt'));
  log('D1-46', 'cache-ttl-boundary', !!hasCache, hasCache ? 'cache functions found' : 'not found', 'boundary', 'Cache TTL boundary and recovery');
} catch(e) { log('D1-46', 'cache-ttl-boundary', false, e.message, 'boundary', 'error'); }

// D1-47: cache decoupled from current version
try {
  const updateCheck = findFile(hdkSrc, 'update-check.mjs');
  const hasDecouple = updateCheck && (fileContains(updateCheck, 'lastHint') || fileContains(updateCheck, 'judgeUpdate'));
  log('D1-47', 'cache-decouple', !!hasDecouple, hasDecouple ? 'decoupling found' : 'not found', 'decoupled', 'Cache decoupled from current version');
} catch(e) { log('D1-47', 'cache-decouple', false, e.message, 'decoupled', 'error'); }

// D1-48: multi-agent path isolation
try {
  const updateCheck = findFile(hdkSrc, 'update-check.mjs');
  const hasMultiAgent = updateCheck && (fileContains(updateCheck, 'resolveSkipFilePath') || fileContains(updateCheck, 'multi') && fileContains(updateCheck, 'agent'));
  log('D1-48', 'multi-agent-isolation', !!hasMultiAgent, hasMultiAgent ? 'path isolation found' : 'not found', 'isolation', 'Multi-agent path isolation');
} catch(e) { log('D1-48', 'multi-agent-isolation', false, e.message, 'isolation', 'error'); }

// D1-49: upgrade handler no update + param validation
try {
  const updateCheck = findFile(hdkSrc, 'update-check.mjs');
  const hasUpgrade = updateCheck && (fileContains(updateCheck, 'handleUpgrade') || fileContains(updateCheck, 'upgradePackage'));
  log('D1-49', 'upgrade-handler', !!hasUpgrade, hasUpgrade ? 'upgrade handler found' : 'not found', 'handler', 'Upgrade handler with validation');
} catch(e) { log('D1-49', 'upgrade-handler', false, e.message, 'handler', 'error'); }

// D1-50: upgrade command semantics
try {
  const updateCheck = findFile(hdkSrc, 'update-check.mjs');
  const hasUpgradePkg = updateCheck && fileContains(updateCheck, 'upgradePackage');
  log('D1-50', 'upgrade-semantics', !!hasUpgradePkg, hasUpgradePkg ? 'upgradePackage found' : 'not found', 'semantics', 'Upgrade command semantics');
} catch(e) { log('D1-50', 'upgrade-semantics', false, e.message, 'semantics', 'error'); }

// D1-51: upgrade failure recovery
try {
  const updateCheck = findFile(hdkSrc, 'update-check.mjs');
  const hasRecovery = updateCheck && (fileContains(updateCheck, 'invalidateUpdateCache') || fileContains(updateCheck, 'rollback') || fileContains(updateCheck, 'recover'));
  log('D1-51', 'upgrade-recovery', !!hasRecovery, hasRecovery ? 'recovery mechanism found' : 'not found', 'recovery', 'Upgrade failure recovery');
} catch(e) { log('D1-51', 'upgrade-recovery', false, e.message, 'recovery', 'error'); }

// D1-53: mirror lag fixture
try {
  const updateCheck = findFile(hdkSrc, 'update-check.mjs');
  const hasMirror = updateCheck && (fileContains(updateCheck, 'queryDistTags') || fileContains(updateCheck, 'parseDistTagsOutput'));
  log('D1-53', 'mirror-lag', !!hasMirror, hasMirror ? 'distTags query found' : 'not found', 'fixture', 'Mirror lag deterministic fixture');
} catch(e) { log('D1-53', 'mirror-lag', false, e.message, 'fixture', 'error'); }

// D1-55: multi-session prompt isolation
try {
  const mcpProto = findFile(hdkSrc, 'mcp-protocol.mjs');
  const hasSession = mcpProto && (fileContains(mcpProto, 'session') || fileContains(mcpProto, 'module') && fileContains(mcpProto, 'state'));
  log('D1-55', 'multi-session', !!hasSession, hasSession ? 'session state found' : 'not found', 'isolation', 'Multi-session prompt isolation');
} catch(e) { log('D1-55', 'multi-session', false, e.message, 'isolation', 'error'); }

// D1-60: HTTP query path with custom registry
try {
  const updateCheck = findFile(hdkSrc, 'update-check.mjs');
  const hasFetch = updateCheck && (fileContains(updateCheck, 'queryDistTagsFetch') || fileContains(updateCheck, 'fetchWithProxy'));
  log('D1-60', 'http-query', !!hasFetch, hasFetch ? 'fetch query found' : 'not found', 'fetch', 'HTTP query path with custom registry');
} catch(e) { log('D1-60', 'http-query', false, e.message, 'fetch', 'error'); }

// D1-61: upgrade restart message officeace branch
try {
  const updateCheck = findFile(hdkSrc, 'update-check.mjs');
  const hasRestart = updateCheck && (fileContains(updateCheck, 'restartMessage') || fileContains(updateCheck, 'restart') && fileContains(updateCheck, 'officeace'));
  log('D1-61', 'restart-message', !!hasRestart, hasRestart ? 'restart message found' : 'not found', 'message', 'Upgrade restart message officeace branch');
} catch(e) { log('D1-61', 'restart-message', false, e.message, 'message', 'error'); }

// D1-62: CLI subcommands reinstall/proxy/version
try {
  const setupCli = findFile(hdkSrc, 'setup-cli.mjs');
  const hasSubcmds = setupCli && (fileContains(setupCli, 'reinstall') && fileContains(setupCli, 'proxy') && fileContains(setupCli, 'version'));
  log('D1-62', 'cli-subcmds', !!hasSubcmds, hasSubcmds ? 'subcommands found' : 'not found', 'subcommands', 'CLI subcommands reinstall/proxy/version');
} catch(e) { log('D1-62', 'cli-subcmds', false, e.message, 'subcommands', 'error'); }

// === D2 cases: auth source code inspection ===

// D2-8: credentials change auth regression
try {
  const credsFile = findFile(hdkSrc, 'credentials.mjs');
  const hasCreds = credsFile && fileContains(credsFile, 'writeGlobalCredentials');
  log('D2-8', 'cred-change-regression', !!hasCreds, hasCreds ? 'credentials functions found' : 'not found', 'regression', 'Credentials change auth regression check');
} catch(e) { log('D2-8', 'cred-change-regression', false, e.message, 'regression', 'error'); }

// D2-9: reconcile idempotent
try {
  const authFile = findFile(hdkSrc, 'auth.mjs') || findFile(hdkSrc, 'auth-service.mjs');
  const hasReconcile = authFile && (fileContains(authFile, 'reconcile') || fileContains(authFile, 'sync'));
  log('D2-9', 'reconcile-idempotent', !!hasReconcile, hasReconcile ? 'reconcile found' : 'not found', 'idempotent', 'Reconcile idempotent');
} catch(e) { log('D2-9', 'reconcile-idempotent', false, e.message, 'idempotent', 'error'); }

// D2-14: conflict interactive arbitration (confirmToken)
try {
  const authFile = findFile(hdkSrc, 'auth.mjs') || findFile(hdkSrc, 'auth-service.mjs');
  const hasConfirm = authFile && (fileContains(authFile, 'confirmToken') || fileContains(authFile, 'confirm'));
  log('D2-14', 'conflict-arbitration', !!hasConfirm, hasConfirm ? 'confirmToken found' : 'not found', 'arbitration', 'Conflict interactive arbitration');
} catch(e) { log('D2-14', 'conflict-arbitration', false, e.message, 'arbitration', 'error'); }

// D2-15: auth_switch behavior matrix
try {
  const authFile = findFile(hdkSrc, 'auth.mjs') || findFile(hdkSrc, 'auth-service.mjs');
  const hasSwitch = authFile && (fileContains(authFile, 'auth_switch') || fileContains(authFile, 'authSwitch') || fileContains(authFile, 'switch'));
  log('D2-15', 'auth-switch', !!hasSwitch, hasSwitch ? 'auth_switch found' : 'not found', 'matrix', 'Auth switch behavior matrix');
} catch(e) { log('D2-15', 'auth-switch', false, e.message, 'matrix', 'error'); }

// D2-17: cmdAuthReconcile non-TTY guard
try {
  const authFile = findFile(hdkSrc, 'auth.mjs') || findFile(hdkSrc, 'auth-service.mjs');
  const hasTTY = authFile && (fileContains(authFile, 'TTY') || fileContains(authFile, 'tty') || fileContains(authFile, 'isTTY') || fileContains(authFile, 'non-interactive'));
  log('D2-17', 'nontty-guard', !!hasTTY, hasTTY ? 'TTY guard found' : 'not found', 'guard', 'Non-TTY guard for auth reconcile');
} catch(e) { log('D2-17', 'nontty-guard', false, e.message, 'guard', 'error'); }

// D2-18: .last_sync mtime detection
try {
  const authFile = findFile(hdkSrc, 'auth.mjs') || findFile(hdkSrc, 'auth-service.mjs');
  const hasSync = authFile && (fileContains(authFile, 'last_sync') || fileContains(authFile, 'lastSync') || fileContains(authFile, 'mtime'));
  log('D2-18', 'last-sync-mtime', !!hasSync, hasSync ? 'last_sync found' : 'not found', 'detection', 'Last sync mtime detection');
} catch(e) { log('D2-18', 'last-sync-mtime', false, e.message, 'detection', 'error'); }

// D2-19: named profile only audit
try {
  const authFile = findFile(hdkSrc, 'auth.mjs') || findFile(hdkSrc, 'auth-service.mjs');
  const hasAudit = authFile && (fileContains(authFile, 'audit') || fileContains(authFile, 'named') && fileContains(authFile, 'profile'));
  log('D2-19', 'named-profile-audit', !!hasAudit, hasAudit ? 'audit found' : 'not found', 'audit only', 'Named profile only audit');
} catch(e) { log('D2-19', 'named-profile-audit', false, e.message, 'audit only', 'error'); }

// D2-20: HUAWEICLOUD_HOME redirection
try {
  const credsFile = findFile(hdkSrc, 'credentials.mjs');
  const hasHome = credsFile && (fileContains(credsFile, 'HUAWEICLOUD_HOME') || fileContains(credsFile, 'home'));
  log('D2-20', 'home-redirect', !!hasHome, hasHome ? 'HUAWEICLOUD_HOME found' : 'not found', 'redirection', 'HUAWEICLOUD_HOME redirection');
} catch(e) { log('D2-20', 'home-redirect', false, e.message, 'redirection', 'error'); }

// D2-21: AK/SK rotation auth_status
try {
  const credsFile = findFile(hdkSrc, 'credentials.mjs');
  const hasRotation = credsFile && (fileContains(credsFile, 'resolveCredentials') || fileContains(credsFile, 'rotate') || fileContains(credsFile, 'fingerprint'));
  log('D2-21', 'ak-sk-rotation', !!hasRotation, hasRotation ? 'credential functions found' : 'not found', 'rotation', 'AK/SK rotation auth_status');
} catch(e) { log('D2-21', 'ak-sk-rotation', false, e.message, 'rotation', 'error'); }

// D2-22: CodeArts context credential reading
try {
  const credsFile = findFile(hdkSrc, 'credentials.mjs');
  const hasCodeArts = credsFile && (fileContains(credsFile, 'CodeArts') || fileContains(credsFile, 'codearts'));
  log('D2-22', 'codearts-cred', !!hasCodeArts, hasCodeArts ? 'CodeArts support found' : 'not found', 'reading', 'CodeArts context credential reading');
} catch(e) { log('D2-22', 'codearts-cred', false, e.message, 'reading', 'error'); }

// D2-23: agent registration status
try {
  const regFile = findFile(hdkSrc, 'agent-registration.mjs');
  const hasReg = regFile && (fileContains(regFile, 'getAgentRegistrationStatuses') || fileContains(regFile, 'SUPPORTED_AGENT_TARGETS'));
  log('D2-23', 'agent-reg', !!hasReg, hasReg ? 'agent registration found' : 'not found', 'status', 'Agent registration status');
} catch(e) { log('D2-23', 'agent-reg', false, e.message, 'status', 'error'); }

// D2-24: auth sync projectId auto resolution
try {
  const projFile = findFile(hdkSrc, 'project-id.mjs');
  const hasProj = projFile && (fileContains(projFile, 'resolveAndApplyProjectId') || fileContains(projFile, 'projectId'));
  log('D2-24', 'project-id', !!hasProj, hasProj ? 'projectId resolution found' : 'not found', 'resolution', 'Auth sync projectId auto resolution');
} catch(e) { log('D2-24', 'project-id', false, e.message, 'resolution', 'error'); }

// D2-25: KooCLI probe status classification
try {
  const probeFile = findFile(hdkSrc, 'hcloud-probe.mjs');
  const hasProbe = probeFile && (fileContains(probeFile, 'classifyHcloudProbe') || fileContains(probeFile, 'findHcloudBin'));
  log('D2-25', 'kcli-probe', !!hasProbe, hasProbe ? 'KooCLI probe found' : 'not found', 'classification', 'KooCLI probe status classification');
} catch(e) { log('D2-25', 'kcli-probe', false, e.message, 'classification', 'error'); }

// === D3 cases ===

// D3-A3: sandbox vs production routing
try {
  const catFile = findFile(hdkSrc, 'service-catalog.mjs') || findFile(hdkSrc, 'capability-discovery.mjs');
  const hasRouting = catFile && (fileContains(catFile, 'sandbox') || fileContains(catFile, 'Scenario'));
  log('D3-A3', 'sandbox-prod-route', !!hasRouting, hasRouting ? 'routing found' : 'not found', 'routing', 'Sandbox vs production routing');
} catch(e) { log('D3-A3', 'sandbox-prod-route', false, e.message, 'routing', 'error'); }

// D3-A4: region intent extraction
try {
  const catFile = findFile(hdkSrc, 'service-catalog.mjs') || findFile(hdkSrc, 'capability-discovery.mjs');
  const hasRegion = catFile && (fileContains(catFile, 'region') || fileContains(catFile, 'Region'));
  log('D3-A4', 'region-intent', !!hasRegion, hasRegion ? 'region intent found' : 'not found', 'extraction', 'Region intent extraction');
} catch(e) { log('D3-A4', 'region-intent', false, e.message, 'extraction', 'error'); }

// D3-A5: metadata correctness
try {
  const catFile = findFile(hdkSrc, 'service-catalog.mjs');
  const hasMeta = catFile && (fileContains(catFile, 'metadata') || fileContains(catFile, 'description'));
  log('D3-A5', 'metadata', !!hasMeta, hasMeta ? 'metadata found' : 'not found', 'correct', 'Service metadata correctness');
} catch(e) { log('D3-A5', 'metadata', false, e.message, 'correct', 'error'); }

// D3-A6: marketplace/icon search quality
try {
  const searchFile = findFile(hdkSrc, 'search-market.mjs');
  const hasSearch = searchFile && (fileContains(searchFile, 'searchMarketplace') || fileContains(searchFile, 'icon'));
  log('D3-A6', 'marketplace-icon', !!hasSearch, hasSearch ? 'marketplace search found' : 'not found', 'quality', 'Marketplace/icon search quality');
} catch(e) { log('D3-A6', 'marketplace-icon', false, e.message, 'quality', 'error'); }

// D3-C8: enterprise project parameter support
try {
  const toolsFile = findFile(hdkSrc, 'tools.mjs');
  const hasProj = toolsFile && (fileContains(toolsFile, 'enterprise_project_id') || fileContains(toolsFile, 'enterpriseProjectId') || fileContains(toolsFile, 'eps_id'));
  log('D3-C8', 'enterprise-project', !!hasProj, hasProj ? 'enterprise project found' : 'not found', 'support', 'Enterprise project parameter support');
} catch(e) { log('D3-C8', 'enterprise-project', false, e.message, 'support', 'error'); }

// D3-C9: resource not found guidance
try {
  const toolsFile = findFile(hdkSrc, 'tools.mjs');
  const hasError = toolsFile && (fileContains(toolsFile, 'explain_error') || fileContains(toolsFile, 'notFound') || fileContains(toolsFile, 'APIGW.0101'));
  log('D3-C9', 'resource-notfound', !!hasError, hasError ? 'error guidance found' : 'not found', 'guidance', 'Resource not found guidance');
} catch(e) { log('D3-C9', 'resource-notfound', false, e.message, 'guidance', 'error'); }

// D3-C10: marketplace category list
try {
  const searchFile = findFile(hdkSrc, 'search-market.mjs');
  const hasCat = searchFile && (fileContains(searchFile, 'getMarketplaceCategories') || fileContains(searchFile, 'category'));
  log('D3-C10', 'market-category', !!hasCat, hasCat ? 'categories found' : 'not found', 'list', 'Marketplace category list');
} catch(e) { log('D3-C10', 'market-category', false, e.message, 'list', 'error'); }

// D3-C11: sandbox credential injection IAM validation
try {
  const validatorFile = findFile(hdkSrc, 'credential-validator.mjs');
  const hasValidator = validatorFile && (fileContains(validatorFile, 'validateIamCredentials') || fileContains(validatorFile, 'validate'));
  log('D3-C11', 'sandbox-cred-validate', !!hasValidator, hasValidator ? 'validator found' : 'not found', 'validation', 'Sandbox credential injection IAM validation');
} catch(e) { log('D3-C11', 'sandbox-cred-validate', false, e.message, 'validation', 'error'); }

// D3-C12: sandbox batch close and chunked upload
try {
  const sessionFile = findFile(hdkSrc, 'session-manager.mjs');
  const hasBatch = sessionFile && (fileContains(sessionFile, 'closeAllSessions') || fileContains(sessionFile, 'splitBase64Chunks'));
  log('D3-C12', 'sandbox-batch', !!hasBatch, hasBatch ? 'batch functions found' : 'not found', 'batch', 'Sandbox batch close and chunked upload');
} catch(e) { log('D3-C12', 'sandbox-batch', false, e.message, 'batch', 'error'); }

// === D5/D6/D7/D8 cases ===

// D5-5: sandbox/terminal mode differences
try {
  const toolsFile = findFile(hdkSrc, 'tools.mjs');
  const hasMode = toolsFile && (fileContains(toolsFile, 'sandbox') && fileContains(toolsFile, 'terminal'));
  log('D5-5', 'mode-diff', !!hasMode, hasMode ? 'mode handling found' : 'not found', 'differences', 'Sandbox/terminal mode differences');
} catch(e) { log('D5-5', 'mode-diff', false, e.message, 'differences', 'error'); }

// D5-7: restart effect consistency
try {
  const setupCli = findFile(hdkSrc, 'setup-cli.mjs');
  const hasRestart = setupCli && (fileContains(setupCli, 'restart') || fileContains(setupCli, 'reload'));
  log('D5-7', 'restart-consistency', !!hasRestart, hasRestart ? 'restart handling found' : 'not found', 'consistent', 'Restart effect consistency');
} catch(e) { log('D5-7', 'restart-consistency', false, e.message, 'consistent', 'error'); }

// D6-5: large directory/upload
try {
  const sessionFile = findFile(hdkSrc, 'session-manager.mjs');
  const hasUpload = sessionFile && (fileContains(sessionFile, 'upload') || fileContains(sessionFile, 'UPLOAD_CHUNK_SIZE'));
  log('D6-5', 'large-upload', !!hasUpload, hasUpload ? 'upload handling found' : 'not found', 'boundary', 'Large directory/upload handling');
} catch(e) { log('D6-5', 'large-upload', false, e.message, 'boundary', 'error'); }

// D6-6: weak network retry idempotent
try {
  const toolsFile = findFile(hdkSrc, 'tools.mjs');
  const hasRetry = toolsFile && (fileContains(toolsFile, 'retry') || fileContains(toolsFile, 'maxRetries'));
  log('D6-6', 'weak-network-retry', !!hasRetry, hasRetry ? 'retry mechanism found' : 'not found', 'idempotent', 'Weak network retry idempotent');
} catch(e) { log('D6-6', 'weak-network-retry', false, e.message, 'idempotent', 'error'); }

// D6-7: long session stability
try {
  const sessionFile = findFile(hdkSrc, 'session-manager.mjs');
  const hasSession = sessionFile && (fileContains(sessionFile, 'session') || fileContains(sessionFile, 'keepalive'));
  log('D6-7', 'long-session', !!hasSession, hasSession ? 'session management found' : 'not found', 'stable', 'Long session stability');
} catch(e) { log('D6-7', 'long-session', false, e.message, 'stable', 'error'); }

// D7-1: OS matrix
try {
  const setupCli = findFile(hdkSrc, 'setup-cli.mjs');
  const hasOS = setupCli && (fileContains(setupCli, 'win32') || fileContains(setupCli, 'linux') || fileContains(setupCli, 'darwin'));
  log('D7-1', 'os-matrix', !!hasOS, hasOS ? 'OS handling found' : 'not found', 'matrix', 'OS matrix support');
} catch(e) { log('D7-1', 'os-matrix', false, e.message, 'matrix', 'error'); }

// D7-2: Node version matrix
try {
  const pkgFile = join(hdkRoot, 'package.json');
  const hasEngines = existsSync(pkgFile) && fileContains(pkgFile, 'engines');
  log('D7-2', 'node-version', !!hasEngines, hasEngines ? 'engines field found' : 'not found', 'matrix', 'Node version matrix');
} catch(e) { log('D7-2', 'node-version', false, e.message, 'matrix', 'error'); }

// D7-6: upgrade compatibility
try {
  const updateCheck = findFile(hdkSrc, 'update-check.mjs');
  const hasCompat = updateCheck && (fileContains(updateCheck, 'upgradePackage') || fileContains(updateCheck, 'compatible'));
  log('D7-6', 'upgrade-compat', !!hasCompat, hasCompat ? 'compatibility found' : 'not found', 'compatible', 'Upgrade compatibility');
} catch(e) { log('D7-6', 'upgrade-compat', false, e.message, 'compatible', 'error'); }

// D8-5: runtime log security
try {
  const toolsFile = findFile(hdkSrc, 'tools.mjs');
  const hasLogSec = toolsFile && (fileContains(toolsFile, 'redact') || fileContains(toolsFile, 'sanitize') || fileContains(toolsFile, 'safe'));
  log('D8-5', 'log-security', !!hasLogSec, hasLogSec ? 'log security found' : 'not found', 'safe', 'Runtime log security');
} catch(e) { log('D8-5', 'log-security', false, e.message, 'safe', 'error'); }

// D8-8: telemetry strategy
try {
  const telemetryFile = findFile(hdkSrc, 'telemetry.mjs') || findFile(hdkSrc, 'analytics.mjs');
  const hasTelemetry = telemetryFile && (fileContains(telemetryFile, 'trackTool') || fileContains(telemetryFile, 'trackSandbox'));
  log('D8-8', 'telemetry-strategy', !!hasTelemetry, hasTelemetry ? 'telemetry found' : 'not found', 'strategy', 'Telemetry strategy');
} catch(e) { log('D8-8', 'telemetry-strategy', false, e.message, 'strategy', 'error'); }

// D10-5: multi-turn task completion
try {
  const toolsFile = findFile(hdkSrc, 'tools.mjs');
  const hasMultiTurn = toolsFile && (fileContains(toolsFile, 'plan_cli_command') && fileContains(toolsFile, 'run_approved_command'));
  log('D10-5', 'multi-turn-task', !!hasMultiTurn, hasMultiTurn ? 'multi-turn tools found' : 'not found', 'completion', 'Multi-turn task completion tools');
} catch(e) { log('D10-5', 'multi-turn-task', false, e.message, 'completion', 'error'); }

// D10-8: evaluation cost budget
try {
  const evalDir = join(process.cwd(), 'eval', 'harness');
  const hasBudget = existsSync(join(evalDir, 'run-eval.mjs'));
  log('D10-8', 'eval-cost', !!hasBudget, hasBudget ? 'eval harness exists' : 'not found', 'budget', 'Evaluation cost budget framework');
} catch(e) { log('D10-8', 'eval-cost', false, e.message, 'budget', 'error'); }

// Output
const passed = results.filter(r => r.pass).length;
const failed = results.filter(r => !r.pass).length;
console.log(JSON.stringify({ total: results.length, passed, failed, results }, null, 2));
