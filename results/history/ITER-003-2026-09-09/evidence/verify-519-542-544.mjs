// ITER-003 回归验证 #519/#542/#544（基线 1.1.2-next.4 = 608b120）
// 功能级实测：probeHcloud 真机 + classifyHcloudProbe 场景分类 + scanState 无崩溃
import { probeHcloud, classifyHcloudProbe, findHcloudBin } from 'file:///C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/hcloud-probe.mjs';

console.log('[1] findHcloudBin():', findHcloudBin());

console.log('[2] probeHcloud() 真机实测:');
const p = probeHcloud({ timeoutMs: 8000 });
console.log('  status:', p.status, '| installed:', p.installed, '| ok:', p.ok, '| errorCode:', p.errorCode, '| exitCode:', p.exitCode);
console.log('  installedVersion:', p.installedVersion, '| output:', String(p.output || '').slice(0, 80));

console.log('[3] classify 场景矩阵（构造 result 验证沙箱/未装/隐私分类）:');
// 3a 沙箱 home 失败（#542 现象2）
const r1 = classifyHcloudProbe({ status: 1, error: null, stdout: '', stderr: '[CLI_ERROR]获取当前用户家目录失败:The system cannot find the file specified.' });
console.log('  3a sandbox:', r1.status, r1.errorCode, '|', r1.ok === false && r1.installed === true ? 'PASS' : 'FAIL');
// 3b ENOENT 未安装（#519 相关诊断）
const r2 = classifyHcloudProbe({ status: null, error: { code: 'ENOENT' }, stdout: '', stderr: '' });
console.log('  3b not_found:', r2.status, r2.errorCode, '|', r2.status === 'not_found' ? 'PASS' : 'FAIL');
// 3c 正常版本输出
const r3 = classifyHcloudProbe({ status: 0, error: null, stdout: '当前KooCLI版本:7.2.12', stderr: '' });
console.log('  3c ok:', r3.status, '|', r3.status === 'ok' && r3.installedVersion ? 'PASS' : 'FAIL');
// 3d 隐私待同意
const r4 = classifyHcloudProbe({ status: 1, error: null, stdout: '', stderr: '请阅读并同意隐私协议,输入 同意并继续使用' });
console.log('  3d privacy:', r4.status, r4.errorCode, '|', r4.status === 'privacy_pending' ? 'PASS' : 'FAIL');
// 3e 版本不匹配
const r5 = classifyHcloudProbe({ status: 0, error: null, stdout: '当前KooCLI版本:7.2.11', stderr: '' }, '7.2.12');
console.log('  3e mismatch:', r5.status, '|', r5.status === 'version_mismatch' ? 'PASS' : 'FAIL');