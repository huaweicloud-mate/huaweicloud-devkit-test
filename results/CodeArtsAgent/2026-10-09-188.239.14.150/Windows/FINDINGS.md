# FINDINGS - 每日测试缺陷清单

## #1【P0】Windows 升级检测链可用性

- **描述**: Windows 下 `queryDistTagsSync` 函数使用 `spawnSync` 调用 `npm.cmd` 时，不带 `shell:true` 参数会返回 `EINVAL` 错误，导致检测链静默失败
- **断言**: `spawnSync('npm.cmd', ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], { windowsHide: true })` 在 Windows 上应正常返回结果，而非抛出 `EINVAL` 错误
- **根因**: `hdk/plugins/huaweicloud-core/src/update-check.mjs:238-243` - `queryDistTagsSync` 函数中 `spawnSync` 调用未设置 `shell:true` 参数
- **证据**: `evidence/D1-39/stdout.log` - 测试显示不带 `shell:true` 时返回 `spawnSync npm.cmd EINVAL`，带 `shell:true` 时正常工作
- **建议**: 在 `queryDistTagsSync` 函数的 `spawnSync` 调用中添加 `shell: true` 参数，或在 Windows 平台下自动添加该参数
