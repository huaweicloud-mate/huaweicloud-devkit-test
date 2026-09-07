// d1-cleanup-test.mjs - D1 新功能隔离实测（uninstall-cleanup 系列）
// 全部在临时 HOME 内构造 fake 资产，验证 removeKooCli/removeObsConfig
// 零真实破坏：不触碰真机 hcloud/配置
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, openSync, closeSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const SRCPKG = 'file:///C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src';

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; console.log(`  ✅ ${msg}`); } else { fail++; console.log(`  ❌ ${msg}`); } };

// ---- 构造隔离环境 ----
const home = mkdtempSync(join(tmpdir(), 'hwc-d1-'));
const DEFAULT_BIN1 = join(home, '.local', 'bin', 'hcloud');
const DEFAULT_BIN2 = join(home, 'hcloud', 'hcloud.exe');   // Windows 默认安装
const HCLOUD_CFG  = join(home, '.hcloud', 'config.json');
const USER_BIN    = join(home, '.custom', 'hcloud');        // 用户管理 HCLOUD_BIN
mkdirSync(join(home, '.local', 'bin'), { recursive: true });
mkdirSync(join(home, 'hcloud'), { recursive: true });
mkdirSync(join(home, '.hcloud'), { recursive: true });
mkdirSync(join(home, '.custom'), { recursive: true });
writeFileSync(DEFAULT_BIN1, '#!/bin/sh\necho fake-hcloud\n', { mode: 0o755 });
writeFileSync(DEFAULT_BIN2, 'FAKE-HCLOUD-EXE', 'utf8');
writeFileSync(HCLOUD_CFG, '{"climsg":"fake"}', 'utf8');
writeFileSync(USER_BIN, 'user-managed', 'utf8');

console.log('D1-10/11/12: removeKooCli 隔离验证（临时 HOME）');

const { removeKooCli } = await import(`${SRCPKG}/sandbox/uninstall-cleanup.mjs`);
const removed = removeKooCli(home);

ok(removed.includes(DEFAULT_BIN1), `默认二进制 .local/bin/hcloud 被删 (removed=${removed.length})`);
ok(removed.includes(DEFAULT_BIN2), `Windows 默认 hcloud.exe 被删`);
ok(removed.includes(HCLOUD_CFG.slice(0, HCLOUD_CFG.lastIndexOf('\\'))), `~/.hcloud 配置目录被删`);
ok(existsSync(USER_BIN), `用户管理二进制（HCLOUD_BIN 自定义）保留`);
ok(!removed.some(r => r.includes('.custom')), `删除清单不含自定义路径（用户管理资产零触碰）`);
const installDirRemoved = removed.filter(r => r === join(home, 'hcloud')).length;
ok(removed.length === 4, `删除清单 = 3 默认位置 + 1 空安装目录（best-effort 清理）=> removed: ${removed.length}`);

console.log('\nD1-12: 幂等性（重复执行）');
const second = removeKooCli(home);
ok(second.length === 0, `二次执行返回空清单（无报错无残留）`);

console.log('\nD1-13: Windows 文件锁场景（观察记录）');
// 重建 .hcloud（D1-10 已删除）并尝试锁住其中文件
// 观察：Windows 下 Node 只读句柄不阻止 rmSync（FILE_SHARE 语义），文件被正常删除
// ⇒ 本机无法通过句柄方式构造"删除被拒"；真实锁场景（运行中 exe 映像）需客户端手工验证，用例延后至手工测试
mkdirSync(join(home, '.hcloud'), { recursive: true });
const lockTarget = join(home, '.hcloud', 'lock.txt');
writeFileSync(lockTarget, 'locked', 'utf8');
const fd = openSync(lockTarget, 'r');
let lockedThrew = false;
let msg = '';
try { removeKooCli(home); } catch (e) { lockedThrew = true; msg = e.message.slice(0, 60); }
closeSync(fd);
ok(!lockedThrew && !existsSync(lockTarget),
   `观察记录：句柄锁无法阻止删除（rmSync 成功，无异常、无损坏残留）——真实锁场景留待手工验证 [${msg || 'no-throw'}]`);

console.log('\nD1-10b: removeObsConfig 隔离验证（子进程注入 USERPROFILE）');
const obsFile = join(home, '.obsutilconfig');
writeFileSync(obsFile, '[obs]\nkey=value', 'utf8');
const subScript = `
import { removeObsConfig } from '${SRCPKG.replace(/\\/g, '/')}/sandbox/uninstall-cleanup.mjs';
const r = removeObsConfig();
console.log('REMOVED=' + r.length);
`;
const sub = spawnSync(process.execPath, ['--input-type=module', '-e', subScript], {
    env: { ...process.env, USERPROFILE: home, HOME: home },
    encoding: 'utf8', shell: false,
});
ok(sub.status === 0, `子进程 removeObsConfig 正常退出 (exit=${sub.status})`);
ok(/REMOVED=1/.test(sub.stdout), `.obsutilconfig 被删除（子进程 HOME 注入生效）: ${(sub.stdout || '').trim().split('\n').pop()}`);
const sub2 = spawnSync(process.execPath, ['--input-type=module', '-e', subScript], {
    env: { ...process.env, USERPROFILE: home, HOME: home },
    encoding: 'utf8', shell: false,
});
ok(/REMOVED=0/.test(sub2.stdout), `二次执行 REMOVED=0（幂等）`);

// ---- 清理 ----
try { rmSync(home, { recursive: true, force: true }); } catch {}
console.log(`\n======== D1 cleanup 测试结果: ${pass} 通过 / ${fail} 失败 ========`);
process.exit(fail > 0 ? 1 : 0);