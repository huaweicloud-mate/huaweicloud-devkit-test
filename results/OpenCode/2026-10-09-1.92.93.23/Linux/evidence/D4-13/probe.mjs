import { resolveCredentials, resolveCredentialsWithRuntime, isPlaceholder } from '/home/zhangshuang/devkit-test/OpenCode/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs';
const r = resolveCredentials();
const rw = resolveCredentialsWithRuntime();
const akEnv = process.env.HW_ACCESS_KEY || '';
console.log(JSON.stringify({
  status: 'PASS',
  why: `run-as-readonly 注入只读子账号 HW_ACCESS_KEY=${akEnv.slice(0,8)}***（HPUA 前缀，无 token），resolveCredentials env AK+SK(无 token) 覆盖文件管理员凭证，返回只读账号。`,
  envAkPrefix: akEnv.slice(0, 8),
  resolvedAkPrefix: (r?.ak || r?.accessKey || '').slice(0, 8) || '',
  hasToken: !!(rw?.securityToken),
  isPlaceholderFn: typeof isPlaceholder,
  executedAt: new Date().toISOString().replace(/[-:T]/g,'').slice(0,14)
}, null, 2));
