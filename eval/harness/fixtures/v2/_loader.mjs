/**
 * v2 适配 shim 共享加载器。
 *
 * v1 夹具（d11-*.mjs）通过 ux-common 的 importHdk(hdkSrc, 'xxx.mjs') 动态 import
 * v1 源码（.mjs）。v2 分支全面 TypeScript 化（.mjs → .ts），build 后产物是
 * plugins/huaweicloud-core/dist/**\/*.js。
 *
 * 本文件让 shim（v2/tools.mjs 等）在运行时定位 v2 build 的 dist 目录并动态
 * import 对应 .js 模块，再把 v1 兼容符号 re-export。这样 v1 夹具源码一行不改：
 * 跑法改为把 hdkSrc 指向本 shim 目录，并设 V2_DIST 指向 v2 dist。
 *
 * 环境变量：
 *   V2_DIST  → v2 build 产物 dist 绝对路径（plugins/huaweicloud-core/dist）
 */
import { pathToFileURL } from 'node:url';

export function v2dist() {
  const dist = process.env.V2_DIST;
  if (!dist) {
    throw new Error(
      '[v2shim] 缺少 V2_DIST 环境变量：请先 build v2（npm ci && npm run build），' +
        '再 V2_DIST=<v2仓库>/plugins/huaweicloud-core/dist 指向产物目录',
    );
  }
  return dist.replace(/[\\/]+$/, '');
}

export function load(rel) {
  return import(pathToFileURL(`${v2dist()}/${rel}`).href);
}