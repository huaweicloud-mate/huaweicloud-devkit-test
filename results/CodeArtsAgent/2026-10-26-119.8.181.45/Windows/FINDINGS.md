# FINDINGS

## [P0] D1-39/D1-40: Windows 升级检测链 EINVAL 静默失败

- **级别**: P0
- **用例**: D1-39, D1-40
- **现象**: queryDistTagsSync/queryDistTags 在 Windows 下返回 null，spawnSync 执行 npm.cmd 报 EINVAL 静默失败
- **断言**: queryDistTagsSync 应返回有效 dist-tags {latest, next}
- **根因**: plugins/huaweicloud-core/src/update-check.mjs:238 - spawnSync 缺少 shell: true 参数
- **证据**: evidence/D1-39/stdout.log, evidence/D1-40/stdout.log
