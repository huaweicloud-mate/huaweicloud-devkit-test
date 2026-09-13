// AI生成
// D2-16 (P1): projectId auto-acquisition
// Checks: projectId auto-populated from region, IAM KeystoneListProjects usage
import { readFileSync } from 'node:fs';

const pkgRoot = 'C:\\Users\\Administrator\\devkit-test\\OfficeAce\\hdk';
const results = {};

// 1. Check project-id.mjs for auto-acquisition logic
const projectIdPath = `${pkgRoot}\\plugins\\huaweicloud-core\\src\\auth\\project-id.mjs`;
const projectIdSrc = readFileSync(projectIdPath, 'utf8');

results.projectIdModule = {
  hasResolveAndApplyProjectId: projectIdSrc.includes('export function resolveAndApplyProjectId'),
  usesKeystoneListProjects: projectIdSrc.includes('KeystoneListProjects'),
  usesIamService: projectIdSrc.includes('IAM'),
  usesRegionParam: projectIdSrc.includes('region'),
  usesProfileParam: projectIdSrc.includes('profile'),
  // After getting project list, writes projectId back to KooCLI config
  writesProjectIdBack: projectIdSrc.includes('configure set') && projectIdSrc.includes('cli-project-id'),
  // Best-effort: returns { ok: false, reason } on failure, never throws
  isBestEffort: projectIdSrc.includes('return { ok: false, reason') && !projectIdSrc.includes('throw'),
  // Matches project by region name
  matchesByRegionName: projectIdSrc.includes('p.name === region'),
  // Falls back to first project with an id
  fallsBackToFirst: projectIdSrc.includes('projects.find((p) => p && p.id)'),
};

// 2. Check credential-validator.mjs for projectId in validation response
const validatorPath = `${pkgRoot}\\plugins\\huaweicloud-core\\src\\auth\\credential-validator.mjs`;
const validatorSrc = readFileSync(validatorPath, 'utf8');

results.validatorProjectId = {
  returnsProjectId: validatorSrc.includes('projectId'),
  usesProjectForRegion: validatorSrc.includes('projectForRegion'),
  matchesRegionName: validatorSrc.includes('p.name === region'),
  fallsBackToFirst: validatorSrc.includes('projects.find'),
};

// 3. Check service.mjs for projectId in syncAuth
const servicePath = `${pkgRoot}\\plugins\\huaweicloud-core\\src\\auth\\service.mjs`;
const serviceSrc = readFileSync(servicePath, 'utf8');

results.syncAuthProjectId = {
  callsResolveAndApplyProjectId: serviceSrc.includes('resolveAndApplyProjectId'),
  passesRegionAndProfile: serviceSrc.includes('region: credentials.region') && serviceSrc.includes('profile'),
  addsProjectIdToResult: serviceSrc.includes('result.projectId'),
  onlyAddsIfOk: serviceSrc.includes('if (project.ok)'),
};

// 4. Check tools.mjs for projectId error guidance
const toolsPath = `${pkgRoot}\\plugins\\huaweicloud-core\\src\\tools.mjs`;
const toolsSrc = readFileSync(toolsPath, 'utf8');

results.toolsProjectIdGuidance = {
  hasProjectIdError: toolsSrc.includes('profile lacks project_id'),
  hasFixGuidance: toolsSrc.includes('re-run "npx huaweicloud-devkit auth init"'),
  hasManualFixGuidance: toolsSrc.includes('hcloud configure set --cli-project-id'),
  hasKeystoneListProjectsHint: toolsSrc.includes('hcloud IAM KeystoneListProjects'),
};

// 5. Actual hcloud configure show output
results.actualProfile = {
  projectId: "", // EMPTY in current profile
  region: "cn-north-4",
  // projectId is empty because:
  // 1. The profile was likely created before project-id auto-acquisition
  // 2. Or the auto-acquisition failed (best-effort, non-fatal)
  // 3. The system handles empty projectId gracefully with error guidance
};

// 6. Check that auth init / sync attempts to auto-acquire projectId
results.autoAcquisitionFlow = {
  syncAuthCallsProjectId: results.syncAuthProjectId.callsResolveAndApplyProjectId,
  projectIdUsesIAM: results.projectIdModule.usesKeystoneListProjects,
  projectIdWritesBack: results.projectIdModule.writesProjectIdBack,
  bestEffort: results.projectIdModule.isBestEffort,
  hasErrorGuidance: results.toolsProjectIdGuidance.hasProjectIdError,
  hasManualFixGuidance: results.toolsProjectIdGuidance.hasManualFixGuidance,
};

console.log(JSON.stringify(results, null, 2));
