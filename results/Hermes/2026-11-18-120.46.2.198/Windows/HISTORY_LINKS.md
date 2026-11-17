# 历史问题关联清单（不重复提单）

> 生成说明：以下缺陷经查重命中上游仓已有历史 issue，本次**不新开单**。

## EXP-E01/D10-3 服务路由「帮我查云主机」未命中 ECS
- 今日证据：`evidence/EXP-E01/`、`evidence/D10-3/`
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#705](https://github.com/huaweicloud/huaweicloud-devkit/issues/705)（open）**[serviceCatalog] 中文意图路由准确率仅 21.4%（3/14 HIT），中文关键词覆盖严重不足** — 历史单内容含「帮我查云主机 → ECS 查询 → MISS，中文关键词覆盖不足」。
  - [#852](https://github.com/huaweicloud/huaweicloud-devkit/issues/852)（open）**[每日测试] serviceCatalog 中文意图路由覆盖不足（11/14 MISS, 21.4% HIT）**。
  - [#1065](https://github.com/huaweicloud/huaweicloud-devkit/issues/1065)（open）**缺陷合并单（8 项，含 v1 历史缺陷复现）**。
  - [#1055](https://github.com/huaweicloud/huaweicloud-devkit/issues/1055)（open）**v1.1.13-next.0 每日测试缺陷合并单（12 项）**。
  - 另 #844、#841、#797、#784、#785、#762、#714、#706、#689、#828、#826、#805、#730 等均在正文/标题提及 serviceCatalog「云主机」/EXP-E01 路由缺失的缺陷语义。
- **仅出现过（正文含用例号但非缺陷语义，未据此判历史）**：#1133, #846, #783, #774, #766, #680

## D3-C2/D3-C13 OBS 静态网站托管配置返回 403 InvalidAccessKeyId
- 今日证据：`evidence/D3-C2/`、`evidence/D3-C13/`
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#1025](https://github.com/huaweicloud/huaweicloud-devkit/issues/1025)（open）**v1.1.12 每日测试缺陷合并单（1 项）** — 历史单内容含「D3-C2 OBS 静态站托管 AWS4 签名缺 x-amz-security-token：set/get 均返回 400 InvalidArgument」。
  - [#939](https://github.com/huaweicloud/huaweicloud-devkit/issues/939)（open）**v1.1.9-next.0 每日测试缺陷合并单（9 项）**。

## D10-4 风险规则数漂移 19 vs 文档 16
- 今日证据：`evidence/D10-4/`
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#978](https://github.com/huaweicloud/huaweicloud-devkit/issues/978)（open）**子任务：D10-4 安全干预静态规则层规则数与设计契约对齐（P0）**。
  - [#976](https://github.com/huaweicloud/huaweicloud-devkit/issues/976)（open）**v1.1.10 每日测试缺陷合并单（2 项）** — 历史单内容含「D10-4 规则库 19 条(9 deny+10 warn) 与设计契约 16 条不匹配」。
- **仅出现过（正文含用例号但非缺陷语义，未据此判历史）**：#1133, #852, #761

## D8-9 sanitizeValue 未脱敏 AK/SK 明文
- 今日证据：`evidence/D8-9/`
- **关联历史单（已作为缺陷提过，本次为复核）**：
  - [#791](https://github.com/huaweicloud/huaweicloud-devkit/issues/791)（open）**refactor: redact 设计重构——统一键名策略与脱敏路径**。
  - [#1065](https://github.com/huaweicloud/huaweicloud-devkit/issues/1065)（open）**缺陷合并单（8 项，含 D8-9 sanitizeValue 脱敏）**。
  - [#1055](https://github.com/huaweicloud/huaweicloud-devkit/issues/1055)（open）**v1.1.13-next.0 每日测试缺陷合并单（12 项）**。
  - 另 #809、#694、#683、#681 等均在正文提及脱敏（redactSecrets/Bearer/AK-SK 明文残留）缺陷语义。
- **仅出现过（正文含用例号但非缺陷语义，未据此判历史）**：#1133, #926, #902, #852, #845, #839, #837, #804