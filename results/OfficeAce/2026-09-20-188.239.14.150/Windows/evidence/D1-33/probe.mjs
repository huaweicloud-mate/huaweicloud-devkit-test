// AI生成
// D1-33: skip 文件持久化与多路径
// 验证 writeSkipState/readSkipState/resolveSkipFilePath 的行为
// 包括: 正常写入读取、原子写入(tmp+rename)、多路径解析、无效文件处理
const { pathToFileURL } = require('node:url');
const { writeSkipState, readSkipState, resolveSkipFilePath } = require(
  pathToFileURL('C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/update-check.mjs').href
);
