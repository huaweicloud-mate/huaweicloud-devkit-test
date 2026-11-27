import { spawnSync } from 'node:child_process';
console.log('platform', process.platform, 'PATH has node dir:', /workbuddy.*node/.test(process.env.PATH || ''));
const t0 = Date.now();
const r = spawnSync('npm.cmd view huaweicloud-devkit dist-tags --json', { encoding: 'utf8', timeout: 15000, windowsHide: true, shell: true });
console.log(JSON.stringify({ status: r.status, signal: r.signal, err: r.error && (r.error.code + ': ' + r.error.message), ms: Date.now() - t0, out: (r.stdout || '').slice(0, 300), errOut: (r.stderr || '').slice(0, 300) }, null, 1));
const t1 = Date.now();
const r2 = spawnSync('npm.cmd view huaweicloud-devkit dist-tags --json --registry https://registry.npmjs.org', { encoding: 'utf8', timeout: 60000, windowsHide: true, shell: true });
console.log(JSON.stringify({ status: r2.status, err: r2.error && r2.error.code, ms: Date.now() - t1, out: (r2.stdout || '').slice(0, 300) }, null, 1));
