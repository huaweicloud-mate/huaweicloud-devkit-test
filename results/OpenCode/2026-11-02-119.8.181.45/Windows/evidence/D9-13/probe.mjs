// D9-13 probe: tools/call 凭证不泄露与权限校验
import { setRuntimeCredentials, clearRuntimeCredentials, hasRuntimeCredentials, resolveCredentialsWithRuntime, readGlobalCredentials, isPlaceholder, globalCredentialsPath, obsConfigPath } from 'file:///C:/Users/Administrator/devkit-test/OpenCode/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs';
import { loadPolicy, classifyHcloudArgs, classifyTextCommand, redactSecrets } from 'file:///C:/Users/Administrator/devkit-test/OpenCode/hdk/plugins/huaweicloud-core/src/safety-policy.mjs';
import { evaluateArtifacts, evaluateDeployPlan, mergeRiskDecision } from 'file:///C:/Users/Administrator/devkit-test/OpenCode/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';
import { hashArgs, createApprovalToken, consumeApprovalToken } from 'file:///C:/Users/Administrator/devkit-test/OpenCode/hdk/plugins/huaweicloud-core/src/hcloud-cli.mjs';
import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
const results = {};

try {
    // 1. setRuntimeCredentials + hasRuntimeCredentials
    setRuntimeCredentials('TESTAKD913', 'TESTSKD913');
    results.hasRuntime = hasRuntimeCredentials();
    console.log(`setRuntimeCredentials -> hasRuntimeCredentials=${results.hasRuntime}`);

    // 2. resolveCredentialsWithRuntime - returns {ak, sk, securityToken, region}
    const resolved = resolveCredentialsWithRuntime();
    results.resolvedHasAK = resolved?.ak === 'TESTAKD913';
    console.log(`resolveCredentialsWithRuntime: ak=${resolved?.ak}, resolvedOK=${results.resolvedHasAK}`);

    // 3. clearRuntimeCredentials cleans up
    clearRuntimeCredentials();
    results.clearedRuntime = !hasRuntimeCredentials();
    console.log(`clearRuntimeCredentials -> hasRuntime=${hasRuntimeCredentials()}`);

    // 4. isPlaceholder - test with proper patterns
    results.isPlaceholderTrue = isPlaceholder('<YOUR_AK>');
    results.isPlaceholderFalse = !isPlaceholder('ABCD1234567890');
    console.log(`isPlaceholder: <YOUR_AK>=${results.isPlaceholderTrue}, ABCD1234=${results.isPlaceholderFalse}`);

    // 5. globalCredentialsPath returns valid path
    const credPath = globalCredentialsPath();
    results.credPathValid = typeof credPath === 'string' && credPath.length > 0;
    console.log(`globalCredentialsPath: ${credPath}`);

    // 6. obsConfigPath returns valid path
    const obsPath = obsConfigPath();
    results.obsPathValid = typeof obsPath === 'string' && obsPath.length > 0;
    console.log(`obsConfigPath: ${obsPath}`);

    // 7. loadPolicy loads safety policy
    const policy = loadPolicy();
    results.policyLoaded = policy !== null && policy !== undefined;
    console.log(`loadPolicy: loaded=${results.policyLoaded}`);

    // 8. classifyHcloudArgs - write operation
    const writeClass = classifyHcloudArgs(['ECS', 'DeleteServers', '--server-ids', '123']);
    results.writeClassified = writeClass?.decision === 'deny' || writeClass?.risk === 'write';
    console.log(`classifyHcloudArgs DeleteServers: decision=${writeClass?.decision}, risk=${writeClass?.risk}`);

    // 9. classifyHcloudArgs - read operation
    const readClass = classifyHcloudArgs(['ECS', 'ListServers']);
    results.readClassified = readClass?.decision === 'allow' || readClass?.risk === 'read_only';
    console.log(`classifyHcloudArgs ListServers: decision=${readClass?.decision}, risk=${readClass?.risk}`);

    // 10. classifyTextCommand - credential command
    const textClass = classifyTextCommand('cat ~/.config/huaweicloud/credentials.json');
    results.textClassified = textClass?.decision === 'deny';
    console.log(`classifyTextCommand cat creds: decision=${textClass?.decision}`);

    // 11. evaluateArtifacts - broad IAM policy
    const artResult = evaluateArtifacts([{ path: 'policy.json', content: '{"Statement":[{"Effect":"Allow","Action":["*"],"Resource":["*"]}]}' }]);
    results.artifactsDenied = artResult?.decision === 'deny';
    console.log(`evaluateArtifacts broad IAM: decision=${artResult?.decision}`);

    // 12. evaluateDeployPlan - public exposure
    const planResult = evaluateDeployPlan({ service: 'FunctionGraph', public_access: true });
    results.deployPlanWarned = planResult?.decision === 'warn' || planResult?.decision === 'deny';
    console.log(`evaluateDeployPlan public FG: decision=${planResult?.decision}`);

    // 13. mergeRiskDecision
    const merged = mergeRiskDecision({ decision: 'deny' }, { decision: 'allow' });
    results.mergeDenyWins = merged?.decision === 'deny';
    console.log(`mergeRiskDecision(deny,allow): ${merged?.decision}`);

    // 14. hashArgs
    const hash = hashArgs(['ECS', 'DeleteServers']);
    results.hashValid = typeof hash === 'string' && hash.length > 0;
    console.log(`hashArgs: ${hash?.substring(0, 16)}...`);

    // 15. createApprovalToken + consumeApprovalToken (not replayable)
    const token = createApprovalToken(['ECS', 'DeleteServers']);
    results.tokenCreated = typeof token === 'string' && token.length > 0;
    const consume1 = consumeApprovalToken(token);
    results.tokenConsumed1 = consume1 !== null && consume1 !== undefined;
    const consume2 = consumeApprovalToken(token);
    results.tokenNotReplayable = consume2 === null || consume2 === undefined;
    console.log(`ApprovalToken: created=${results.tokenCreated}, consumed1=${results.tokenConsumed1}, consumed2(replay)=${consume2}`);

    // 16. redactSecrets
    const redacted = redactSecrets('AK=ABCDEFGHIJ SK=1234567890abcdef');
    results.redactedWorks = typeof redacted === 'string' && !redacted.includes('1234567890abcdef');
    console.log(`redactSecrets: output=${redacted?.substring(0, 40)}...`);

    // Determine status
    const allValid = results.hasRuntime && results.clearedRuntime && results.isPlaceholderTrue && results.isPlaceholderFalse &&
                     results.credPathValid && results.obsPathValid && results.policyLoaded &&
                     results.writeClassified && results.readClassified && results.textClassified &&
                     results.artifactsDenied && results.deployPlanWarned && results.mergeDenyWins &&
                     results.hashValid && results.tokenCreated && results.tokenConsumed1 && results.tokenNotReplayable &&
                     results.redactedWorks;

    const status = allValid ? 'PASS' : 'FAIL';
    const why = `runtime=${results.hasRuntime}/${results.clearedRuntime}, classify=${results.writeClassified}/${results.readClassified}/${results.textClassified}, artifacts=${results.artifactsDenied}, deployPlan=${results.deployPlanWarned}, token=${results.tokenCreated}/${results.tokenNotReplayable}, redact=${results.redactedWorks}`;

    const log = JSON.stringify({ caseId: 'D9-13', status, why, executedAt: ts, result: results }, null, 2);
    writeFileSync(__dirname + '/stdout.log', log, 'utf8');
    console.log(`\nD9-13: ${status} - ${why}`);
} catch (e) {
    const log = JSON.stringify({ caseId: 'D9-13', status: 'FAIL', why: e.message, executedAt: ts, result: { error: e.stack, ...results } }, null, 2);
    writeFileSync(__dirname + '/stdout.log', log, 'utf8');
    console.error(`D9-13 FAIL: ${e.message}`);
}
