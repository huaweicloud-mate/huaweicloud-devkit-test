import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
let pass=0, fail=0; const L=[];
function ck(id,t,c,note){c?pass++:fail++;L.push(`${c?'PASS':'FAIL'}  ${id}  ${t}  => ${note}`);}

const HDK='/home/testbot1/devkit-test/testbot1-linux-atomcode/hdk';
const pkg = JSON.parse(readFileSync(join(HDK,'package.json'),'utf8'));

// ① postinstall 行为审计：只打印引导 + DSH profile 拷贝 skills + patch 路径重写，无网络/exfil/任意执行
const postinstall = readFileSync(join(HDK,'bin','dsh-postinstall.cjs'),'utf8');
const noNetwork = !/(https?:\/\/|child_process|exec\(|spawn\(|request|fetch\(|curl|wget|eval\()/.test(postinstall);
ck('D4-12','postinstall 无网络请求/子进程/任意执行', !!pkg.scripts?.postinstall && noNetwork, `postinstall=${pkg.scripts?.postinstall}`);
// ② 依赖锁定：package-lock.json 存在 + dependencies 少（1 个运行时依赖）
ck('D4-12','package-lock.json 存在(依赖锁定)', existsSync(join(HDK,'package-lock.json')), 'lock exists');
ck('D4-12','运行时依赖锁定(1 个 dependencies)', Object.keys(pkg.dependencies||{}).length === 1, JSON.stringify(Object.keys(pkg.dependencies||{})));
// ③ pack 一致校验脚本存在
ck('D4-12','pack:verify 脚本存在(源码与 pack 一致性校验)', (pkg.scripts||{})['pack:verify']!==undefined, pkg.scripts?.['pack:verify']||'(none)');
// ④ SBOM 可产：package-lock 含完整依赖树
const lock = JSON.parse(readFileSync(join(HDK,'package-lock.json'),'utf8'));
const lockPkgs = Object.keys(lock.packages||{}).length;
ck('D4-12','SBOM 可产(lock 含依赖树)', lockPkgs > 1, `lock packages=${lockPkgs}`);

console.log('\n=== D4-12 供应链安装期安全探针结果 ===');
for(const l of L)console.log(l);
console.log(`\nTOTAL pass=${pass} fail=${fail}`);
process.exit(fail>0?1:0);
