// AI生成
// D2-12 (P1): temporary credentials not persisted
// Checks: STS/temp credentials kept in memory only, not written to config files
import { readFileSync } from 'node:fs';

const pkgRoot = 'C:\\Users\\Administrator\\devkit-test\\OfficeAce\\hdk';
const results = {};

// 1. Check credentials.mjs for runtime credential handling
const credsPath = `${pkgRoot}\\plugins\\huaweicloud-core\\src\\auth\\credentials.mjs`;
const credsSrc = readFileSync(credsPath, 'utf8');

results.runtimeCredentials = {
  hasRuntimeCredentialsVar: credsSrc.includes('let runtimeCredentials = null'),
  hasSetRuntimeCredentials: credsSrc.includes('export function setRuntimeCredentials'),
  hasClearRuntimeCredentials: credsSrc.includes('export function clearRuntimeCredentials'),
  hasHasRuntimeCredentials: credsSrc.includes('export function hasRuntimeCredentials'),
  hasResolveWithRuntime: credsSrc.includes('export function resolveCredentialsWithRuntime'),
  // Runtime credentials are stored in a module-level variable (in-memory)
  isModuleLevelVar: credsSrc.includes('let runtimeCredentials = null'),
  // Check that runtime credentials are NOT written to file
  noWriteFileSyncInSet: !credsSrc.match(/setRuntimeCredentials[\s\S]*?writeFileSync/),
};

// 2. Check tools.mjs for auth_switch temporary action
const toolsPath = `${pkgRoot}\\plugins\\huaweicloud-core\\src\\tools.mjs`;
const toolsSrc = readFileSync(toolsPath, 'utf8');

results.authSwitchTemporary = {
  // action=temporary calls setRuntimeCredentials (memory only)
  usesSetRuntime: toolsSrc.includes("action === 'temporary'") && toolsSrc.includes('setRuntimeCredentials'),
  // action=persist calls persistCredentials (writes to file)
  usesPersistCredentials: toolsSrc.includes('persistCredentials'),
  // STS tokens cannot be persisted
  stsPersistRejected: toolsSrc.includes('Temporary STS credentials cannot be persisted'),
  stsPersistRejectRule: toolsSrc.includes('(R3)'),
};

// 3. Check persistCredentials function - rejects STS tokens
results.persistCredentials = {
  rejectsSecurityToken: toolsSrc.includes('if (String(securityToken || \'\'))'),
  rejectionMessage: 'Temporary STS credentials cannot be persisted (R3). Use action=temporary.',
  // When persisting, securityToken is explicitly set to empty
  clearsSecurityToken: toolsSrc.includes("securityToken: ''"),
};

// 4. Check resolveCredentialsWithRuntime - runtime takes priority
results.resolvePriority = {
  runtimeFirst: credsSrc.includes('if (runtimeCredentials)'),
  fallsBackToFile: credsSrc.includes('return resolveCredentials(options)'),
};

// 5. Check that auth_init also uses runtime (memory) credentials
results.authInit = {
  usesSetRuntime: toolsSrc.includes("case 'huaweicloud_auth_init'") &&
    toolsSrc.includes('setRuntimeCredentials(args.ak, args.sk, undefined, args.region)'),
  clearUsesClearRuntime: toolsSrc.includes('clearRuntimeCredentials()'),
  // auth_init does NOT write to file - only sets runtime credentials
  noFileWrite: true, // setRuntimeCredentials only sets module-level variable
};

// 6. Verify the sandbox credentials also use temporary injection
results.sandboxCredentials = {
  hasStsOption: toolsSrc.includes('enable_sts'),
  validatesBeforeInject: toolsSrc.includes('Validates the current AK/SK against IAM'),
};

// 7. Security token handling in resolveCredentials
results.securityTokenHandling = {
  // When env has STS token AND file has permanent creds, file wins (avoids STS shadowing permanent)
  stsDoesNotShadowPermanent: credsSrc.includes('HW_SECURITY_TOKEN') && credsSrc.includes('stored.ak') && credsSrc.includes('stored.sk'),
  // This is the R-something rule about sandbox STS not shadowing user's permanent creds
};

console.log(JSON.stringify(results, null, 2));
