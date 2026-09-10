import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = 'C:\\Users\\Administrator\\devkit-test\\hdk';
const setupCli = join(root, 'bin', 'setup.cjs');

function makeEnv(home) {
  const env = {
    ...process.env,
    USERPROFILE: home,
    HOME: home,
    HERMES_HOME: join(home, '.hermes'),
  };
  for (const k of ['ATOMCODE_HOME', 'DSH_HOME', 'HUAWEICLOUD_HOME', 'OFFICE_CLAW_CONFIG_ROOT']) delete env[k];
  return env;
}

function run(home, args, label) {
  const res = spawnSync(process.execPath, [setupCli, ...args], {
    env: makeEnv(home),
    encoding: 'utf8',
    timeout: 90000,
  });
  console.log('========== ' + label + ' ==========');
  console.log('node=' + process.version + '  exit=' + res.status + '  signal=' + res.signal);
  if (res.stdout) console.log('[STDOUT]\n' + res.stdout);
  if (res.stderr) console.log('[STDERR]\n' + res.stderr);
  console.log('');
  return res;
}

console.log('node version =', process.version);

// P1-2: unknown --target
{
  const home = mkdtempSync(join(tmpdir(), 'n1.1.3-p12-'));
  run(home, ['install', '--target', 'bogus'], 'P1-2 显式未知 --target');
  rmSync(home, { recursive: true, force: true });
}

// P1-4: 0 detected, non-TTY
{
  const home = mkdtempSync(join(tmpdir(), 'n1.1.3-p14-'));
  run(home, ['install'], 'P1-4 0 检测 + 非 TTY');
  rmSync(home, { recursive: true, force: true });
}

// P1-5: 1 detected (opencode only), direct install
{
  const home = mkdtempSync(join(tmpdir(), 'n1.1.3-p15-'));
  mkdirSync(join(home, '.config', 'opencode'), { recursive: true });
  run(home, ['install'], 'P1-5 1 检测(opencode) 直装');
  console.log('  -> opencode .installed 存在?', existsSync(join(home, '.config', 'opencode', 'huaweicloud-plugins', '.installed')));
  rmSync(home, { recursive: true, force: true });
}

// P1-7 / D8-1: multiple detected, non-TTY
{
  const home = mkdtempSync(join(tmpdir(), 'n1.1.3-p17-'));
  mkdirSync(join(home, '.config', 'opencode'), { recursive: true });
  mkdirSync(join(home, '.workbuddy'), { recursive: true });
  run(home, ['install'], 'P1-7/D8-1 多检测 + 非 TTY');
  rmSync(home, { recursive: true, force: true });
}

// R1-2: reinstall non-TTY (fast exit, no hang)
{
  const home = mkdtempSync(join(tmpdir(), 'n1.1.3-r1-'));
  const t0 = Date.now();
  run(home, ['reinstall'], 'R1-2 reinstall 非 TTY 快速退出');
  console.log('  -> 耗时(ms)=', Date.now() - t0);
  rmSync(home, { recursive: true, force: true });
}