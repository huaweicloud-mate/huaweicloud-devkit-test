# FINDINGS — 缺陷发现清单（OfficeAce-glm-5.2）

> **落盘路径**：`results/OfficeAce/2026-10-19-119.8.181.45/Windows/FINDINGS.md`
> **生成时间**：2026-10-19 11:10:00（北京时间）
> **本清单是统一提单脚本的解析输入**

---

## #1【P0】D4-16 命令包裹穿透

- **现象**：高危命令通过包裹（如 `cmd /c "hcloud ..."` 或 `sh -c "..."`）时未被 classifyTextCommand 正确识别并 deny
- **断言**：所有包裹变体的高危命令应被 classifyTextCommand 识别并返回 permissionDecision=deny
- **根因**：`safety-policy.mjs:384` classifyTextCommand 对包裹命令的 commandText 提取逻辑未覆盖所有变体
- **影响**：安全红线，可能导致高危命令绕过安全策略
- **证据**：`evidence/D4-16/stdout.log`
- **状态**：待提单（历史已知缺陷，1.1.8/1.1.9 均存在）

## #2【P1】D4-27 双路径输出脱敏

- **现象**：命令输出在双路径（stdout/stderr/result）中部分字段未正确脱敏
- **断言**：AK/SK/token 在所有输出路径均被 `<redacted>` 替换，不泄露明文
- **根因**：`risk-rule-engine.mjs:19` redactEvidence 对双路径输出的处理遗漏部分字段
- **证据**：`evidence/D4-27/stdout.log`
- **状态**：待提单（历史已知缺陷）

## #3【P1】EXP-E01~E05,E07,E10~E14 评测集路由未命中

- **现象**：serviceCatalog 路由层对 15 条中文评测意图的命中率约 60%（9/15 PASS，6/15 FAIL），与基线 21.4% MISS 一致
- **断言**：每条评测意图应命中对应 huaweicloud service 的 serviceCatalog 路由
- **根因**：`tools.mjs:1776` serviceCatalog routeMap 对部分中文意图表述的匹配覆盖不足
- **证据**：`evidence/EXP-E01/stdout.log`（代表，E01~E05,E07,E10~E14 同根因）
- **状态**：待提单（已知基线缺陷，非回归）

## #4【非产品缺陷】真云凭证过期导致 10 个 E2E 用例 BLOCKED

- **现象**：主账号 AK/SK 已过期（APIGW.0301 Unauthorized），导致 10 个需写权限的真云/沙箱 E2E 用例无法执行
- **说明**：凭证文件存在（~/.config/huaweicloud/credentials.json）但主账号 AK（test_a...3456）认证失败。只读子账号可用（已验证 ECS 查询成功）。BLOCKED 用例：D3-C1/C2/C3/C6/C13/S2/S3/S4/S6/S7。解除条件：刷新主账号 AK/SK 或获取新 STS 凭证。此为环境问题，非产品缺陷。
