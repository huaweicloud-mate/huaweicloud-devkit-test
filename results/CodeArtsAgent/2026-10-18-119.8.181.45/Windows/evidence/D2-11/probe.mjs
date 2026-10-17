// D2-11: R3 STS token拒绝落盘
// 测试 auth_switch persist + token 应返回 rejected 且不落盘
import { writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SRCDIR = process.argv[2] || 'C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src';
const OUT = process.argv[3] || 'C:/Users/Administrator/devkit-test/huaweicloud-devkit-test/results/CodeArtsAgent/2026-10-18-119.8.181.45/Windows/evidence/D2-11/stdout.log';

const results = [];
function check(id, cond, detail) {
  const r = { id, status: cond ? 'PASS' : 'FAIL', detail };
  results.push(r);
  console.log('[' + r.status + '] ' + id + ': ' + detail);
  return cond;
}

let status = 'PASS';
let why = '';

try {
  const toolsUrl = pathToFileURL(join(SRCDIR, 'tools.mjs')).href;
  const credentialsUrl = pathToFileURL(join(SRCDIR, 'auth/credentials.mjs')).href;
  
  const { callTool } = await import(toolsUrl);
  const { globalCredentialsPath, readGlobalCredentials, writeGlobalCredentials } = await import(credentialsUrl);
  
  console.log('=== D2-11 R3 STS token拒绝落盘测试 ===');
  console.log('源码路径: ' + SRCDIR);
  
  // 清理现有凭证，确保没有冲突
  try {
    const credPath = globalCredentialsPath();
    if (existsSync(credPath)) {
      rmSync(credPath, { force: true });
      console.log('已清理现有凭证文件');
    }
  } catch (e) {
    console.log('清理凭证文件: ' + e.message);
  }
  
  // 测试1: 直接测试 persistCredentials 函数（从 tools.mjs 内部导出）
  console.log('--- 测试 persistCredentials 函数（带 STS token）---');
  
  // 从 tools.mjs 源码中提取 persistCredentials 逻辑进行测试
  // 注意：persistCredentials 不是导出函数，需要测试完整的 auth_switch 流程
  
  // 先调用 auth_switch persist 带 STS token
  let persistResult = null;
  try {
    persistResult = await callTool('huaweicloud_auth_switch', {
      mode: 'memory',
      action: 'persist',
      ak: 'test_ak_20char123456',
      sk: 'test_sk_30char1234567890123456',
      securityToken: 'sts-token-test-1234567890',
      region: 'cn-north-4'
    });
    console.log('auth_switch persist 返回: ' + JSON.stringify(persistResult));
  } catch (e) {
    console.log('auth_switch persist 异常: ' + e.message);
  }
  
  // 关键断言：当有 STS token 时，应该返回 rejected
  // 如果返回 needs_confirmation，说明有冲突，需要先清理
  const isRejected = persistResult && persistResult.status === 'error' && persistResult.scope === 'rejected';
  const isNeedsConfirm = persistResult && persistResult.status === 'needs_confirmation';
  
  if (isNeedsConfirm) {
    console.log('检测到需要确认，说明存在凭证冲突');
    // 选择 s1 选项来保留原有凭证
    const confirmResult = await callTool('huaweicloud_auth_confirm', {
      token: persistResult.confirmToken,
      decision: 's1'
    });
    console.log('confirm 返回: ' + JSON.stringify(confirmResult));
    
    // 重新测试：先清理所有凭证
    try {
      const credPath = globalCredentialsPath();
      if (existsSync(credPath)) {
        rmSync(credPath, { force: true });
      }
    } catch (e) {}
    
    // 再次尝试 persist
    persistResult = await callTool('huaweicloud_auth_switch', {
      mode: 'memory',
      action: 'persist',
      ak: 'test_ak_20char123456_new',
      sk: 'test_sk_30char1234567890123456_new',
      securityToken: 'sts-token-test-1234567890',
      region: 'cn-north-4'
    });
    console.log('二次 persist 返回: ' + JSON.stringify(persistResult));
  }
  
  check('persist-返回rejected', 
    persistResult && persistResult.status === 'error' && persistResult.scope === 'rejected',
    'STS token 持久化应返回 {status:error, scope:rejected}'
  );
  
  check('persist-包含R3提示',
    persistResult && persistResult.error && (persistResult.error.includes('R3') || persistResult.error.includes('STS')),
    '错误消息应包含 R3 或 STS 提示'
  );
  
  // 测试2: 验证 STS token 未落盘
  console.log('--- 验证 STS token 未落盘 ---');
  let tokenPersisted = false;
  try {
    const credPath = globalCredentialsPath();
    if (existsSync(credPath)) {
      const content = readFileSync(credPath, 'utf8');
      const creds = JSON.parse(content);
      if (creds.securityToken && creds.securityToken.length > 0) {
        tokenPersisted = true;
        console.log('发现 STS token 已落盘');
      }
    } else {
      console.log('凭证文件不存在');
    }
  } catch (e) {
    console.log('检查凭证文件: ' + e.message);
  }
  
  check('token-未落盘', !tokenPersisted, 'STS token 不应写入磁盘凭证文件');
  
  // 测试3: 不含 token 的普通凭证可以正常 persist
  console.log('--- 对照测试: 普通凭证 persist ---');
  let normalResult = null;
  try {
    // 清理后测试普通凭证
    try {
      const credPath = globalCredentialsPath();
      if (existsSync(credPath)) {
        rmSync(credPath, { force: true });
      }
    } catch (e) {}
    
    normalResult = await callTool('huaweicloud_auth_switch', {
      mode: 'memory',
      action: 'persist',
      ak: 'test_ak_20char123456',
      sk: 'test_sk_30char1234567890123456',
      region: 'cn-north-4'
    });
    console.log('普通凭证 persist 返回: ' + JSON.stringify(normalResult));
  } catch (e) {
    console.log('普通凭证 persist 异常: ' + e.message);
  }
  
  check('normal-persist-成功',
    normalResult && (normalResult.status === 'ok' || normalResult.status === 'partial'),
    '不含 STS token 的普通凭证可以 persist'
  );
  
  // 测试4: 验证临时模式
  console.log('--- 测试 temporary 模式 ---');
  let tempResult = null;
  try {
    tempResult = await callTool('huaweicloud_auth_switch', {
      mode: 'memory',
      action: 'temporary',
      ak: 'test_ak_temp_123456789012',
      sk: 'test_sk_temp_123456789012345678901234567890',
      securityToken: 'sts-temp-token',
      region: 'cn-north-4'
    });
    console.log('temporary 返回: ' + JSON.stringify(tempResult));
  } catch (e) {
    console.log('temporary 异常: ' + e.message);
  }
  
  check('temporary-设置成功',
    tempResult && tempResult.status === 'ok',
    'temporary 模式设置成功'
  );
  
  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  
  if (failCount === 0) {
    status = 'PASS';
    why = 'R3 STS token 拒绝落盘测试通过（' + passCount + '项测试全部通过）';
  } else {
    status = 'FAIL';
    why = failCount + '项测试失败';
  }
  
  console.log('=== D2-11 结论: ' + status + ' ===');
  console.log(why);
  
} catch (e) {
  status = 'BLOCKED';
  why = '加载源码模块失败: ' + e.message;
  console.error('D2-11 BLOCKED: ' + why);
  results.push({ id: '模块加载', status: 'FAIL', detail: why });
}

const output = {
  caseId: 'D2-11',
  status,
  why,
  executedAt: new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
  results,
  platform: process.platform,
  nodeVersion: process.version,
  srcPath: SRCDIR
};

writeFileSync(OUT, JSON.stringify(output, null, 2), 'utf8');
console.log('输出完成');
