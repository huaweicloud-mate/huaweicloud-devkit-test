# 历史问题关联清单（不重复提单）

> 生成说明：2026-10-24 Hermes Linux（v1.1.12，gitHead 4ed07801）16 项缺陷经 `file_issue.py` 查重命中上游仓 `huaweicloud/huaweicloud-devkit` 历史 issue，本次**不新开单**。较 v1.1.10 版本升级 1.1.11→1.1.12 后，缺陷全部稳定复现。

## D2-4【P0】凭证脱敏正确性——JSON 小写 ak/sk 键未脱敏
- 今日证据：`evidence/D2-4/stdout.log`
- 关联历史单（已作为缺陷提过）：
  - [#809](https://github.com/huaweicloud/huaweicloud-devkit/issues/809)（open）**redactSecrets 对 Authorization: Bearer *** 脱敏不完整**
  - [#791](https://github.com/huaweicloud/huaweicloud-devkit/issues/791)（open）**refactor: redact 设计重构——统一键名策略与脱敏路径**

## D9-12【P0】initialize 握手协议安全基线——非法时序未拒绝
- 今日证据：`evidence/D9-12/stdout.log`
- 关联历史单：
  - [#844](https://github.com/huaweicloud/huaweicloud-devkit/issues/844)（open）**1.1.8-next.1 每日测试缺陷合并单（Hermes Linux 2026-10-02，6 项）**
  - [#814](https://github.com/huaweicloud/huaweicloud-devkit/issues/814)（open）**v1.1.7 每日测试缺陷合并单（1 项）**

## D4-4【P1】写操作审批门——Change* 变更类动词漏拦截
- 今日证据：`evidence/D4-4/stdout.log`
- 关联历史单：
  - [#845](https://github.com/huaweicloud/huaweicloud-devkit/issues/845)（open）**safety-policy 安全检测覆盖不足 + serviceCatalog 中文路由缺失**
  - [#864](https://github.com/huaweicloud/huaweicloud-devkit/issues/864)（open）**CodeArtsSpace-GLM-5.2 Windows 2026-10-09 daily 缺陷合并单（8 项）**

## D3-C1【P1】真云 ECS 生命周期 E2E——异步删除未归零致资源泄漏
- 今日证据：`evidence/D3-C1/stdout.log`（今日配额已恢复，建删走通；finally 归零校验失败，ECS/subnet/VPC 泄漏已人工补删归零）
- 关联历史单：
  - [#896](https://github.com/huaweicloud/huaweicloud-devkit/issues/896)（open）**CodeArtsSpace Windows 2026-10-13 daily（含真云清理）**
  - 正文另有提及 #828（v1.1.7 版本全量测试缺陷合并单）

## D3-C3【P1】沙箱 deploy_nginx——端口冲突自动递增后 ok=false（假失败）
- 今日证据：`evidence/D3-C3/stdout.log`
- 关联历史单：
  - [#951](https://github.com/huaweicloud/huaweicloud-devkit/issues/951)（open）**沙箱 deploy_nginx 部署残留 .conf 未清理，多轮后耗尽 8080-8089 端口**
  - [#981](https://github.com/huaweicloud/huaweicloud-devkit/issues/981)（open）**1.1.10 每日测试缺陷合并单（1 项新回归）**

## D3-C7【P1】跨区域资源操作引导——跨区错误码与契约不符
- 今日证据：`evidence/D3-C7/stdout.log`
- 关联历史单：
  - [#977](https://github.com/huaweicloud/huaweicloud-devkit/issues/977)（open）**1.1.10 每日测试缺陷合并单（1 项）**

## D3-S1【P1】场景-只读查 ECS——serviceCatalog 中文「云主机」路由 MISS
- 今日证据：`evidence/D3-S1/stdout.log`
- 关联历史单：
  - [#852](https://github.com/huaweicloud/huaweicloud-devkit/issues/852)（open）**serviceCatalog 中文意图路由覆盖不足（11/14 MISS, 21.4% HIT）- Hermes Windows 2026-10-05**
  - [#844](https://github.com/huaweicloud/huaweicloud-devkit/issues/844)（open）**1.1.8-next.1 每日测试缺陷合并单（Hermes Linux 2026-10-02，6 项）**

## D10-3【P1】路由准确率+混淆矩阵——1 条中文意图 MISS
- 今日证据：`evidence/D10-3/stdout.log`（HIT=13 MISS=1 N/A=1，准确率 92.9%）
- 关联历史单：
  - [#852](https://github.com/huaweicloud/huaweicloud-devkit/issues/852)（open）**serviceCatalog 中文意图路由覆盖不足**
  - [#705](https://github.com/huaweicloud/huaweicloud-devkit/issues/705)（open）**serviceCatalog 中文意图路由准确率仅 21.4%（3/14 HIT）**

## EXP-E01【P1】评测集『云主机』中文意图路由 MISS
- 今日证据：`evidence/EXP-E01/stdout.log`
- 关联历史单：
  - [#852](https://github.com/huaweicloud/huaweicloud-devkit/issues/852)（open）**serviceCatalog 中文意图路由覆盖不足**
  - [#705](https://github.com/huaweicloud/huaweicloud-devkit/issues/705)（open）**serviceCatalog 中文意图路由准确率仅 21.4%**

## D3-S5【P2】场景-复合意图分层路由——仅命中单一服务
- 今日证据：`evidence/D3-S5/stdout.log`
- 关联历史单：
  - [#788](https://github.com/huaweicloud/huaweicloud-devkit/issues/788)（open）**D3-S5 复合意图分层路由未拆分命中（拆分自 #786）**

## D4-25【P2】Python hook 事件遥测分类——写操作落 cli:invoke
- 今日证据：`evidence/D4-25/stdout.log`
- 关联历史单：
  - [#844](https://github.com/huaweicloud/huaweicloud-devkit/issues/844)（open）**1.1.8-next.1 每日测试缺陷合并单（Hermes Linux 2026-10-02，6 项）**

## D4-26【P2】findings 证据脱敏不完整
- 今日证据：`evidence/D4-26/stdout.log`
- 关联历史单：
  - [#809](https://github.com/huaweicloud/huaweicloud-devkit/issues/809)（open）**redactSecrets 对 Authorization: Bearer *** 脱敏不完整**

## D1-65【P2】调试模式环境变量——DEBUG 仅认字面量 'true'（SPEC）
- 今日证据：`evidence/D1-65/stdout.log`
- 关联历史单：
  - [#994](https://github.com/huaweicloud/huaweicloud-devkit/issues/994)（open）**1.1.10 每日测试缺陷合并单（2 项）——含「调试模式环境变量」**
  - [#844](https://github.com/huaweicloud/huaweicloud-devkit/issues/844)（open）**1.1.8-next.1 每日测试缺陷合并单（Hermes Linux 2026-10-02，6 项）**

## D1-66【P2】遥测开关与端点环境变量——开关/自定义端点不生效
- 今日证据：`evidence/D1-66/stdout.log`
- 关联历史单（file_issue.py 关键词未命中、手工核对确认）：
  - [#994](https://github.com/huaweicloud/huaweicloud-devkit/issues/994)（open）**1.1.10 每日测试缺陷合并单（2 项）——正文含「遥测开关与端点环境变量」**
  - [#868](https://github.com/huaweicloud/huaweicloud-devkit/issues/868)（open）**1.1.8-next.1 每日测试缺陷合并单（2 项）**

## D1-68【P2】region 环境变量优先级与契约相反（SPEC-MISMATCH）
- 今日证据：`evidence/D1-68/stdout.log`
- 关联历史单：
  - [#844](https://github.com/huaweicloud/huaweicloud-devkit/issues/844)（open）**1.1.8-next.1 每日测试缺陷合并单（Hermes Linux 2026-10-02，6 项）**
  - [#765](https://github.com/huaweicloud/huaweicloud-devkit/issues/765)（open）**v1.1.5 每日测试缺陷合并单（1 项）**

## D8-9【P2】sanitizeValue 未做凭证脱敏（SPEC-MISMATCH）
- 今日证据：`evidence/D8-9/stdout.log`
- 关联历史单：
  - [#980](https://github.com/huaweicloud/huaweicloud-devkit/issues/980)（open）**telemetry sanitizeValue 未脱敏 AK/SK/token（D8-9，连续 3 个版本复现）**