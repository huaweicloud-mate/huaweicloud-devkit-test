# FINDINGS - CodeArtsAgent 每日测试缺陷清单

## #1【P0】D1-39 Windows 升级检测链 queryDistTagsSync 返回 null

- **现象**: queryDistTagsSync 函数返回 null，无法获取 npm registry 的 distTags
- **断言**: queryDistTagsSync 应返回有效的 distTags 对象（包含 latest 等版本标签）
- **根因**: hdk/plugins/huaweicloud-core/src/update-check.mjs:256-273，queryDistTagsSync 函数因网络问题无法获取 registry 数据
- **影响**: Windows 升级检测链不可用，无法正确检测新版本
- **证据**: evidence/D1-39/stdout.log
- **状态**: 待提单

## #2【P0】D1-40 镜像 lag 检测 queryDistTags 返回 null

- **现象**: queryDistTags 函数返回 null，无法获取 npm registry 的 distTags
- **断言**: queryDistTags 应返回有效的 distTags 对象（包含 latest 等版本标签）
- **根因**: hdk/plugins/huaweicloud-core/src/update-check.mjs:278-296，queryDistTags 函数因网络问题无法获取 registry 数据
- **影响**: 镜像 lag 检测不可用，可能导致版本倒退提示
- **证据**: evidence/D1-40/stdout.log
- **状态**: 待提单

## #3【P1】D1-26 tools list 命令不可用

- **现象**: huaweicloud tools list 命令不存在
- **断言**: tools list 应输出工具清单（40 个 MCP 工具）
- **根因**: CLI 命令缺失，需要通过 MCP server 获取工具列表
- **影响**: 无法通过 CLI 查看工具列表
- **证据**: evidence/D1-26/stdout.log
- **状态**: 待提单

## #4【P1】D1-27 judgeUpdate 返回 check_failed

- **现象**: judgeUpdate 函数返回 check_failed 而非预期的 up_to_date
- **断言**: judgeUpdate({current: "1.1.12", distTags: {latest: "1.1.12"}}) 应返回 result="up_to_date"
- **根因**: hdk/plugins/huaweicloud-core/src/update-check.mjs，judgeUpdate 依赖 queryDistTags 获取 registry 数据
- **影响**: 版本检测功能不可用
- **证据**: evidence/D1-27/stdout.log
- **状态**: 待提单

## #5【P1】D1-28 judgeUpdate 返回 check_failed

- **现象**: judgeUpdate 函数返回 check_failed 而非预期的 update_available
- **断言**: judgeUpdate({current: "1.1.10", distTags: {latest: "1.1.12"}}) 应返回 result="update_available" 且 targetVersion="1.1.12"
- **根因**: hdk/plugins/huaweicloud-core/src/update-check.mjs，judgeUpdate 依赖 queryDistTags 获取 registry 数据
- **影响**: 版本检测功能不可用
- **证据**: evidence/D1-28/stdout.log
- **状态**: 待提单
