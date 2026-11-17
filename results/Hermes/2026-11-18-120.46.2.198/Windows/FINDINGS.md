# FINDINGS — 缺陷发现清单（Hermes-DeepSeek-V4-Pro）

> **落盘路径**：`results/Hermes/2026-11-18-120.46.2.198/Windows/FINDINGS.md`
> **生成时间**：2026-11-18（北京时间）
> **被测版本**：huaweicloud-devkit@1.1.14（npm latest 正式版）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py`。

---

## #1【P1】EXP-E01/D10-3 服务路由「帮我查云主机」未命中 ECS

- **现象**：逐条经 `tools.callTool('huaweicloud_service_catalog', {intent})` 实测 15 条评测集，EXP-E01「帮我查一下我账号在华北北京四有哪些云主机」路由返回 `recommendedServices: ["Run hcloud --help to list available services."]`（MISS）；其余 13 HIT + EXP-E08 诊断类 N/A。路由准确率 92.9%（13/14），D10-3 达 90% 阈值但 EXP-E01 单条未命中。
- **断言**：「查云主机」意图应路由到 `ECS`，实际未命中。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2368-2373` serviceCatalog() 的 ECS 关键词表含「vm/instance/compute/弹性云服务器/云服务器/服务器/虚拟机/镜像」，缺少中文同义别名「云主机」。
- **影响**：中文口语化「云主机」查询被路由层 MISS，需二次澄清，降低一次命中率。
- **证据**：`evidence/EXP-E01/`、`evidence/D10-3/`

## #2【P1】D3-C2/D3-C13 OBS 静态网站托管配置返回 403 InvalidAccessKeyId

- **现象**：`huaweicloud_obs_set_website_config` set/get 返回 `{ok:false, status:403}`，body 含 `<Error><Code>InvalidAccessKeyId</Code><Message>The security token is invalid.</Message>`；空桶 `hcloud obs rm` 报「Warn: No task to run」无法删桶（`hcloud obs` 无 rb 命令），本轮已用签名 DELETE（204）手工归零。
- **断言**：OBS website 配置应返回 200/成功；实际 403（security token 拒签）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:3204` signedHeaders 固定为 `host;x-amz-content-sha256;x-amz-date`，未纳入 `x-amz-security-token`；而 `tools.mjs:3241` 在凭据含 STS securityToken 时仍向 headers 添加 `x-amz-security-token` → OBS 侧 AWS4 签名校验失败（403 InvalidAccessKeyId）。
- **影响**：OBS 静态站托管能力不可用；空桶无法经 CLI 删除造成资源泄漏风险。
- **证据**：`evidence/D3-C2/`、`evidence/D3-C13/`

## #3【P0】D10-4 风险规则数漂移 19 vs 文档 16

- **现象**：`loadRiskRules()` 返回 9 deny + 10 warn = 19 条，文档/用例断言为 9 deny + 7 warn = 16。
- **断言**：规则库条目数应匹配文档 16；实际 19（+3 warn）。
- **根因**：`plugins/huaweicloud-core/safety/rules/cloud-risk-rules.json` 规则演进（16→19），文档快照与用例预期未同步。
- **影响**：安全干预静态规则层快照与实现漂移。
- **证据**：`evidence/D10-4/`

## #4【P2】D8-9 sanitizeValue 未脱敏 AK/SK 明文

- **现象**：`sanitizeValue('AKID-abc\nSK-xyz password=hunter2')` 返回原文，AK/SK 未脱敏；`generateOrRecoverInstallId` 稳定（幂等）。
- **断言**：遥测值脱敏应移除 AK/SK 明文（安装 ID 稳定 + 遥测值脱敏）。
- **根因**：`plugins/huaweicloud-core/src/telemetry/telemetry.mjs:190` sanitizeValue 仅做 `[\r\n\t]` 去空白 + 长度截断 + trim，无 secret 明文脱敏逻辑。
- **影响**：遥测上报路径可能携带 AK/SK 明文（契约漂移）。
- **证据**：`evidence/D8-9/`

---

## 非产品缺陷（环境/测试侧，不提缺陷单）

以下为 BLOCKED，属真实外部依赖，均写四要素（实测时间 + 缺什么 + 影响 + 解除条件），fake 阻塞已逐条排除：

- **D3-C3 / D3-C14 / D3-S3**（沙箱部署 E2E / HDKit 服务参数 / 预览 URL）：需沙箱服务(hdkitservice)可连 + upload_project 完整链路。
- **D3-C6**（沙箱 7 隐式工具具名冒烟）：前置 `sandbox_check_user` 实测返回 `HDKIT_UPSTREAM_ERROR: 查询实名状态失败`（沙箱上游不可达）。
- **D3-C4**（服务创建类回归）：本轮已完成 VPC/子网真机建删归零 + 22 服务只读冒烟(EXP-C4 全 PASS)；逐服务计费资源(ECS/RDS/CCE/WAF)轻量建删待额度。
- **D3-S6**（FunctionGraph 定时任务）、**D3-S7**（跨服务 Web+RDS 交付）：需多服务计费资源建删。
- **D9-6**（跨客户端互通）：本机 Hermes 单客户端，无第二客户端会话跑互通夹具。