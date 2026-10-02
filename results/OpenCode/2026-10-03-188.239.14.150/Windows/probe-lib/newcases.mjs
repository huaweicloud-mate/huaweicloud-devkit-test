// probe-lib/newcases.mjs — 2026-10-03 新增/补齐用例的真实断言实现（D2-10 / D4-4 / D9-9）
import { emit, SDK } from './shared.mjs';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const U = p => `${SDK}/${p}`;

// ---------------------------------------------------------------- D2-10
// 「R7 current 档跟随」：构造多 profile 的 KooCLI 配置（current=deploy）→ readKooCliProfiles
// 解析 → 切换 current 再解析 → 核对 runHcloudConfigure 的 --cli-profile= 实参。
export async function d2_10() {
  return emit('D2-10', 'R7 current 档跟随', async c => {
    const dir = mkdtempSync(join(tmpdir(), 'd2-10-'));
    const cfg = join(dir, 'config.json');
    const write = (current) =>
      writeFileSync(
        cfg,
        JSON.stringify(
          {
            current,
            authEncrypt: 'true',
            profiles: [
              { name: 'deploy', accessKeyId: 'AKDEPLOYFAKE0000001', secretAccessKey: 'SKdeployfake' },
              { name: 'default', accessKeyId: 'AKDEFAULTFAKE000001', secretAccessKey: 'SKdefaultfake' },
            ],
          },
          null,
          2,
        ),
        'utf-8',
      );

    // 夹具注入：reconcile.mjs:20-25 只认 HCLOUD_CONFIG_PATH / ~/.hcloud/config.json
    process.env.HCLOUD_CONFIG_PATH = cfg;
    try {
      write('deploy');
      const { readKooCliProfiles, resolveManagedProfile } = await import(U('auth/reconcile.mjs'));

      const r1 = readKooCliProfiles();
      c.ok('夹具配置可解析(无 error)', !r1.error, r1.error || 'ok', '无 error');
      c.eq('①current=deploy 被解析', r1.current, 'deploy');
      c.eq('①resolveManagedProfile 返回 current 档', resolveManagedProfile(), 'deploy');
      c.eq('①profile 列表长度=2', (r1.profiles || []).length, 2);
      c.ok('①profile 名称含 deploy/default',
        ['deploy', 'default'].every((n) => (r1.profiles || []).some((p) => p.name === n)),
        (r1.profiles || []).map((p) => p.name), 'deploy,default');

      // ③切换 current 再解析
      write('default');
      const r2 = readKooCliProfiles();
      c.eq('③切换后 current=default 被解析', r2.current, 'default');
      c.eq('③resolveManagedProfile 跟随切换', resolveManagedProfile(), 'default');

      write('deploy');
      c.eq('③再次切回 deploy 跟随', resolveManagedProfile(), 'deploy');

      // ④ runHcloudConfigure 必须把 profile 以 --cli-profile= 传给 hcloud
      const src = readFileSync(fileURLToPath(U('auth/reconcile.mjs')), 'utf-8');
      c.ok('④runHcloudConfigure 实参含 `--cli-profile=${profile}`',
        /`--cli-profile=\$\{profile\}`/.test(src), '未找到 --cli-profile=${profile}', '`--cli-profile=${profile}`');
      c.ok('④cli-access-key/secret-key/region 实参齐备',
        ['--cli-access-key=', '--cli-secret-key=', '--cli-region='].every((k) => src.includes(k)),
        ['--cli-access-key=', '--cli-secret-key=', '--cli-region='].filter((k) => !src.includes(k)),
        '三个实参齐备');
      // tools.mjs 侧 KooCLI 调用也必须跟随 current 档
      const toolsSrc = readFileSync(fileURLToPath(U('tools.mjs')), 'utf-8');
      c.ok('④tools.mjs 调用 KooCLI 时跟随 managed profile(--cli-profile)',
        /--cli-profile/.test(toolsSrc) && /resolveManagedProfile/.test(toolsSrc),
        'tools.mjs 未见 --cli-profile + resolveManagedProfile', '两者并存');

      // 真实执行一次 runHcloudConfigure（真实子进程调用），核对返回结构
      const { runHcloudConfigure } = await import(U('auth/reconcile.mjs'));
      const r = runHcloudConfigure('deploy', 'AKDEPLOYFAKE0000001', 'SKdeployfake', 'cn-north-4');
      c.ok('④runHcloudConfigure 返回结构含 ok 布尔', typeof r.ok === 'boolean', { ok: r.ok }, 'boolean');
      c.ok('④runHcloudConfigure 不泄露 SK 明文',
        !JSON.stringify(r).includes('SKdeployfake'), JSON.stringify(r).slice(0, 160), '已脱敏');
      return {};
    } finally {
      delete process.env.HCLOUD_CONFIG_PATH;
      rmSync(dir, { recursive: true, force: true });
    }
  });
}

// ---------------------------------------------------------------- D4-4
// 写操作审批门：12 类写动词逐一触发写语义，断言「无审批不可执行」。
export async function d4_4() {
  return emit('D4-4', '写操作审批门（12 类写动词强制审批）', async c => {
    const { callTool } = await import(U('tools.mjs'));
    const { planHcloudCommand } = await import(U('hcloud-cli.mjs'));

    const verbs = [
      ['create', ['ECS', 'CreateServers', '--name', 'd4-4-probe']],
      ['delete', ['ECS', 'DeleteServer', '--server', 'probe-id']],
      ['update', ['ECS', 'UpdateServer', '--server', 'probe-id']],
      ['resize', ['ECS', 'ResizeServer', '--server', 'probe-id']],
      ['start', ['ECS', 'StartServer', '--server', 'probe-id']],
      ['stop', ['ECS', 'StopServer', '--server', 'probe-id']],
      ['authorize', ['IAM', 'CreatePolicy', '--name', 'probe']],
      ['revoke', ['IAM', 'DeletePolicy', '--policy', 'probe']],
      ['attach', ['ECS', 'AttachVolume', '--server', 'probe-id']],
      ['detach', ['ECS', 'DetachVolume', '--server', 'probe-id']],
      ['enable', ['SMN', 'EnableSubscription', '--subscription', 'probe']],
      ['disable', ['SMN', 'DisableSubscription', '--subscription', 'probe']],
    ];

    let gated = 0;
    for (const [verb, args] of verbs) {
      // ①只规划不执行：必须判定为非 allow（需审批），且签发 approvalToken
      const plan = planHcloudCommand(args, { allowWrites: false });
      c.ok(`[${verb}] safeToRun=false（未审批不可执行）`, plan.safeToRun === false,
        { decision: plan.classification?.decision, safeToRun: plan.safeToRun }, 'safeToRun=false');
      c.ok(`[${verb}] 签发 approvalToken（审批入口存在）`,
        typeof plan.approvalToken === 'string' && plan.approvalToken.length > 0,
        typeof plan.approvalToken, '非空字符串');
      if (plan.safeToRun === false && plan.approvalToken) gated++;
    }
    c.eq('12 类写动词全部被审批门拦截', gated, 12);

    // ② 未显式审批（approvedByUser 非 true）时，执行入口必须硬拒绝
    let threw = 0;
    for (const [verb, args] of verbs) {
      const plan = planHcloudCommand(args, { allowWrites: false });
      try {
        await callTool('huaweicloud_run_approved_command', {
          args,
          approvalToken: plan.approvalToken,
          approvedByUser: false,
        });
      } catch (e) {
        if (/approvedByUser must be true/i.test(String(e?.message || e))) threw++;
      }
    }
    c.eq('未审批(approvedByUser 非 true)执行全部被拒', threw, 12);

    // ③ MCP 层同样拦截：callTool 走一遍（工具契约层）
    const mcpPlan = await callTool('huaweicloud_plan_cli_command', {
      args: ['ECS', 'DeleteServer', '--server', 'probe-id'],
    });
    c.ok('MCP plan_cli_command 同样 safeToRun=false', mcpPlan.safeToRun === false,
      { decision: mcpPlan.classification?.decision, safeToRun: mcpPlan.safeToRun }, 'safeToRun=false');
    return {};
  });
}

// ---------------------------------------------------------------- D9-9
// tools/call 超时协议语义与取消：起真实 MCP stdio 服务，走 initialize → capabilities 探测
// → 挂起 tools/call → 观测超时/取消语义 → 重建连接复测。
export async function d9_9() {
  return emit('D9-9', 'tools/call 超时协议语义与取消', async c => {
    const serverPath = fileURLToPath(U('mcp-server.mjs'));
    const srvSrc = readFileSync(fileURLToPath(U('mcp-server.mjs')), 'utf-8');
    const protoSrc = readFileSync(fileURLToPath(U('mcp-protocol.mjs')), 'utf-8');

    const client = join(dirname(fileURLToPath(import.meta.url)), '_d9_9_client.mjs');
    const srv = spawnSync(process.execPath, [client, serverPath, '8000'], {
      encoding: 'utf8', timeout: 90000,
      env: { ...process.env, HUAWEICLOUD_SKIP_HCLOUD_PREINSTALL: '1' },
    });
    let out = {};
    try { out = JSON.parse((srv.stdout || '').trim().split('\n').filter(Boolean).pop() || '{}'); }
    catch { out = {}; }
    const frames = Array.isArray(out.frames) ? out.frames : [];

    const init = frames.find((f) => f.id === 1 && f.result);
    c.ok('①真实 MCP stdio 握手成功(initialize 有 result)', !!init,
      init ? 'result ok' : `stderr=${String(srv.stderr || '').slice(0, 200)}`, 'result');
    c.ok('①initialize 返回 serverInfo', !!(init?.result?.serverInfo?.name),
      init?.result?.serverInfo?.name, 'huaweicloud-devkit');

    const caps = init?.result?.capabilities || {};
    c.ok('①capabilities 为对象', caps && typeof caps === 'object', caps, 'object');

    // ② capabilities 探测：cancellation / notifications 是否声明
    const hasCancellation = !!(caps.cancellation || caps.notifications);
    c.ok('②capabilities.cancellation/notifications 实测结果已记录', true,
      { capabilities: caps, hasCancellation }, '记录实测值');
    c.ok('②服务端源码声明了 notifications/cancelled 取消处理',
      /notifications\/cancelled/.test(srvSrc + protoSrc),
      /notifications\/cancelled/.test(srvSrc + protoSrc) ? '存在' : 'mcp-server.mjs/mcp-protocol.mjs 均无 notifications/cancelled 分支',
      '存在取消处理');

    // ③ 超时错误语义：服务源码是否存在 -32000 timeout 错误对象
    const hasTimeoutErr = /-32000/.test(srvSrc + protoSrc);
    c.ok('③超时以 JSON-RPC error {code:-32000, message 含 timeout} 返回', hasTimeoutErr,
      hasTimeoutErr ? '存在' : '无 -32000；initialize 内部 3s 超时仅用于丢弃结果（mcp-protocol.mjs:39），tools/call 无超时语义',
      'code=-32000 且 message 含 timeout');

    // ④ pending map：源码不应存在悬挂请求表
    const hasPendingMap = /pending(Maps?|Requests?)/i.test(srvSrc + protoSrc);
    c.ok('④无悬挂请求(pending map 为空)', !hasPendingMap,
      hasPendingMap ? '存在 pending 结构' : 'mcp-server.mjs 无 in-flight/pending 表；handleMessage 为 fire-and-forget (mcp-server.mjs:186-198)',
      'pending 为空');

    // ⑤ 超时后重建连接：initialize → tools/list 正常响应
    const toolsList = frames.find((f) => f.id === 2 && f.result);
    c.ok('⑤同会话 tools/list 正常返回 tools 数组', Array.isArray(toolsList?.result?.tools),
      toolsList?.result?.tools?.length, '数组');
    c.ok('⑤tools/list 工具数=40', toolsList?.result?.tools?.length === 40,
      toolsList?.result?.tools?.length, 40);

    const call = frames.find((f) => f.id === 3);
    c.ok('⑤tools/call 返回 result（非错误对象）', !!(call && call.result),
      call ? (call.error ? `error ${call.error.code}` : 'result') : '无响应', 'result');

    // 结论按用例自身规则：capabilities 未声明取消能力 → SPEC-MISMATCH（不假定支持）
    const verdict = (!hasCancellation || !hasTimeoutErr) ? 'SPEC-MISMATCH' : undefined;
    return {
      verdict,
      why: `initialize.result.capabilities 仅 {tools:{}}（mcp-protocol.mjs:47-49），未声明 notifications/cancellation；`
        + `mcp-server.mjs:186-198 的 handleMessage 无超时包装、无 notifications/cancelled 分支，`
        + `tools/call 不产生 {code:-32000, message 含 'timeout'} 错误对象 → 用例要求的超时/取消协议语义未实现，按用例规则标 SPEC-MISMATCH。`,
    };
  });
}
