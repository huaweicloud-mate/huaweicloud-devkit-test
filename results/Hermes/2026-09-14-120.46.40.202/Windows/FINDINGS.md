# FINDINGS

> 本文件为 file_issue.py 的解析输入。格式：## #N【级别】标题

## 测试概览

- 客户端: Hermes (GLM-5.2)
- OS: Windows 10
- 被测版本: v1.1.4-next.6
- P0 结果: PASS 13 / FAIL 5
- 证据目录: results/Hermes/2026-09-14-120.46.40.202/Windows/evidence/

## 缺陷清单

## #1【P0】D1-39 Windows 升级检测链 EINVAL 静默失败

- **用例ID**: D1-39
- **描述**: Windows 平台 queryDistTagsSync() 调用 spawnSync('npm.cmd', ...) 产生 EINVAL 错误，导致升级检测链完全失效。函数静默返回 null，用户无法收到任何版本更新提醒。
- **断言**: queryDistTagsSync() 在 Windows 上应返回 {latest: string, next: string} 非-null 对象，不得返回 null
- **实际**: 返回 null，spawnSync error.code === 'EINVAL'
- **根因**: plugins/huaweicloud-core/src/update-check.mjs:238 — spawnSync(NPM_BIN, [...], {encoding, timeout, windowsHide, cwd}) 缺少 shell: true 选项。Windows 上 npm.cmd 是批处理文件，必须通过 shell 执行。
- **修复建议**: 在 spawnSync 选项中添加 shell: true
- **证据**: evidence/D1-39/stdout.log

## #2【P0】D4-2 凭证 env 打印拦截不完整

- **用例ID**: D4-2
- **描述**: 安全策略 classifyTextCommand() 对凭证环境变量打印命令的拦截不完整。仅 printenv HUAWEICLOUD_SDK_AK 被拦截，echo $HUAWEICLOUD_SDK_SK、echo %HUAWEICLOUD_SDK_AK%、printenv HW_SDK_AK 等变体均返回 allow。
- **断言**: 所有读取/打印华为云凭证环境变量的命令应返回 deny
- **实际**: echo $HUAWEICLOUD_SDK_SK 返回 allow
- **根因**: plugins/huaweicloud-core/src/safety-policy.mjs — env-dump 检测逻辑仅匹配 printenv 前缀，不覆盖 echo $VAR / echo %VAR% 模式
- **修复建议**: 扩展 env-dump 正则，覆盖 echo + 凭证变量名模式
- **证据**: evidence/D4-2/stdout.log

## #3【P0】D4-3 明文 secret API 未拦截

- **用例ID**: D4-3
- **描述**: 安全策略将 hcloud CSMS show-secret 和 hcloud KMS list-keys --show-key-material 分类为 read-only/allow，未拦截明文 secret 返回操作。
- **断言**: hcloud CSMS show-secret --secret_id=xxx 应返回 deny
- **实际**: 返回 allow（read-only）
- **根因**: plugins/huaweicloud-core/src/safety-policy.mjs — classifyHcloudArgs() 将 CSMS show-secret 归类为 read-only
- **修复建议**: 在安全策略中添加 CSMS show-secret / KMS --show-key-material 为 deny 规则
- **证据**: evidence/D4-3/stdout.log

## #4【P0】D4-15 引号包裹命令绕过

- **用例ID**: D4-15
- **描述**: 安全策略对引号包裹的 hcloud 命令检测失败。hcloud "ECS delete-server" --server_id=12345 返回 allow。
- **断言**: hcloud "ECS delete-server" --server_id=12345 应返回 deny
- **实际**: 返回 allow
- **根因**: plugins/huaweicloud-core/src/safety-policy.mjs — classifyTextCommand() 引号内 ECS delete-server 未被正确解析
- **修复建议**: 在命令解析前去除引号/转义字符
- **证据**: evidence/D4-15/stdout.log

## #5【P0】D4-16 命令包裹穿透

- **用例ID**: D4-16
- **描述**: 安全策略对 shell wrapper 包裹的 hcloud 命令检测失败。sh -c / bash -c / cmd /c / powershell -Command / eval / $() 包裹的 hcloud 写操作均返回 allow。
- **断言**: sh -c "hcloud ECS delete-server --server_id=12345" 应返回 deny
- **实际**: 返回 allow
- **根因**: plugins/huaweicloud-core/src/safety-policy.mjs — classifyTextCommand() 未递归解析 shell wrapper 内层命令
- **修复建议**: 添加 shell wrapper 解析逻辑，提取内层命令后重新分类
- **证据**: evidence/D4-16/stdout.log