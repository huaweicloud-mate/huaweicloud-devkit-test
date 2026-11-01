// D9-12 probe: initialize 握手协议安全基线
// Tests: mcp-protocol dispatch, _decorateResult, _isHintConsumed, _resetHintConsumption
//        tools.mjs callTool, runVersionCheck, listSkillDirs, findSkillsRoot
import { _decorateResult, _isHintConsumed, _resetHintConsumption, dispatch } from 'file:///C:/Users/Administrator/devkit-test/OpenCode/hdk/plugins/huaweicloud-core/src/mcp-protocol.mjs';
import { callTool, runVersionCheck, listSkillDirs, findSkillsRoot } from 'file:///C:/Users/Administrator/devkit-test/OpenCode/hdk/plugins/huaweicloud-core/src/tools.mjs';
import { writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
const results = {};

try {
    // 1. Test _decorateResult(sessionId, name, result)
    const testResult = { content: [{ type: 'text', text: 'hello' }] };
    const decorated = _decorateResult('test-session-912', 'tools/call', testResult);
    results.decorateResult = decorated !== undefined;
    console.log(`_decorateResult: works=${results.decorateResult}, type=${typeof decorated}`);

    // 2. Test _resetHintConsumption and _isHintConsumed
    _resetHintConsumption();
    results.hintReset = true;
    const hintBefore = _isHintConsumed('test-session-912');
    results.hintCheck = typeof hintBefore === 'boolean';
    console.log(`_resetHintConsumption: ok, _isHintConsumed: returns=${hintBefore}`);

    // 3. Test listSkillDirs returns valid directories
    const skillsRoot1 = 'C:\\Users\\Administrator\\.config\\opencode\\skills';
    const skillsRoot2 = 'C:\\Users\\Administrator\\.agents\\skills';
    const skillDirs = listSkillDirs(skillsRoot1);
    const skillDirs2 = listSkillDirs(skillsRoot2);
    results.skillDirsValid = (skillDirs.length > 0) || (skillDirs2.length > 0);
    console.log(`listSkillDirs(.config/opencode/skills): count=${skillDirs.length}, listSkillDirs(.agents/skills): count=${skillDirs2.length}`);

    // 4. Test findSkillsRoot returns valid path
    const skillsRoot = findSkillsRoot([skillsRoot1, skillsRoot2]);
    results.skillsRootValid = typeof skillsRoot === 'string' && skillsRoot.length > 0;
    console.log(`findSkillsRoot: path=${skillsRoot}, valid=${results.skillsRootValid}`);

    // 5. Test runVersionCheck is a function (triggers in initialize)
    results.runVersionCheckFn = typeof runVersionCheck === 'function';
    console.log(`runVersionCheck: isFunction=${results.runVersionCheckFn}`);

    // 6. Test callTool is a function (routes tool calls)
    results.callToolFn = typeof callTool === 'function';
    console.log(`callTool: isFunction=${results.callToolFn}`);

    // 7. Test dispatch with initialize request
    results.dispatchFn = typeof dispatch === 'function';
    console.log(`dispatch: isFunction=${results.dispatchFn}`);

    // 8. Test dispatch with initialize (should return protocolVersion + capabilities + serverInfo)
    try {
        const initParams = { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1.0' } };
        const initResp = await dispatch('initialize', initParams, {});
        if (initResp) {
            results.initHasResult = !!initResp.result || !!initResp.protocolVersion;
            results.initHasProtocolVersion = !!initResp?.result?.protocolVersion || !!initResp?.protocolVersion;
            results.initHasCapabilities = !!initResp?.result?.capabilities || !!initResp?.capabilities;
            results.initHasServerInfo = !!initResp?.result?.serverInfo || !!initResp?.serverInfo;
            console.log(`initialize: protocolVersion=${initResp?.result?.protocolVersion || initResp?.protocolVersion}, hasServerInfo=${results.initHasServerInfo}`);
        }
    } catch (e) {
        results.initError = e.message;
        console.log(`initialize dispatch error: ${e.message}`);
    }

    // 9. Test illegal timing (tools/call before initialize) returns error
    try {
        const callResp = await dispatch('tools/call', { name: 'huaweicloud_check_update', arguments: {} }, { sessionId: 'uninit-session-912' });
        if (callResp && callResp.error) {
            results.illegalTimingError = callResp.error.code;
            console.log(`illegal timing: error code=${callResp.error.code}`);
        } else {
            results.illegalTimingHandled = true;
            console.log(`illegal timing: handled (may return result or null)`);
        }
    } catch (e) {
        results.illegalTimingError = e.message;
        console.log(`illegal timing: ${e.message}`);
    }

    const allValid = results.decorateResult && results.hintCheck && results.skillDirsValid && 
                     results.skillsRootValid && results.runVersionCheckFn && results.callToolFn && results.dispatchFn;
    const initValid = results.initHasProtocolVersion && results.initHasCapabilities && results.initHasServerInfo;
    
    const status = (allValid && initValid) ? 'PASS' : 'FAIL';
    const why = `decorateResult=${results.decorateResult}, hintCheck=${results.hintCheck}, skillDirs=${results.skillDirsValid}, skillsRoot=${results.skillsRootValid}, callTool=${results.callToolFn}, initValid=${initValid}`;

    const log = JSON.stringify({ caseId: 'D9-12', status, why, executedAt: ts, result: results }, null, 2);
    writeFileSync(__dirname + '/stdout.log', log, 'utf8');
    console.log(`\nD9-12: ${status} - ${why}`);
} catch (e) {
    const log = JSON.stringify({ caseId: 'D9-12', status: 'FAIL', why: e.message, executedAt: ts, result: { error: e.stack, ...results } }, null, 2);
    writeFileSync(__dirname + '/stdout.log', log, 'utf8');
    console.error(`D9-12 FAIL: ${e.message}`);
}
