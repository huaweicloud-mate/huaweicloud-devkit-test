# FINDINGS

> 本文件为 file_issue.py 的解析输入。每个 FINDING 必须包含：级别 + 描述(现象) + 断言(唯一可判定) + 根因(文件:行号) + 证据。

---

## FINDING-1

- **级别**: P0
- **用例ID**: D1-39
- **描述**: Windows 平台 queryDistTagsSync() 调用 spawnSync('npm.cmd', ...) 产生 EINVAL 错误，导致升级检测链完全失效。函数静默返回 null，用户无法收到任何版本更新提醒。
- **断言**: queryDistTagsSync() 在 Windows 上应返回 {latest: string, next: string} 非-null 对象，不得返回 null
- **实际**: 返回 null，spawnSync error.code === 'EINVAL'
- **根因**: plugins/huaweicloud-core/src/update-check.mjs:238 — spawnSync(NPM_BIN, [...], {encoding, timeout, windowsHide, cwd}) 缺少 shell: true 选项。Windows 上 npm.cmd 是批处理文件，必须通过 shell 执行。
- **修复建议**: 在 spawnSync 选项中添加 shell: true，或改用 process.execPath 直接调用 node + npm 模块。
- **证据**: evidence/D1-39/stdout.log (含 EINVAL 复现 + shell:true 对照测试)

---

## FINDING-2

- **级别**: P0
- **用例ID**: D4-2
- **描述**: 安全策略 classifyTextCommand() 对凭证环境变量打印命令的拦截不完整。仅 printenv HUAWEICLOUD_SDK_AK 被拦截，echo $HUAWEICLOUD_SDK_SK、echo %HUAWEICLOUD_SDK_AK%、printenv HW_SDK_AK 等变体均返回 allow。
- **断言**: 所有读取/打印华为云凭证环境变量的命令（printenv/echo/set/env + HUAWEICLOUD_*/HW_*/HCLOUD_* 变量名）应返回 deny
- **实际**: echo $HUAWEICLOUD_SDK_SK 返回 allow（"No Huawei Cloud safety rule matched"）
- **根因**: plugins/huaweicloud-core/src/safety-policy.mjs — env-dump 检测逻辑仅匹配 printenv 前缀，不覆盖 echo $VAR / echo %VAR% / env | grep 模式
- **修复建议**: 扩展 env-dump 正则，覆盖 echo + 凭证变量名模式、env/set + grep 模式。
- **证据**: evidence/D4-2/stdout.log

---

## FINDING-3

- **级别**: P0
- **用例ID**: D4-3
- **描述**: 安全策略将 hcloud CSMS show-secret 和 hcloud KMS list-keys --show-key-material 分类为 read-only/allow，未拦截明文 secret 返回操作。
- **断言**: hcloud CSMS show-secret --secret_id=xxx 和 hcloud KMS list-keys --show-key-material 应返回 deny
- **实际**: 返回 allow（"Command appears to be a read-only Huawei Cloud operation"）
- **根因**: plugins/huaweicloud-core/src/safety-policy.mjs — classifyHcloudArgs() 将 CSMS show-secret 归类为 read-only，未识别其返回明文 secret 的安全风险
- **修复建议**: 在安全策略中添加 CSMS show-secret / KMS --show-key-material 为 deny 规则。
- **证据**: evidence/D4-3/stdout.log

---

## FINDING-4

- **级别**: P0
- **用例ID**: D4-15
- **描述**: 安全策略 classifyTextCommand() 对引号包裹的 hcloud 命令检测失败。hcloud "ECS delete-server" --server_id=12345 返回 allow，引号内的写操作未被识别。
- **断言**: hcloud "ECS delete-server" --server_id=12345 应返回 deny
- **实际**: 返回 allow（"Command does not match a known write or secret operation"）
- **根因**: plugins/huaweicloud-core/src/safety-policy.mjs — classifyTextCommand() 在解析命令时未去除引号，导致 "ECS delete-server" 无法匹配 ECS delete-server 写操作模式
- **修复建议**: 在命令解析前去除引号/转义字符。
- **证据**: evidence/D4-15/stdout.log

---

## FINDING-5

- **级别**: P0
- **用例ID**: D4-16
- **描述**: 安全策略 classifyTextCommand() 对 shell wrapper 包裹的 hcloud 命令检测失败。sh -c / bash -c / cmd /c / powershell -Command / eval / $() 包裹的 hcloud 写操作均返回 allow。
- **断言**: sh -c "hcloud ECS delete-server --server_id=12345" 应返回 deny
- **实际**: 返回 allow（"No Huawei Cloud safety rule matched"）
- **根因**: plugins/huaweicloud-core/src/safety-policy.mjs — classifyTextCommand() 未递归解析 sh -c / bash -c / cmd /c / eval / $() 等 shell wrapper 内层命令
- **修复建议**: 添加 shell wrapper 解析逻辑，提取内层命令后重新分类。
- **证据**: evidence/D4-16/stdout.log