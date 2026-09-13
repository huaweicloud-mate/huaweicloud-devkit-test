// AI生成
// D2-10 (P1): multi-profile switching
// Checks: KooCLI profile support, auth_switch for profile management
import { readFileSync } from 'node:fs';

const pkgRoot = 'C:\\Users\\Administrator\\devkit-test\\OfficeAce\\hdk';
const results = {};

// 1. hcloud configure list output (from bash command)
results.hcloudConfigureList = {
  current: "default",
  profiles: [{ name: "default", mode: "AKSK", region: "cn-north-4" }],
  profileCount: 1,
  authEncrypt: "true",
};

// 2. Check reconcile.mjs for profile management
const reconcilePath = `${pkgRoot}\\plugins\\huaweicloud-core\\src\\auth\\reconcile.mjs`;
const reconcileSrc = readFileSync(reconcilePath, 'utf8');

results.profileManagement = {
  hasReadKooCliProfiles: reconcileSrc.includes('readKooCliProfiles'),
  hasResolveManagedProfile: reconcileSrc.includes('resolveManagedProfile'),
  hasCurrentProfile: reconcileSrc.includes('current'),
  hasProfilesArray: reconcileSrc.includes('profiles'),
  hasFingerprint: reconcileSrc.includes('fingerprint'),
  hasAuthEncrypt: reconcileSrc.includes('authEncrypt'),
  hasKooCliConfigPath: reconcileSrc.includes('kooCliConfigPath'),
};

// 3. Check tools.mjs for auth_switch (profile switching)
const toolsPath = `${pkgRoot}\\plugins\\huaweicloud-core\\src\\tools.mjs`;
const toolsSrc = readFileSync(toolsPath, 'utf8');

results.authSwitch = {
  hasAuthSwitch: toolsSrc.includes("name: 'huaweicloud_auth_switch'"),
  hasTemporaryAction: toolsSrc.includes("'temporary'"),
  hasPersistAction: toolsSrc.includes("'persist'"),
  hasClearAction: toolsSrc.includes("'clear'"),
  hasImportMode: toolsSrc.includes("'import'"),
  hasMemoryMode: toolsSrc.includes("'memory'"),
  hasMcpConfigMode: toolsSrc.includes("'mcp-config'"),
  hasConfirmFlow: toolsSrc.includes('huaweicloud_auth_confirm'),
  hasPendingConfirms: toolsSrc.includes('pendingConfirms'),
  hasConflictDetection: toolsSrc.includes('conflict'),
  hasBackupGlobal: toolsSrc.includes('backupGlobalCredentials'),
};

// 4. Check show_profile_redacted for profile parameter
results.showProfile = {
  hasProfileParam: toolsSrc.includes('args.profile') || toolsSrc.includes('args?.profile'),
};

// 5. Check setup-cli.mjs for configure list
const setupCliPath = `${pkgRoot}\\plugins\\huaweicloud-core\\src\\setup-cli.mjs`;
const setupSrc = readFileSync(setupCliPath, 'utf8');

results.doctorProfileCheck = {
  hasConfigureList: setupSrc.includes('configure list'),
  hasProfileAuthCheck: setupSrc.includes('hasAuth'),
};

// 6. KooCLI profile support
results.kooCliProfileSupport = {
  multipleProfilesSupported: true, // KooCLI inherently supports multiple profiles
  currentProfileSwitching: results.profileManagement.hasResolveManagedProfile,
  profileInspection: results.showProfile.hasProfileParam,
  authSwitchBetweenProfiles: results.authSwitch.hasAuthSwitch,
  conflictDetectionOnSwitch: results.authSwitch.hasConflictDetection,
  confirmationFlow: results.authSwitch.hasConfirmFlow,
};

// 7. Only 1 profile currently configured
results.currentlySingleProfile = results.hcloudConfigureList.profileCount === 1;

console.log(JSON.stringify(results, null, 2));
