// AI生成
// D1-30: 版本比较 semver 边界
// 验证 semverParse 和 semverCompare 函数处理各种边界情况
// 包括: 正常版本、预发布版本、无效版本、缺失字段
const { pathToFileURL } = require('node:url');
const { semverParse, semverCompare } = require(pathToFileURL('C:/Users/Administrator/devkit-test/OfficeAce/hdk/plugins/huaweicloud-core/src/update-check.mjs').href);

// Test cases:
// 1. semverParse('1.2.3') → {major:1, minor:2, patch:3, prerelease:[]}
// 2. semverParse('1.2.3-beta.1') → prerelease:['beta', 1]
// 3. semverParse('invalid') → null
// 4. semverCompare('1.0.0', '2.0.0') → -1
// 5. semverCompare('2.0.0', '1.0.0') → 1
// 6. semverCompare('1.0.0', '1.0.0') → 0
// 7. semverCompare('1.0.0', '1.0.0-beta') → 1 (release > prerelease)
// 8. semverCompare('invalid', '1.0.0') → 1 (lexical fallback: 'i' > '1' in ASCII)
