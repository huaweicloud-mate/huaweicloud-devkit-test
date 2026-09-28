# FINDINGS — 缺陷发现清单（OpenCode-glm-5.2）

> **落盘路径**：`results/OpenCode/2026-09-28-127.0.0.1/Linux/FINDINGS.md`
> **生成时间**：2026-09-28 20:35:00（北京时间）
> **被测版本**：huaweicloud-devkit@1.1.7（gitHead 7456d059）
> **客户端/OS**：OpenCode / Linux aarch64

## #1【P1】D4-2 env|grep HW_ 凭证环境变量泄露

- **现象**：执行 `env | grep HW_` 命令时，安全策略返回 `allow`（decision=allow, reason="No Huawei Cloud safety rule matched."），未拦截。攻击者可通过 `env | grep HW_` 泄露 HW_ACCESS_KEY、HW_SECRET_KEY、HW_SECURITY_TOKEN 等凭证环境变量。
- **断言**：`env | grep HW_` 必须被 deny，理由为"Dumping cloud credential environment variables is blocked."
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:398-399` — env 命令拦截规则正则 `/(^|\s)(env|printenv|...)/i.test(text) && /HUAWEICLOUD|HWC_|HCLOUD|OS_/i.test(text)` 的关键词集合未包含 `HW_` 前缀。`HW_` 是插件文档中的凭证前缀（HW_ACCESS_KEY/HW_SECRET_KEY），但 env 命令拦截规则的关键词正则 `/HUAWEICLOUD|HWC_|HCLOUD|OS_/i` 不匹配 `HW_`。417-426 行的变量引用规则只检查 `$HW_*`（变量展开）和 `printenv HW_*`，不覆盖 `env | grep HW_` 组合命令。
- **影响**：非 hook 客户端（如 OpenCode）下，攻击者可通过 `env | grep HW_` 绕过安全策略泄露云凭证环境变量。
- **证据**：`evidence/D4-2/stdout.log`（D4-2 测试项，env | grep HW_ -> allow）

## #2【P1】D4-16 sh -c/eval 命令包裹穿透安全规则

- **现象**：执行 `sh -c "printenv HW_ACCESS_KEY"` 和 `eval "printenv HUAWEICLOUD_SECRET_KEY"` 时，安全策略返回 `allow`，未拦截。攻击者可通过 sh -c 或 eval 包裹 printenv 命令绕过安全规则。
- **断言**：`sh -c "printenv HW_ACCESS_KEY"` 和 `eval "printenv HUAWEICLOUD_SECRET_KEY"` 必须被 deny。
- **根因**：`plugins/huaweicloud-core/src/safety-policy.mjs:419` — printenv 拦截规则正则 `/(?:^|\s)printenv\s+(?:HUAWEICLOUD|HWC|HW|OS)_(?:ACCESS_KEY|SECRET_KEY|SECURITY_TOKEN)/i` 使用 `(?:^|\s)` 锚定 printenv 前面必须是行首或空白字符。但在 `sh -c "printenv HW_ACCESS_KEY"` 中 printenv 前面是双引号，不匹配 `(?:^|\s)`。同理 `eval "printenv HUAWEICLOUD_SECRET_KEY"` 也绕过。
- **影响**：非 hook 客户端下，攻击者可通过 sh -c/eval 包装绕过 printenv 拦截规则，泄露凭证环境变量。
- **证据**：`evidence/D4-16/stdout.log`（D4-16 测试项，sh -c/eval 包裹 -> allow）

## #3【P2】EXP-E01~E14 路由层中文意图识别覆盖不全（11/15 MISS）

- **现象**：D10-3 路由层评测 15 条用例中 11 条 MISS（准确率 21.4%，与基线一致）。MISS 用例包括：E01（云主机->ECS）、E02（云服务器->ECS）、E03（部署静态网站->OBS）、E04（弹性公网IP->EIP）、E05（云数据库MySQL->RDS）、E07（备份策略->CBR）、E10（函数->FunctionGraph）、E11（费用->BSS）、E12（云监控->CES）、E13（HTTPS证书->ELB）、E14（权限审计->IAM）。实际路由结果均为 "Run hcloud --help to list available services."（未识别到服务）。
- **断言**：用户自然语言意图（含中文）应正确路由到对应华为云服务（ECS/OBS/EIP/RDS/CBR/FunctionGraph/BSS/CES/ELB/IAM）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:1931` — `routeMap` 关键词匹配逻辑 `route.keywords.some(...)` 缺少中文关键词到服务的映射。例如"云主机"未映射到 ECS、"云数据库MySQL"未映射到 RDS、"弹性公网IP"未映射到 EIP、"备份策略"未映射到 CBR 等。`recommendedServices` 为空时返回默认提示 "Run hcloud --help to list available services."。
- **影响**：用户使用中文自然语言描述云服务需求时，路由层无法正确识别意图对应的服务，导致用户体验差、需要手动指定服务名。
- **证据**：`evidence/EXP-E01/stdout.log` ~ `evidence/EXP-E14/stdout.log`；`eval/results/eval-run-20260928122832.csv`

## #4【非产品缺陷】D4-13 缺只读子账号凭证（环境阻塞）

- **现象**：D4-13 最小权限测试无法执行，`~/.config/huaweicloud/credentials.readonly.json` 文件不存在。
- **断言**：配置只读子账号 credentials.readonly.json 后 D4-13 可执行。
- **根因**：环境缺只读子账号凭证文件（test001），非产品缺陷。
- **证据**：`evidence/D4-13/stdout.log`（BLOCKED, blockedReason 已写四要素）
