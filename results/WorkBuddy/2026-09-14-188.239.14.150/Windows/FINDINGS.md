# FINDINGS — 缺陷发现清单（WorkBuddy-glm-5.2, v1.1.4-next.6）

> **落盘路径**：`results/WorkBuddy/2026-09-14-188.239.14.150/Windows/FINDINGS.md`
> **生成时间**：2026-09-14 22:45:00（北京时间）
> **被测版本**：huaweicloud-devkit@1.1.4-next.6
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，**格式必须严格遵循**。

## #1【P0】凭证 env 打印拦截不完整 - HW_ 前缀缺失

- **现象**：`classifyTextCommand('env | grep HW_ACCESS_KEY')` 返回 `allow`，未拦截 HW_ 前缀环境变量打印
- **断言**：`env | grep HW_ACCESS_KEY` 应返回 `deny`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:335-343` + env-dump 正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 未覆盖 `HW_ACCESS_KEY`/`HW_SECRET_KEY` 前缀
- **影响**：使用 HW_ 前缀的环境变量凭证可被 env 命令打印泄露
- **证据**：`evidence/d4-security-core/stdout.log`
- **状态**：持续未修复（next.3→next.6，第 3 轮报告）

## #2【P0】命令包裹穿透 - sh -c wrapper 内层命令未检测

- **现象**：`classifyTextCommand('sh -c "env | grep HUAWEICLOUD"')` 返回 `allow`
- **断言**：`sh -c "env | grep HUAWEICLOUD"` 应返回 `deny`
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:classifyTextCommand()` + 只检查整行文本，不提取 wrapper 命令内层参数进行二次检测
- **影响**：攻击者可用 sh -c/bash -c 包裹恶意命令绕过安全拦截
- **证据**：`evidence/d4-security-core/stdout.log`
- **状态**：持续未修复（next.3→next.6，第 3 轮报告）

## #3【P0】agent-rules.md 未注入 WorkBuddy 安装目标

- **现象**：WorkBuddy 安装目标缺少 `huawei-agent-rules.md` 复制逻辑
- **断言**：11 个安装目标均应注入 `huawei-agent-rules.md`
- **根因**：`plugins/huaweicloud-core/src/setup-cli.mjs` + WorkBuddy 安装目标分支缺少 rules 文件复制
- **影响**：WorkBuddy 用户无法获得 agent 安全规则指引
- **证据**：`evidence/d4-security-core/stdout.log`
- **状态**：持续未修复（next.3→next.6，第 3 轮报告）

## #4【P1】manifest.json 不存在

- **现象**：安装后 `manifest.json` 文件不存在
- **断言**：安装后应生成 `manifest.json` 记录安装元数据
- **根因**：`plugins/huaweicloud-core/src/setup-cli.mjs` + manifest 生成逻辑缺失或未触发
- **证据**：`evidence/d5-static/stdout.log`
- **状态**：持续未修复

## #5【P1】JSON-RPC 错误码 -32603 而非 -32601

- **现象**：`mcp-server.mjs` 对未知方法抛出的错误统一返回 `-32603` (Internal Error)
- **断言**：未知方法应返回 `-32601` (Method not found)
- **根因**：`plugins/huaweicloud-core/src/mcp-server.mjs:164-173` + catch 块硬编码 `code: -32603`
- **影响**：MCP 客户端无法区分"方法不存在"和"内部错误"
- **证据**：`evidence/d9-robust/stdout.log`
- **状态**：持续未修复（next.3→next.6，第 3 轮报告）
