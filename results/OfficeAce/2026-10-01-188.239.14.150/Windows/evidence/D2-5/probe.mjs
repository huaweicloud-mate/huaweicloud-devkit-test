// D2-5: 凭证缺失报错指引
// When no credentials are configured, resolveCredentials should throw with HDKIT_CRED_MISSING and onboarding hint
import { pathToFileURL } from 'node:url';
const { resolveCredentials, clearRuntimeCredentials } =
  await import(pathToFileURL('C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs').href);

try {
  // Clear runtime credentials
  clearRuntimeCredentials();

  // Save and clear env vars
  const savedEnv = {};
  for (const key of ['HW_ACCESS_KEY', 'HW_SECRET_KEY', 'HW_SECURITY_TOKEN', 'HW_REGION', 'HUAWEICLOUD_REGION']) {
    savedEnv[key] = process.env[key];
    delete process.env[key];
  }

  // Use a temp HUAWEICLOUD_HOME that has no credentials
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const tempHome = join(tmpdir(), `d2-5-no-cred-${Date.now()}`);
  savedEnv.HUAWEICLOUD_HOME = process.env.HUAWEICLOUD_HOME;
  process.env.HUAWEICLOUD_HOME = tempHome;

  let errorCaught = null;
  try {
    resolveCredentials();
  } catch (error) {
    errorCaught = error;
  }

  // Restore env
  for (const [key, val] of Object.entries(savedEnv)) {
    if (val !== undefined) process.env[key] = val;
    else delete process.env[key];
  }

  const hasCorrectCode = errorCaught?.code === 'HDKIT_CRED_MISSING';
  const hasOnboarding = errorCaught?.onboarding && typeof errorCaught.onboarding === 'object';
  const hasScenario = hasOnboarding && typeof errorCaught.onboarding.scenario === 'number';
  const hasSteps = hasOnboarding && Array.isArray(errorCaught.onboarding.steps) && errorCaught.onboarding.steps.length > 0;
  const hasMessage = hasOnboarding && typeof errorCaught.onboarding.message === 'string';

  const pass = hasCorrectCode && hasOnboarding && hasScenario && hasSteps && hasMessage;
  const output = {
    status: pass ? 'PASS' : 'FAIL',
    caseId: 'D2-5',
    why: pass
      ? `resolveCredentials threw HDKIT_CRED_MISSING with onboarding (scenario=${errorCaught.onboarding.scenario}, ${errorCaught.onboarding.steps.length} steps)`
      : `hasCorrectCode=${hasCorrectCode}, hasOnboarding=${hasOnboarding}, hasScenario=${hasScenario}, hasSteps=${hasSteps}`,
    executedAt: '20261001103000',
    detail: {
      errorCode: errorCaught?.code,
      onboarding: errorCaught?.onboarding,
    },
  };
  console.log(JSON.stringify(output, null, 2));
} catch (error) {
  const output = {
    status: 'FAIL',
    caseId: 'D2-5',
    why: `test threw error: ${error.message}`,
    executedAt: '20261001103000',
    detail: { error: error.message },
  };
  console.log(JSON.stringify(output, null, 2));
}