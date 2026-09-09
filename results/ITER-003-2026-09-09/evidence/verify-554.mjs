// 验证 #554：Windows 上 queryDistTagsSync (spawnSync npm.cmd, 无 shell:true) 是否 EINVAL 失效
import { queryDistTagsSync, semverCompare, determineTarget } from 'file:///C:/Users/Administrator/devkit-test/hdk/plugins/huaweicloud-core/src/update-check.mjs';

console.log('[1] process.platform =', process.platform);
const tags = queryDistTagsSync({ timeoutMs: 10000 });
console.log('[2] queryDistTagsSync() =', JSON.stringify(tags));
const target = determineTarget('1.1.2-next.4', tags ?? {});
console.log('[3] determineTarget(1.1.2-next.4) =', target);
const cmp = semverCompare(target || '1.1.2-next.4', '1.1.2-next.4');
console.log('[4] semverCompare(target, current) =', cmp, cmp > 0 ? '=> 会提示新版本' : '=> 不提示');