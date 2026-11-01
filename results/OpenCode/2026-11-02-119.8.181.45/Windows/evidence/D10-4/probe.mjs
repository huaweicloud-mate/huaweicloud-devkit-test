// D10-4 probe: 安全干预-静态规则层
// Tests: loadRiskRules, evaluateCommandRisk
import { loadRiskRules, evaluateCommandRisk } from 'file:///C:/Users/Administrator/devkit-test/OpenCode/hdk/plugins/huaweicloud-core/src/risk-rule-engine.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);

try {
    // 1. Load risk rules and check count + severity distribution
    const rulesObj = loadRiskRules();
    const rules = rulesObj.rules || rulesObj;
    const denyCount = rules.filter(r => r.severity === 'deny').length;
    const warnCount = rules.filter(r => r.severity === 'warn').length;
    console.log(`Rules loaded: total=${rules.length}, deny=${denyCount}, warn=${warnCount}`);

    // 2. Test high-risk commands (should be deny)
    const credCmd = evaluateCommandRisk('cat ~/.config/huaweicloud/credentials.json');
    const envCmd = evaluateCommandRisk('printenv HW_ACCESS_KEY');
    const secretCmd = evaluateCommandRisk('hcloud CSMS ShowSecretVersion --secret-id test');
    console.log(`cat credentials: decision=${credCmd.decision}`);
    console.log(`printenv env: decision=${envCmd.decision}`);
    console.log(`CSMS secret: decision=${secretCmd.decision}`);

    // 3. Test read-only commands (should be allow)
    const listCmd = evaluateCommandRisk('hcloud ECS ListServers');
    const showCmd = evaluateCommandRisk('hcloud IAM ListUsers');
    console.log(`ListServers: decision=${listCmd.decision}`);
    console.log(`ListUsers: decision=${showCmd.decision}`);

    // 4. Test destructive command (should be warn)
    const delCmd = evaluateCommandRisk('hcloud ECS DeleteServers --server-ids 123');
    console.log(`DeleteServers: decision=${delCmd.decision}`);

    // Determine PASS/FAIL
    const denyWorks = credCmd.decision === 'deny' && envCmd.decision === 'deny' && secretCmd.decision === 'deny';
    const allowWorks = listCmd.decision === 'allow' && showCmd.decision === 'allow';
    const warnWorks = delCmd.decision === 'warn';
    const rulesLoaded = rules.length > 0 && denyCount > 0 && warnCount > 0;

    const status = (denyWorks && allowWorks && warnWorks && rulesLoaded) ? 'PASS' : 'FAIL';
    const why = `rulesLoaded=${rules.length}(deny=${denyCount},warn=${warnCount}), denyWorks=${denyWorks}, allowWorks=${allowWorks}, warnWorks=${warnWorks}`;

    const result = {
        totalRules: rules.length,
        denyCount,
        warnCount,
        decisions: {
            catCreds: credCmd.decision,
            printenv: envCmd.decision,
            csmsSecret: secretCmd.decision,
            listServers: listCmd.decision,
            listUsers: showCmd.decision,
            deleteServers: delCmd.decision
        }
    };

    const log = JSON.stringify({ caseId: 'D10-4', status, why, executedAt: ts, result }, null, 2);
    writeFileSync(join(__dirname, 'stdout.log'), log, 'utf8');
    console.log(`\nD10-4: ${status} - ${why}`);
} catch (e) {
    const log = JSON.stringify({ caseId: 'D10-4', status: 'FAIL', why: e.message, executedAt: ts, result: { error: e.stack } }, null, 2);
    writeFileSync(join(__dirname, 'stdout.log'), log, 'utf8');
    console.error(`D10-4 FAIL: ${e.message}`);
}
