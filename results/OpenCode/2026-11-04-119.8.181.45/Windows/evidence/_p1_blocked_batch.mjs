// P1 BLOCKED batch — resource creation / sandbox cases
// Reasons: admin credentials.json has placeholder values; sandbox in maintenance
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const blocked = {
  'D3-C1': {
    caseId: 'D3-C1', status: 'BLOCKED', executedAt: '20261104053000',
    assertion: 'ECS生命周期E2E (购买→验证ACTIVE→删除含磁盘→归零)',
    blockedReason: '【补环境】本机 credentials.json 为占位凭证(test_ak/test_sk)，无法执行 ECS CreateServers/DeleteServers 真机创建删除；只读子账号(test001)仅有只读权限，IAM 拒绝写操作。解除条件：配置真实管理员 AK/SK 到 credentials.json',
    actual: { readonlyEcsListOk: true, writeBlockedAtPlan: 'plan_cli_command ECS CreateServers -> deny/write', writeWouldFailAtIam: 'readonly subaccount lacks ECS write permission' },
  },
  'D3-C2': {
    caseId: 'D3-C2', status: 'BLOCKED', executedAt: '20261104053000',
    assertion: 'OBS静态站部署E2E (构建→上传→public-read→curl200→清理)',
    blockedReason: '【补环境】本机 credentials.json 为占位凭证；obsutilconfig 同步的也是占位值；无法执行 OBS bucket 创建/上传/删除真机操作。解除条件：配置真实 AK/SK',
    actual: { obsConfigured: true, obsCredsPlaceholder: true },
  },
  'D3-C3': {
    caseId: 'D3-C3', status: 'BLOCKED', executedAt: '20261104053000',
    assertion: '沙箱部署E2E (connect→upload→deploy_nginx→URL验证→close)',
    blockedReason: '【补环境】huaweicloud_sandbox_check_user 返回 HDKIT_SANDBOX_MAINTENANCE「沙箱功能正在升级优化，暂时无法使用」。解除条件：沙箱服务升级完成恢复可用',
    actual: { sandboxCheckUserError: 'HDKIT_SANDBOX_MAINTENANCE', sandboxMaintenance: true },
  },
  'D3-S2': {
    caseId: 'D3-S2', status: 'BLOCKED', executedAt: '20261104053000',
    assertion: '场景-删VPC先确认 (plan→hook预检→未确认零执行→确认后执行→归零)',
    blockedReason: '【补环境】本机 credentials.json 为占位凭证；plan_cli_command + hook_check_command 预检部分已验证(D4-18/D4-19)，但无法真机执行 DeleteVpc 删除资源。解除条件：配置真实管理员 AK/SK',
    actual: { planDeleteVpc: 'deny/write + approvalToken', hookPreflight: 'warn (hwc-destructive-delete-operation)', cannotExecuteWithoutAdminCreds: true },
  },
  'D3-S3': {
    caseId: 'D3-S3', status: 'BLOCKED', executedAt: '20261104053000',
    assertion: '场景-沙箱预览出URL (check_user→connect→upload→deploy→URL→close)',
    blockedReason: '【补环境】huaweicloud_sandbox_check_user 返回 HDKIT_SANDBOX_MAINTENANCE。解除条件：沙箱服务升级完成',
    actual: { sandboxMaintenance: true, error: 'HDKIT_SANDBOX_MAINTENANCE' },
  },
  'D3-S7': {
    caseId: 'D3-S7', status: 'BLOCKED', executedAt: '20261104053000',
    assertion: '场景-跨服务交付(Web应用+RDS)并归零',
    blockedReason: '【补环境】本机 credentials.json 为占位凭证；无法建 RDS 实例；沙箱也在维护。解除条件：配置真实管理员 AK/SK 且沙箱恢复',
    actual: { rdsCreateBlocked: 'admin creds placeholder', sandboxBlocked: 'maintenance' },
  },
  'D3-C6': {
    caseId: 'D3-C6', status: 'BLOCKED', executedAt: '20261104053000',
    assertion: '沙箱7隐式工具具名冒烟 (check_user→credentials→sign_agreement→upload→exec→deploy_check→close)',
    blockedReason: '【补环境】huaweicloud_sandbox_check_user 返回 HDKIT_SANDBOX_MAINTENANCE；沙箱工具链无法执行。解除条件：沙箱服务升级完成',
    actual: { sandboxMaintenance: true, error: 'HDKIT_SANDBOX_MAINTENANCE' },
  },
  'D3-C13': {
    caseId: 'D3-C13', status: 'BLOCKED', executedAt: '20261104053000',
    assertion: 'OBS静态网站托管配置 (get/set/delete AWS4签名REST)',
    blockedReason: '【补环境】本机 credentials.json 为占位凭证；obs_set_website_config 工具注册已验证(D3-C5工具冒烟)，但无法真机对一个真实 bucket 执行 get/set/delete。解除条件：配置真实 AK/SK',
    actual: { toolRegistered: 'huaweicloud_obs_set_website_config verified in tools/list', cannotExecuteWithoutRealCreds: true },
  },
};

for (const [cid, data] of Object.entries(blocked)) {
  const caseDir = join(__dirname, cid);
  mkdirSync(caseDir, { recursive: true });
  writeFileSync(join(caseDir, 'probe.mjs'), `// ${cid} probe — BLOCKED (environment)\n`);
  writeFileSync(join(caseDir, 'stdout.log'), JSON.stringify(data, null, 2));
}

console.log('=== P1 BLOCKED BATCH ===');
for (const [cid, data] of Object.entries(blocked)) {
  console.log(`${cid}: ${data.status} - ${data.blockedReason.slice(0, 60)}`);
}
