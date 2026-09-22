# HISTORY_LINKS — 历史问题关联清单

> **客户端**：CodeArtsWork-GLM-5.2
> **日期**：2026-09-22
> **说明**：本次 FINDINGS.md 中 12 项缺陷经历史查重，均命中已有 open issue，不重复开单。

---

## 关联清单

| # | 本轮用例ID | 历史单号 | 历史标题 | 状态 | 匹配说明 |
|---|---|---|---|---|---|
| 1 | D10-3 | #705 | [serviceCatalog] 中文意图路由准确率仅 21.4%（3/14 HIT），中文关键词覆盖严重不足 | open | 路由准确率 21.4% 完全一致 |
| 2 | EXP-E01 | #705 | 同上 | open | ECS查询意图"帮我查一下我账号在华北北京四有哪些云主机" MISS |
| 3 | EXP-E02 | #705 | 同上 | open | ECS创建意图"创建一台 2C4G 的 Ubuntu 云服务器" MISS |
| 4 | EXP-E03 | #705 | 同上 | open | OBS静态站意图路由到 Sandbox 而非 OBS |
| 5 | EXP-E04 | #705 | 同上 | open | EIP意图"给这台服务器绑定一个弹性公网IP" MISS |
| 6 | EXP-E05 | #705 | 同上 | open | RDS查询意图"看一下我的云数据库MySQL实例的状态" MISS |
| 7 | EXP-E07 | #705 | 同上 | open | CBR意图"给生产环境的服务器配置一个每日备份策略" MISS |
| 8 | EXP-E10 | #705 | 同上 | open | FunctionGraph意图"部署一个函数处理图片自动压缩" MISS |
| 9 | EXP-E11 | #705 | 同上 | open | BSS费用查询意图"查一下我账号这个月的费用情况" MISS |
| 10 | EXP-E12 | #705 | 同上 | open | CES意图"把应用日志指标推送到云监控告警" MISS |
| 11 | EXP-E13 | #705 | 同上 | open | ELB证书意图"申请HTTPS证书并配置到我的域名" MISS |
| 12 | EXP-E14 | #705 | 同上 | open | IAM审计意图"我账号下的用户都有哪些权限, 帮我审计一下" MISS |

## 相关 issue

- **#705** (open): 主缺陷 — serviceCatalog 中文意图路由准确率 21.4%
- **#789** (open): feat: expand serviceCatalog routeMap for Chinese compound intent splitting and phased routing（修复方案）
- **#788** (open): D3-S5 复合意图分层路由未拆分命中（拆分自 #786）

## 复核结论

v1.1.6-next.1（gitHead 10e52432）上复测确认：issue #705 描述的 21.4% 路由准确率问题**仍然存在**，11 条中文意图仍未命中。已在 #705 补复核评论。
