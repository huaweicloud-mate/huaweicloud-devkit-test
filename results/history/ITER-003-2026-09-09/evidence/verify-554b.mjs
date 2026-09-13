// #554 对照实验：npm.cmd 无 shell:true (现实现) vs 有 shell:true (修复建议) vs 官方 registry
import { spawnSync } from 'node:child_process';

console.log('[A] spawnSync(npm.cmd, view dist-tags, 无 shell:true) —— 现实现');
let r = spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], { encoding: 'utf8', timeout: 10000, windowsHide: true });
console.log('  status=', r.status, 'error=', r.error ? r.error.code + ': ' + r.error.message : 'none', 'stdout=', (r.stdout || '').slice(0, 120));

console.log('[B] spawnSync(npm.cmd, view dist-tags, shell:true) —— 修复建议');
r = spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], { encoding: 'utf8', timeout: 10000, windowsHide: true, shell: true });
console.log('  status=', r.status, 'error=', r.error ? r.error.code + ': ' + r.error.message : 'none', 'stdout=', (r.stdout || '').slice(0, 120));

console.log('[C] 对照: node 直连官方 registry 查 dist-tags（网络可用性）');
const https = await import('node:https');
const body = await new Promise((resolve) => {
  https.get('https://registry.npmjs.org/huaweicloud-devkit', (res) => {
    let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(d));
  }).on('error', (e) => resolve('ERR: ' + e.message));
});
try {
  const j = JSON.parse(body.replace(/^\uFEFF/, ''));
  console.log('  network OK, latest=', j['dist-tags'].latest, 'next=', j['dist-tags'].next);
} catch {
  console.log('  network FAIL:', body.slice(0, 200));
}