import { pathToFileURL } from 'node:url';
import { tmpdir, homedir } from 'node:os';
import { join } from 'node:path';

const ORIG_ENV = {
  HW_ACCESS_KEY: process.env.HW_ACCESS_KEY,
  HW_SECRET_KEY: process.env.HW_SECRET_KEY,
  HW_SECURITY_TOKEN: process.env.HW_SECURITY_TOKEN,
  HW_REGION: process.env.HW_REGION,
  HUAWEICLOUD_REGION: process.env.HUAWEICLOUD_REGION,
  HUAWEICLOUD_HOME: process.env.HUAWEICLOUD_HOME,
  USERPROFILE: process.env.USERPROFILE,
  HOMEDRIVE: process.env.HOMEDRIVE,
  HOMEPATH: process.env.HOMEPATH,
  CODEARTS_PROJECT_DIR: process.env.CODEARTS_PROJECT_DIR,
};

const tmp = join(tmpdir(), `d2-5-no-cred-${Date.now()}`);
for (const k of ['HW_ACCESS_KEY','HW_SECRET_KEY','HW_SECURITY_TOKEN','HW_REGION','HUAWEICLOUD_REGION','CODEARTS_PROJECT_DIR']) delete process.env[k];
process.env.HUAWEICLOUD_HOME = tmp;
process.env.USERPROFILE = tmp;

let errorCaught = null;
try {
  const m = await import(pathToFileURL('C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs').href);
  m.clearRuntimeCredentials();
  m.resolveCredentials();
} catch (error) {
  errorCaught = error;
}

const hasCorrectCode = errorCaught?.code === 'HDKIT_CRED_MISSING';
const hasOnboarding = errorCaught?.onboarding && typeof errorCaught.onboarding === 'object';
const hasScenario = hasOnboarding && typeof errorCaught.onboarding.scenario === 'number';
const hasSteps = hasOnboarding && Array.isArray(errorCaught.onboarding.steps) && errorCaught.onboarding.steps.length > 0;
const pass = hasCorrectCode && hasOnboarding && hasScenario && hasSteps;
const output = {
  status: pass ? 'PASS' : 'FAIL',
  caseId: 'D2-5',
  why: pass
    ? `resolveCredentials threw HDKIT_CRED_MISSING with onboarding (scenario=${errorCaught.onboarding.scenario}, steps=${errorCaught.onboarding.steps.length})`
    : `hasCorrectCode=${hasCorrectCode}, hasOnboarding=${hasOnboarding}, hasScenario=${hasScenario}, hasSteps=${hasSteps}`,
  executedAt: new Date().toISOString().replace(/\D/g, '').slice(0, 14),
  detail: {},
};
console.log(JSON.stringify(output, null, 2));

// restore env
for (const [k, v] of Object.entries(ORIG_ENV)) {
  if (v === undefined) delete process.env[k]; else process.env[k] = v;
}