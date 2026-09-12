# CodeArtsAgent 每日测试执行报告

- 客户端：CodeArtsAgent（codearts CLI）
- 操作系统：Linux
- 模型：deepseek-v4-pro-0813
- 被测版本：huaweicloud-devkit@1.1.4-next.3（源码 commit 3b6290b）
- 执行日期：2026-09-13

## 一、概述

本日按「每日测试执行指南」0→6 步完成环境准备与核心用例执行。聚焦 P0（安全/凭证/升级链）与高价值 P1（认证/功能）用例的真实黑盒验证；对依赖 Windows/真机/harness/真云资源的用例如实标记 BLOCKED，对未展开执行的矩阵用例标记 NOT_RUN。共发现 2 项产品缺陷/契约漂移（均为 P0 安全用例）。

## 二、执行结果

| 用例集 | 总数 | PASS | FAIL | SPEC-MISMATCH | BLOCKED | NOT_RUN |
|---|---|---|---|---|---|---|
| 设计级 | 163 | 28 | 1 | 1 | 30 | 103 |
| 展开级 | 137 | 2 | 0 | 0 | 32 | 103 |
| 追踪表 | 169 | 28 | 1 | 1 | 30 | 109 |

设计级 P0 用例执行情况：18 条 P0 中，10 条在本环境真实执行（7 PASS / 1 FAIL / 2 其余），
8 条因环境（Windows / harness / 真云审批流）阻塞标记 BLOCKED。

主要 PASS 范围：
- D4 安全 hook 三工具（command/artifacts/deploy_plan）对凭证文件读取、凭证 env 打印、明文 secret、公开端口、破坏性强删、宽泛 IAM 策略、公网无鉴权 FunctionGraph 等均正确拦截。
- D2 认证：auth_status 判定、show_profile_redacted 脱敏、auth_switch R2 冲突仲裁闭环。
- D3 功能：list_operations（ECS 117 规范操作名）、detect_framework（React/Next/Vue/VitePress 识别）、search_docs、get_service_icon（中英文名）、get_regional_availability、service_catalog 路由。
- D1 升级链：check_update 真实 MCP 四态契约、upgrade 无更新语义（均已注册到 tools/list）。
- D5/D9 协议：tools/list 39 工具全部含 inputSchema，工具全量枚举。

## 三、缺陷清单

### #1【FAIL】hook 命令绕过 — 破坏性操作经 shell 命令替换 + ANSI-C quoting 被放行
- 用例：D4-15（P0）hook 绕过尝试（预期「无绕过成功」）
- 现象：`hcloud $(echo $'E\x43S DeleteServer') --id x` 被 `huaweicloud_hook_check_command` 判为 `decision=allow`（findings 空），而该命令实际在 shell 展开后等价于 `hcloud ECS DeleteServer --id x`（破坏性删除）。
- 根因：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:50-53` `conditionMatches()` 使用纯正则 `new RegExp(condition.regex,'ims').test(...)` 做文本匹配，不做 shell 语法解析/命令替换展开；`safety/rules/cloud-risk-rules.json` 中 `hwc-destructive-delete-operation` 规则正则为 `hcloud\s+\w+\s+(\w*Delete\w*)\b`（严格三段式），`$()` 命令替换与 `$'\x43'`（=C）编码破坏了 `hcloud <service> <op>` 匹配，导致 allow。
- 同类敞口：`hwc-command-encode-shell-exec` 覆盖 base64 编码，但不覆盖 `$()` 命令替换、`$(echo ...)` 拼接、ANSI-C quoting 等混淆手段。
- 证据：`evidence/D4-15/stdout.log`

### #2【SPEC-MISMATCH】hook 畸形输入 fail-open（非 fail-closed）
- 用例：D4-17（P1）hook 模糊 fail-closed（预期「异常输入默认拒绝」）
- 现象：畸形 JSON artifact（`{not-valid-json!!!`）与畸形 deploy_plan（嵌套 `{{{{`）分别被 `hook_check_artifacts` / `hook_check_deploy_plan` 判为 `decision=allow`，未按 fail-closed 语义拒绝。
- 根因：`plugins/huaweicloud-core/src/risk-rule-engine.mjs:79-108` `evaluate()` 对无法匹配任何规则的输入直接返回 `decision:'allow'`，缺省放行，无 fail-closed 兜底。
- 证据：`evidence/D4-17/stdout.log`

## 四、阻塞项

- Windows 专属用例（D1-13 文件锁、D1-39 升级检测链 EINVAL、D5-6、D7-3 better-sqlite3、回调相关）：Linux 环境无法复现，共 30 余条。
- 真云 E2E（D3-C1 起 ECS/OBS/沙箱/服务创建/跨区域/企业项目/资源状态）：需最小配置创建→测后删除归零，单次 run 无人工审批无法安全闭环。
- D10 评测集（EXP-E01~15）：promptfoo 评测 harness 基建未就绪。
- 非 TTY 审批流（D4-18/19/20/24 confirm-not-deny 语义）：无交互 PTY，审批闭环无法完整执行。
- voucher_status（D3-B8）：测试环境缺 domain_id，返回 claimed=false 但无法完成真实领取状态查询。
- 其余客户端矩阵（OpenCode/Codex/CodeArtsWork/WorkBuddy/DSH/OfficeAce/Hermes/OpenClaw/AtomCode）：非本代理职责，由各自客户端执行。

## 五、资源清理声明

- 本日未创建任何真云资源（ECS/OBS/沙箱等均未落地），无资源残留。
- 凭证文件在 D2-14 冲突仲裁测试前已备份（/tmp/cred-backup），测试后通过 `auth_confirm(decision=s1)` 恢复 S1 现有账号，未覆盖真实凭证。
- detect_framework 仅在 /tmp 下用轻量 package.json/配置文件 fixture，未改动源码仓库。
- 仅新增/修改 `results/CodeArtsAgent/` 目录下本次执行包，未触碰 Summary、其他客户端目录、test-cases 真源。
