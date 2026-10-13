// 定位 hdk 源码 src 目录（契约单测的 SUT 导入路径）。
// 解析顺序与 scripts/verify_test_completeness.py 保持一致：
//   1) env HUAWEICLOUD_DEVKIT_HOME
//   2) env HDK_PATH
//   3) sibling ../hdk（默认部署布局 ~/devkit-test/<client>/）
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');

function srcOf(hdkRoot) {
  return join(hdkRoot, 'plugins', 'huaweicloud-core', 'src');
}

export function resolveHdkSrc() {
  for (const key of ['HUAWEICLOUD_DEVKIT_HOME', 'HDK_PATH']) {
    const val = process.env[key];
    if (val && existsSync(join(srcOf(val), 'tools.mjs'))) {
      return { src: srcOf(val), tag: `env ${key}` };
    }
  }
  const sibling = join(REPO_ROOT, '..', 'hdk');
  if (existsSync(join(srcOf(sibling), 'tools.mjs'))) {
    return { src: srcOf(sibling), tag: 'sibling ../hdk' };
  }
  throw new Error(
    '无法定位 hdk 源码: 请设置 HUAWEICLOUD_DEVKIT_HOME 或 HDK_PATH，或将 hdk clone 到测试仓库父目录下的 hdk/',
  );
}

export async function importHdk(mod) {
  const { src, tag } = resolveHdkSrc();
  const url = new URL(`file:///${src.replace(/\\/g, '/')}/${mod}`);
  const module = await import(url.href);
  return { module, tag };
}