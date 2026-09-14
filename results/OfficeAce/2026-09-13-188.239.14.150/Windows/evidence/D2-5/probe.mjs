// AI生成
// D2-5 (P1): credential missing error
// Checks: error handling when credentials are missing, error message clarity
import { readFileSync } from 'node:fs';

const pkgRoot = 'C:\\Users\\Administrator\\devkit-test\\OfficeAce\\hdk';
const results = {};

// 1. Check resolveCredentials error message in credentials.mjs
const credsPath = `${pkgRoot}\\plugins\\huaweicloud-core\\src\\auth\\credentials.mjs`;
const credsSrc = readFileSync(credsPath, 'utf8');

results.resolveCredentialsError = {
  hasAllowMissing: credsSrc.includes('options.allowMissing'),
  errorMessage: credsSrc.match(/throw new Error\(\s*'([^']+)'/)?.[1] || 'NOT FOUND',
  hasClearError: credsSrc.includes('Huawei Cloud credentials are not configured'),
  hasNextStep: credsSrc.includes('Run "npx huaweicloud-devkit auth init"'),
  hasEnvVarHint: credsSrc.includes('HW_ACCESS_KEY/HW_SECRET_KEY'),
};

// 2. Check credential-validator.mjs for validation errors
const validatorPath = `${pkgRoot}\\plugins\\huaweicloud-core\\src\\auth\\credential-validator.mjs`;
const validatorSrc = readFileSync(validatorPath, 'utf8');

results.credentialValidator = {
  hasAkSkRequired: validatorSrc.includes('AK and SK are both required'),
  hasIamRejected: validatorSrc.includes('IAM rejected the credentials'),
  hasInvalidSkHint: validatorSrc.includes('check the SK for typos'),
  hasExpiredTokenHint: validatorSrc.includes('expired security tokens'),
  has403Warning: validatorSrc.includes('HTTP 403'),
  has403WarningMsg: validatorSrc.includes('project listing was denied'),
};

// 3. Check tools.mjs for auth-related error messages
const toolsPath = `${pkgRoot}\\plugins\\huaweicloud-core\\src\\tools.mjs`;
const toolsSrc = readFileSync(toolsPath, 'utf8');

results.toolsAuthErrors = {
  hasAkSkRequired: toolsSrc.includes('ak and sk are required'),
  hasAuthInitHint: toolsSrc.includes('npx huaweicloud-devkit auth init'),
  hasIamAuthError: toolsSrc.includes('Incorrect IAM authentication information'),
  hasProjectIdHint: toolsSrc.includes('hcloud configure set --cli-project-id'),
  hasStsPersistError: toolsSrc.includes('Temporary STS credentials cannot be persisted'),
  hasConfirmTokenError: toolsSrc.includes('confirmToken not found or expired'),
  hasApprovalTokenError: toolsSrc.includes('Invalid or expired approval token'),
};

// 4. Check syncAuth error handling in service.mjs
const servicePath = `${pkgRoot}\\plugins\\huaweicloud-core\\src\\auth\\service.mjs`;
const serviceSrc = readFileSync(servicePath, 'utf8');

results.syncAuthErrors = {
  hasNoCredentialsError: serviceSrc.includes('Global credentials are not configured'),
  hasRuntimeActiveError: serviceSrc.includes('Runtime credentials are active; auto-sync suppressed'),
  hasKooCliUnresolvedError: serviceSrc.includes('KooCLI current profile unresolved'),
  hasKooCliNotReadyError: serviceSrc.includes('KooCLI not ready'),
  hasNextStep: serviceSrc.includes('nextStep'),
};

// 5. Overall error handling quality
results.errorQuality = {
  clearMessages: results.resolveCredentialsError.hasClearError &&
    results.credentialValidator.hasAkSkRequired &&
    results.toolsAuthErrors.hasAkSkRequired,
  hasNextSteps: results.resolveCredentialsError.hasNextStep &&
    results.syncAuthErrors.hasNextStep,
  hasSpecificHints: results.credentialValidator.hasInvalidSkHint &&
    results.credentialValidator.hasExpiredTokenHint,
  hasEnvVarGuidance: results.resolveCredentialsError.hasEnvVarHint,
};

console.log(JSON.stringify(results, null, 2));
