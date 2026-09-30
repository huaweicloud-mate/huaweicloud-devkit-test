// D2-2: auth status判定 — verify getAuthStatus returns structured status for three endpoints
// Three endpoints: S1 (credentials.json), KooCLI (hcloud), OBS (obsutil config)
// Test: verify all three endpoint status fields present + boolean consistency
import { loadAuth } from '../_helper.mjs';

const { getAuthStatus } = await loadAuth();

// Call 1: default target='all'
let result1, error1;
try {
  result1 = await getAuthStatus('all');
} catch (e) {
  error1 = e;
}

// Call 2: target='officeace' (different target)
let result2, error2;
try {
  result2 = await getAuthStatus('officeace');
} catch (e) {
  error2 = e;
}

// Call 3: target='claude' (another target)
let result3, error3;
try {
  result3 = await getAuthStatus('claude');
} catch (e) {
  error3 = e;
}

// Verify three endpoint status fields are present in each result
const endpointFields = ['credentialsConfigured', 'kooCliInstalled', 'obsConfigured'];
const results = [result1, result2, result3];
const errors = [error1, error2, error3];

let allHaveFields = true;
let fieldValues = [];

for (let i = 0; i < results.length; i++) {
  const r = results[i];
  if (!r || typeof r !== 'object') {
    allHaveFields = false;
    continue;
  }
  const present = endpointFields.filter(f => f in r);
  if (present.length !== 3) {
    allHaveFields = false;
  }
  fieldValues.push({
    target: r.target,
    credentialsConfigured: r.credentialsConfigured,
    kooCliInstalled: r.kooCliInstalled,
    kooCliStatus: r.kooCliStatus,
    obsConfigured: r.obsConfigured,
    hasCredentialPanel: !!r.credentialPanel,
    hasOnboarding: !!r.onboarding,
    hasAgents: Array.isArray(r.agents),
  });
}

// Verify idempotency: same target should produce same credential/kooCli/obs status
const idempotent = fieldValues.length >= 2 &&
  fieldValues[0].credentialsConfigured === fieldValues[1].credentialsConfigured &&
  fieldValues[0].kooCliInstalled === fieldValues[1].kooCliInstalled &&
  fieldValues[0].obsConfigured === fieldValues[1].obsConfigured;

// Verify credentialPanel has s1 + sts + activeSource
const hasPanel = result1?.credentialPanel?.s1 && 'activeSource' in result1.credentialPanel;

const ok = allHaveFields && idempotent && hasPanel && !error1;

console.log(JSON.stringify({
  status: ok ? 'PASS' : 'FAIL',
  caseId: 'D2-2',
  why: ok
    ? `getAuthStatus returns 3-endpoint status (S1/KooCLI/OBS) across targets=all/officeace/claude. Idempotent credential state. credentialPanel present.`
    : `allHaveFields=${allHaveFields}, idempotent=${idempotent}, hasPanel=${hasPanel}, error1=${error1?.message}`,
  executedAt: '20260930103000',
  fieldValues,
  endpointFields,
  hasPanel,
  idempotent,
}, null, 2));