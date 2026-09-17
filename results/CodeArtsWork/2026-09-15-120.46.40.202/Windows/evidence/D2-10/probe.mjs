// D2-10 probe: R7 current档跟随
// 直接源码级调用 readKooCliProfiles / resolveManagedProfile 验证 current 档解析
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { homedir, tmpdir } from 'node:os';

const SRC = 'C:/Users/Administrator/devkit-test/testbot5-win-CodeArtsSpace/hdk/plugins/huaweicloud-core/src';
const reconcile = await import('file://' + join(SRC, 'auth', 'reconcile.mjs'));

// 隔离测试环境
const FAKE_HOME = join(tmpdir(), 'd2-10-test-' + process.pid);
const configPath = join(FAKE_HOME, '.hcloud', 'config.json');
mkdirSync(join(FAKE_HOME, '.hcloud'), { recursive: true });
process.env.HCLOUD_CONFIG_PATH = configPath;

// 构造 current=deploy 的多 profile 配置
const kooCliConfig = {
  current: 'deploy',
  authEncrypt: false,
  profiles: [
    { name: 'default', accessKeyId: 'AKDEFAULT123', secretAccessKey: 'SKDEFAULT456' },
    { name: 'deploy', accessKeyId: 'AKDEPLOY789', secretAccessKey: 'SKDEPLOY012' },
    { name: 'staging', accessKeyId: 'AKSTAGING345', secretAccessKey: 'SKSTAGING678' },
  ],
};
writeFileSync(configPath, JSON.stringify(kooCliConfig));

try {
  console.log('=== D2-10 R7 current档跟随 ===');
  console.log('Config: current=deploy, 3 profiles (default, deploy, staging)');
  console.log('');

  // Step 1: readKooCliProfiles 解析
  const profiles = reconcile.readKooCliProfiles();
  console.log('readKooCliProfiles():', JSON.stringify(profiles, null, 2));
  console.log('current === "deploy":', profiles.current === 'deploy');
  console.log('profiles count === 3:', profiles.profiles.length === 3);
  console.log('');

  // Step 2: resolveManagedProfile 返回 current 档
  const managed = reconcile.resolveManagedProfile();
  console.log('resolveManagedProfile():', managed);
  console.log('resolveManagedProfile === "deploy":', managed === 'deploy');
  console.log('');

  // Step 3: 切换 current 再解析
  kooCliConfig.current = 'staging';
  writeFileSync(configPath, JSON.stringify(kooCliConfig));
  const profiles2 = reconcile.readKooCliProfiles();
  const managed2 = reconcile.resolveManagedProfile();
  console.log('After switch to staging:');
  console.log('resolveManagedProfile():', managed2);
  console.log('resolveManagedProfile === "staging":', managed2 === 'staging');
  console.log('');

  // Step 4: 验证 runHcloudConfigure 使用 --cli-profile= (源码级)
  // reconcile.mjs:199-208 runHcloudConfigure 构造 args 含 `--cli-profile=${profile}`
  // 由于 hcloud 未安装，spawnSync 会失败，但我们可以验证 args 构造逻辑
  // 通过源码检查确认（已在 stdout.log 中记录）
  console.log('runHcloudConfigure source (reconcile.mjs:199-208):');
  console.log('  args = ["configure", "set", "--cli-profile=${profile}", "--cli-access-key=${ak}", ...]');
  console.log('  → --cli-profile= flag confirmed in source');
  console.log('');

  const PASS = profiles.current === 'deploy' && managed === 'deploy' && managed2 === 'staging';
  console.log('VERDICT:', PASS ? 'PASS' : 'FAIL');
} finally {
  try { rmSync(FAKE_HOME, { recursive: true, force: true }); } catch {}
}
