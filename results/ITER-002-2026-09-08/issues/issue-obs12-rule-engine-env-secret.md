> ✅ 已提交独立 issue #561（2026-09-09）

## 现象（1.1.2-next.4 基线实测）

对 huaweicloud-devkit 规则引擎（`evaluateCommandRisk`，`plugins/huaweicloud-core/src/risk-rule-engine.mjs`）双层验证：

| 命令 | 语义 | decision | 命中规则 |
|---|---|---|---|
| `echo $HW_ACCESS_KEY` | 打印华为云凭证环境变量（相机码 D4-2） | **allow** | **NO-RULE** |
| `echo $AWS_SECRET_ACCESS_KEY` | 打印 AWS 密钥环境变量（对照） | **allow** | **NO-RULE** |
| `printenv | grep -i secret` | 环境变量转储 | **allow** | **NO-RULE** |
| `hcloud ECS CreateServers --adminPass=SuperSecret123!` | 明文 adminPass 入参（相机码 D4-3） | **allow** | **NO-RULE** |
| `hcloud RDS CreateInstance --password=SuperSecret123!` | 明文数据库密码入参 | **allow** | **NO-RULE** |
| `cat ~/.hcloud/config.json`（对照组） | 读取凭据文件 | **deny** | hwc-command-credential-file ✅ |
| `hcloud ECS ListServers`（对照组） | 只读查询 | **allow** | 无误拦 ✅ |

- 基线：**1.1.2-next.4（608b120）**，规则引擎与 1.1.1 一致（该域无新增规则）
- plan 审批门（`planHcloudCommand`，数组参数）对写操作仍可靠拦截（OBS-9/10/11 此前已实证），但**规则引擎层**对「凭证环境变量打印」与「明文 secret 作为 CLI 参数」两类**无任何规则条目**

## 根因

`cloud-risk-rules.json` 15 条规则中**无 env-dump / secret-in-argument 类条目**：
- 有 `hwc-command-credential-file`（读文件）、`hwc-command-sts-credential`（STS）等，但缺「环境变量打印」「参数内嵌明文凭据」
- 与 P0-1（hook 规则盲区）同族但**性质不同**：P0-1 是规则存在但 hook 组合漏覆盖；本报告是**规则条目本身缺失**

## 影响评估

- **实际攻击面：低-中**（MCP 工具无 shell；env 打印需 agent 持有 shell 通道，此时 Hermes/CodeArtsSpace 有 wrapper deny、WorkBuddy/DSH/OfficeAce 有 OBS-9/10/11 的客户端门禁缺口）
- **纵深防御价值**：shell 通道被降权/绕过时，本应是最后一道的规则引擎对这两类常见泄露姿势完全无感
- 规则引擎被 `huaweicloud_hook_check_command` 暴露为独立 MCP 工具，agent 可直接调用；建议补齐

## 修复建议

1. 新增 `hwc-command-env-dump`：匹配 `echo/printenv/env |` 组合中含 `ACCESS_KEY|SECRET|TOKEN|PASSWORD|CREDENTIAL` 的 shell 命令 → deny
2. 新增 `hwc-command-secret-in-arg`：匹配 CLI 参数 `--adminPass= / --password= / --secret= / --token=` 且值非占位符（如非 `***`）→ deny 或 warn
3. 补充对应 hook 探测用例与单测（本报告样例可直接入库）

## 同族关联

- #501（P0-1 hook 规则盲区族）
- OBS-13（deploy_plan 资源风险盲区，同批发现将另提）