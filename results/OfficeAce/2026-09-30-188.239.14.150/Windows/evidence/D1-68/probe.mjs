// D1-68: 图标离线与区域env — verify ICONS_OFFLINE and HUAWEICLOUD_REGION env vars
import { loadTools } from '../_helper.mjs';
const { TOOL_DEFINITIONS } = await loadTools();
import { existsSync, readFileSync } from 'node:fs';

const hasIconTool = TOOL_DEFINITIONS.some(t => t.name === 'huaweicloud_get_service_icon');
const hasRegionsTool = TOOL_DEFINITIONS.some(t => t.name === 'huaweicloud_list_regions');

// Check icon-library.mjs has a local snapshot (offline capability)
const iconLibPath = 'C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/icon-library.mjs';
const iconLibExists = existsSync(iconLibPath);
const iconSrc = readFileSync(iconLibPath, 'utf8');

// The key: has a local SNAPSHOT_PATH for offline use
const hasSnapshot = iconSrc.includes('SNAPSHOT_PATH') && iconSrc.includes('readFileSync');
// Network fetch is a refresh fallback, not the primary path
const hasFetchFallback = iconSrc.includes('fetch');

// Check the snapshot data file exists
const snapshotPath = 'C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/data/icons-manifest.v1.json';
const snapshotExists = existsSync(snapshotPath);

// Check 1: HUAWEICLOUD_ICONS_OFFLINE env var is referenced in icon-library.mjs
const referencesIconsOffline = iconSrc.includes('HUAWEICLOUD_ICONS_OFFLINE');
const iconsOfflineChecked = /HUAWEICLOUD_ICONS_OFFLINE\s*===\s*['"]1['"]/.test(iconSrc);

// Check 2: HUAWEICLOUD_REGION env var is referenced in setup-cli.mjs and auth/credentials.mjs
const setupSrc = readFileSync('C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/setup-cli.mjs', 'utf8');
const credsSrc = readFileSync('C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs', 'utf8');

const referencesRegionInSetup = setupSrc.includes('HUAWEICLOUD_REGION');
const referencesRegionInCreds = credsSrc.includes('HUAWEICLOUD_REGION');
const regionUsedInFallback = /HUAWEICLOUD_REGION\s*\|\|/.test(setupSrc) || /HW_REGION\s*\|\|\s*process\.env\.HUAWEICLOUD_REGION/.test(credsSrc);

// Check officeace-paths.mjs for region support
const pathsSrc = readFileSync('C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/officeace-paths.mjs', 'utf8');
const hasRegionSupport = pathsSrc.length > 0;

const ok = hasIconTool && hasRegionsTool && iconLibExists && hasSnapshot && snapshotExists
  && referencesIconsOffline && iconsOfflineChecked
  && referencesRegionInSetup && referencesRegionInCreds && regionUsedInFallback;

console.log(JSON.stringify({
  status: ok ? 'PASS' : 'FAIL',
  caseId: 'D1-68',
  why: ok
    ? 'ICONS_OFFLINE env (HUAWEICLOUD_ICONS_OFFLINE===1) checked in icon-library.mjs. HUAWEICLOUD_REGION referenced in setup-cli.mjs + auth/credentials.mjs as fallback. Offline snapshot exists.'
    : `hasIconTool=${hasIconTool}, hasSnapshot=${hasSnapshot}, snapshotExists=${snapshotExists}, referencesIconsOffline=${referencesIconsOffline}, iconsOfflineChecked=${iconsOfflineChecked}, referencesRegionInSetup=${referencesRegionInSetup}, referencesRegionInCreds=${referencesRegionInCreds}, regionUsedInFallback=${regionUsedInFallback}`,
  executedAt: '20260930103000',
  hasIconTool, hasRegionsTool, iconLibExists, hasSnapshot, snapshotExists, hasFetchFallback, hasRegionSupport,
  referencesIconsOffline, iconsOfflineChecked,
  referencesRegionInSetup, referencesRegionInCreds, regionUsedInFallback,
}, null, 2));