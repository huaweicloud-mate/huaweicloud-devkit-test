> ✅ 已提交独立 issue #562（2026-09-09）

## 现象（1.1.2-next.4 基线实测）

对 `evaluateDeployPlan`（`plugins/huaweicloud-core/src/risk-rule-engine.mjs`，`huaweicloud_hook_check_deploy_plan` 的底层实现）传入部署计划做风险预检：

```js
// 1) 公网暴露 VPC
evaluateDeployPlan({ resources: [{ type: "huaweicloud_vpc", cidr: "0.0.0.0/0" }], action: "create" })
// → decision=allow, findings=[]   ← 未拦截

// 2) 公共读写 OBS 桶
evaluateDeployPlan({ resources: [{ type: "huaweicloud_obs_bucket", acl: "public-read-write" }], action: "create" })
// → decision=allow, findings=[]   ← 未拦截

// 3) 无害对照（合规内网 VPC）
evaluateDeployPlan({ resources: [{ type: "huaweicloud_vpc", cidr: "10.0.0.0/16" }], action: "create" })
// → decision=allow（应放行）✅ 无误判
```

- 基线：**1.1.2-next.4（608b120）**；`risk-rule-engine.mjs` 的 `evaluate('deploy_plan', ...)` 仅有 stage 框架分支，**对 `plan.resources` 无任何安全属性检查**
- 对比：`evaluateArtifacts`（`huaweicloud_hook_check_artifacts`）对恶意制品有 `hwc-sandbox-missing-ttl` 兜底（warn）——**deploy_plan 阶段完全空白**

## 根因

规则引擎对 `deploy_plan` 类型未实现资源级风险检测：
- 无「公网 CIDR (0.0.0.0/0)」检查
- 无「公共 ACL (public-read / public-read-write)」检查
- 无「缺失加密/凭据注入」等 IaC 语义检查
- findings 恒空 → `huaweicloud_hook_check_deploy_plan` 成为**形式化空操作**

## 影响

- `hook_check_deploy_plan` 是部署前预检的第三道钩子（hooks 三层之一：skills teach → hooks block → MCP/CLI wrappers enforce），当前对危险资源配置**零拦截**
- Agent 若经 `run_approved_command` 部署含公网 VPC/公共桶的 IaC，hook 层无法在计划阶段拦截（虽然 plan 审批门对命令本身仍可拦，但**计划内容的风险评估缺失**）
- 与 P0-1（命令层 hook 盲区）互补：命令层盲区 + 计划层盲区 = 两条纵深同时缺

## 修复建议

1. `deploy_plan` 阶段新增资源规则：
   - `ua:cidr-public`：`cidr` 匹配 `0.0.0.0/0` / 非 RFC1918 公网段 → warn/deny
   - `ua:acl-public`：`acl` ∈ {public-read, public-read-write} → deny/warn
   - `ua:secret-inline`：resource 属性含明文 `password/secret/access_key` → warn
2. 补充 `test/deploy-plan.test.mjs` 正反例（本报告三例可直接入库）
3. `evaluateDeployPlan` 输出 findings 至少对未知资源给 `warn`（fail-open 最小化），避免全空放行

## 同族关联

- OBS-12（规则引擎 env/secret 条目缺失，同批发现已另提）
- #501（P0-1 hook 规则盲区族）