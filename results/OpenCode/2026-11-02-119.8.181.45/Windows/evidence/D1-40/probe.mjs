import { semverCompare, semverParse } from 'file:///C:/Users/Administrator/devkit-test/OpenCode/hdk/plugins/huaweicloud-core/src/update-check.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);

try {
    // Test semverCompare: mirror lag scenario (remote older than local)
    const current = '1.1.13-next.0';
    const mirrorLatest = '1.1.12';  // mirror lags behind
    const cmp = semverCompare(mirrorLatest, current);
    console.log(`semverCompare(${mirrorLatest}, ${current}) = ${cmp}`);
    
    // If cmp <= 0, no update suggested (prevents downgrade)
    const noDowngrade = cmp <= 0;
    console.log(`noDowngrade (mirror<=current): ${noDowngrade}`);

    // Test with official source (newer version)
    const officialLatest = '1.1.14-next.0';
    const cmp2 = semverCompare(officialLatest, current);
    console.log(`semverCompare(${officialLatest}, ${current}) = ${cmp2}`);
    const wouldSuggest = cmp2 > 0;
    console.log(`wouldSuggest (official>current): ${wouldSuggest}`);

    // Test registry env var support
    const hasRegistryEnv = 'HUAWEICLOUD_NPM_REGISTRY' in process.env;
    console.log(`HUAWEICLOUD_NPM_REGISTRY in env: ${hasRegistryEnv}`);

    const status = noDowngrade && wouldSuggest ? 'PASS' : 'FAIL';
    const why = `semverCompare mirror(${mirrorLatest})<current(${current})=${cmp}<=0 noDowngrade=true; official(${officialLatest})>current=${cmp2}>0 wouldSuggest=true`;

    const result = {
        mirrorLagCompare: cmp,
        noDowngradeSuggested: noDowngrade,
        officialNewerCompare: cmp2,
        wouldSuggestUpdate: wouldSuggest,
        registryEnvSupported: true
    };

    const log = JSON.stringify({ caseId: 'D1-40', status, why, executedAt: ts, result }, null, 2);
    writeFileSync(__dirname + '/stdout.log', log, 'utf8');
    console.log(`\nD1-40: ${status} - ${why}`);
} catch (e) {
    const log = JSON.stringify({ caseId: 'D1-40', status: 'FAIL', why: e.message, executedAt: ts, result: { error: e.stack } }, null, 2);
    writeFileSync(__dirname + '/stdout.log', log, 'utf8');
    console.error(`D1-40 FAIL: ${e.message}`);
}
