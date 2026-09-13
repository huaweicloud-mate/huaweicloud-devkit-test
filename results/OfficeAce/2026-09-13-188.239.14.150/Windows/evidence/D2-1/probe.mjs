// AI生成
// D2-1 (P1): auth_init basic functionality
// Checks: auth_status returns valid state, credentials detected, mode AKSK, region cn-north-4
// Data collected from huaweicloud_auth_status MCP tool call

const authStatusResult = {
  "target": "all",
  "credentialsConfigured": true,
  "credentialsPath": "C:\\Users\\Administrator\\.config\\huaweicloud\\credentials.json",
  "obsConfigured": true,
  "obsConfigPath": "C:\\Users\\Administrator\\.obsutilconfig",
  "kooCliInstalled": true,
  "reconciled": {
    "stores": {
      "s1Fingerprint": "dead0dcf",
      "envFingerprint": "",
      "currentFingerprint": "c6f034c4",
      "s3Fingerprint": "0a98487f",
      "runtimeFingerprint": null
    },
    "kooCliCurrent": "default",
    "inconsistencies": [
      { "store": "S2-current", "source": "KooCLI current profile", "fingerprint": "c6f034c4", "manualModified": true },
      { "store": "S3", "source": "obsutilconfig", "fingerprint": "0a98487f", "manualModified": true }
    ],
    "hasRuntime": false,
    "runtimeFingerprint": null,
    "inconsistent": true,
    "runtimeActive": false
  },
  "agents": {
    "opencode": { "configured": true },
    "codex": { "configured": false },
    "codex-desktop": { "configured": false },
    "codearts": { "configured": true },
    "codearts-work": { "configured": true },
    "workbuddy": { "configured": true },
    "dsh": { "configured": true },
    "officeace": { "configured": true },
    "hermes": { "configured": true },
    "openclaw": { "configured": true },
    "atomcode": { "configured": true }
  }
};

const checkCliResult = {
  "installed": true,
  "authenticated": true,
  "output": "当前KooCLI版本:7.2.12\n",
};

const profileResult = {
  "name": "default",
  "mode": "AKSK",
  "accessKeyId": "HPU****YXD",
  "secretAccessKey": "****",
  "securityToken": "",
  "region": "cn-north-4",
  "projectId": "",
  "domainId": "",
  "skipSecureVerify": "false",
  "readTimeout": 10,
  "connectTimeout": 5,
  "retryCount": 0
};

const results = {};

// 1. Credentials configured
results.credentialsConfigured = authStatusResult.credentialsConfigured;

// 2. KooCLI installed
results.kooCliInstalled = authStatusResult.kooCliInstalled;

// 3. KooCLI authenticated
results.kooCliAuthenticated = checkCliResult.authenticated;

// 4. Mode is AKSK
results.mode = profileResult.mode;
results.modeIsAKSK = profileResult.mode === 'AKSK';

// 5. Region is cn-north-4
results.region = profileResult.region;
results.regionCorrect = profileResult.region === 'cn-north-4';

// 6. OBS configured
results.obsConfigured = authStatusResult.obsConfigured;

// 7. Agent registrations
results.agents = authStatusResult.agents;
results.agentsConfiguredCount = Object.values(authStatusResult.agents).filter(a => a.configured).length;
results.agentsTotalCount = Object.keys(authStatusResult.agents).length;

// 8. Runtime credentials not active (using file-based)
results.runtimeActive = authStatusResult.reconciled.runtimeActive;

// 9. Overall
results.allChecksPass = results.credentialsConfigured && results.kooCliInstalled &&
  results.kooCliAuthenticated && results.modeIsAKSK && results.regionCorrect;

console.log(JSON.stringify(results, null, 2));
