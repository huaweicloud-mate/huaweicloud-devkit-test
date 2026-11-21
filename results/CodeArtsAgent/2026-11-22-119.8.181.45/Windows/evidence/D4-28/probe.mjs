// Real probe for D4-28: Node ??? hook ??
// Generated from the executed case implementation; rerunnable standalone.
import { mcpTool, mcpSession, finishCall, runCli, runNode, runHcloud, safeJson, ts, PKG, MCP, CLI, DIST, HOME, VC_QUOTE } from '../../_runner/lib.mjs';
const run = async () => {
    const bad = runNode(PATHS.hookScript, [], 30000, null, JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'type C://Users//Administrator//.hcloud//config.json' } }));
    const good = runNode(PATHS.hookScript, [], 30000, null, JSON.stringify({ tool_name: 'Bash', tool_input: { command: 'hcloud ECS ListServersDetails' } }));
    const arrInput = runNode(PATHS.hookScript, [], 30000, null, JSON.stringify({ tool_name: 'Bash', tool_input: { args: ['hcloud', 'ECS', 'DeleteServers'] } }));
    const badOut = safeJson(bad.stdout);
    const arrOut = safeJson(arrInput.stdout);
    const deny = badOut && badOut.hookSpecificOutput && badOut.hookSpecificOutput.permissionDecision === 'deny';
    const noDenyForGood = !/permissionDecision/.test(good.stdout);
    const argsExtracted = arrOut && arrOut.hookSpecificOutput && arrOut.hookSpecificOutput.permissionDecision === 'deny';
    const hooks = readFileSync(PATHS.hooksJson, 'utf8');
    const registered = /huaweicloud-safety\.mjs/.test(hooks);
    const ok = deny && noDenyForGood && argsExtracted && registered;
    return { status: ok ? 'PASS' : 'FAIL', why: 'deny=' + deny + ' goodNoDeny=' + noDenyForGood + ' argsExtracted=' + argsExtracted + ' hooksRegistered=' + registered, result: { badStdout: bad.stdout.slice(0, 600), goodStdout: good.stdout.slice(0, 200), argsStdout: arrInput.stdout.slice(0, 400), hooks: hooks.slice(0, 500) } };
  };
const r = await run();
console.log(JSON.stringify(r, null, 2));
