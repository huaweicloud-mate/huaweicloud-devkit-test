// D4-13 run-as-readonly env 切换验证（子进程注入只读 env，不带 token）
import { resolveCredentials } from '/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk/plugins/huaweicloud-core/src/auth/credentials.mjs';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
const ro = JSON.parse(readFileSync(join(homedir(), '.config', 'huaweicloud', 'credentials.readonly.json'), 'utf8'));
const admin = JSON.parse(readFileSync(join(homedir(), '.config', 'huaweicloud', 'credentials.json'), 'utf8'));
const c = resolveCredentials();
console.log(JSON.stringify({
  readonlyMatch: c.ak === ro.ak,
  stillAdmin: c.ak === admin.ak,
  akLen: c.ak?.length,
  envSet: !!process.env.HW_ACCESS_KEY,
}));
