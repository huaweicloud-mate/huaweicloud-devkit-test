# FINDINGS — 缺陷发现清单（Hermes-DeepSeek-V4-Pro）

> **落盘路径**：`results/Hermes/2026-10-27-120.46.2.198/Windows/FINDINGS.md`
> **生成时间**：2026-10-27 10:31:00（北京时间）
> **本清单是统一提单脚本的解析输入**：`scripts/file_issue.py` 硬编码解析标题与「根因」字段，格式严格遵循。

---

## #1【P1】D3-C2 OBS 静态网站托管配置签名错误（x-amz-security-token 未纳入 SignedHeaders）

- **现象**：真云执行 `huaweicloud_obs_set_website_config` 配置/读取静态网站托管，返回 HTTP 400：`Request has x-amz-security-token header but signed headers not included`；建桶成功、删桶归零成功，仅 website 子资源请求失败。
- **断言**：`obs_set_website_config` 应能成功设置/读取静态网站托管，返回 200 且 websiteUrl 可访问。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:3071`——`obsSignedRequest()` 在 `creds.securityToken` 存在时把 `x-amz-security-token` 加入请求头（3071 行），但该头未纳入 `canonicalHeaders` / `signedHeaders`（3033-3034 行仅含 host/x-amz-content-sha256/x-amz-date），导致 AWS4 签名不覆盖该头，OBS 拒绝 400。
- **影响**：携带 securityToken 的场景下 OBS 静态网站托管（PUT/GET/DELETE /?website、/?cors）全部失败，功能不可用。
- **证据**：`evidence/D3-C2/stdout.log`（真云实测，建桶成功 + 删桶归零成功，website 配置失败）
- **状态**：历史待复核（#1025）

## #2【P1】EXP-E01 serviceCatalog 路由未命中「云主机」（ECS 关键词缺同义词）

- **现象**：评测意图「帮我查一下我账号在华北北京四有哪些云主机」路由结果为空，返回 `Run hcloud --help to list available services.`，未命中 ECS。
- **断言**：中文意图「云主机」应命中 ECS（expected=ECS）。
- **根因**：`plugins/huaweicloud-core/src/tools.mjs:2192-2205`——ECS routeMap 关键词表缺常用同义词「云主机」。
- **影响**：D10 评测集路由准确率受损（15 条中 1 MISS，准确率 92.9%），覆盖「云主机」这一高频用户表达。
- **证据**：`evidence/EXP-E01/stdout.log`（MCP 真实路由，HIT=13 MISS=1 N/A=1）
- **状态**：历史待复核（#896）

## #3【测试侧】D3-C1 ECS 异步删除超过 150s 轮询窗口，归零校验误报残留

- **现象**：真云 E2E CreateVpc/CreateSubnet/CreateServers 均成功，删除已提交，但 `scripts/realcloud_e2e.mjs` 轮询 15×10s=150s 后 ECS 仍 ACTIVE，`finally 归零` 误报「仍在/未确认」（已手动二次删除并确认 ECS/VPC/subnet 归零）。
- **断言**：插件引导全程完成，无残留（ECS/VPC/subnet 最终归零）。
- **说明**：属测试编排问题，非 huaweicloud-devkit 产品缺陷。华为云 ECS 删除为异步，可超 150s；`realcloud_e2e.mjs` 轮询窗口不足，需延长轮询或改轮询 ListServersDetails 直到 count=0。
- **证据**：`evidence/D3-C1/stdout.log`（已手动归零确认）
- **状态**：记录（不计入提单）