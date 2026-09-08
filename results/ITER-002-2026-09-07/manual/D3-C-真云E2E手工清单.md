# D3-C 真云 E2E 手工执行清单（ITER-001-2026-09-05）

> 用途：手工测试（真云资源验证插件全链路）｜ 账号：hw018619646（cn-north-4）｜ 工具：hcloud 7.2.12
> ⚠️ **费用注意**：涉及创建资源（ECS/RDS），用完**必须执行清理**；建议先跑 C1，C2/C3 视预算
> 每步完成后在"结果"列填 ✅/❌+现象，跑完交回归档（P/G/I 分类）

## 前置检查（3 分钟）

| # | 命令 | 预期 | 结果 |
|---|---|---|---|
| P1 | `hcloud ECS ListFlavors --cli-region=cn-north-4` | 返回规格列表（找到 c6.large.2 等） | |
| P2 | `hcloud IMS ListImages --cli-region=cn-north-4 --__imagetype=gold` | 返回镜像（找到 Ubuntu 22.04） | |
| P3 | `hcloud VPC ListVpcs --cli-region=cn-north-4` | 有默认 VPC 或可创建 | |

## D3-C1 ECS 生命周期（核心，~30 分钟，费用 ≈2 元）

| 步 | 操作（命令，`--cli-region=cn-north-4` 可省） | 预期（断言点） | 结果 |
|---|---|---|---|
| 1 | 查镜像：`hcloud IMS ListImages --__imagetype=gold --limit=5` | 记录 image_ref（Ubuntu 22.04） | |
| 2 | 查规格：`hcloud ECS ListFlavors` | 记录 flavor_ref（c6.large.2 便宜） | |
| 3 | 查网段：`hcloud VPC ListSubnets` | 记录 subnet_id（默认 VPC 子网） | |
| 4 | **创建**：`hcloud ECS CreateServers --name=hwc-e2e-test --server.name=hwc-e2e-test ...`（含 flavorRef/imageRef/subnet_id/安全组，建议先复制命令到记事本检查） | 返回 job_id；**走插件时应被 plan 拦截需审批**（若用 MCP 工具验证 confirm 流） | |
| 5 | 查询状态：`hcloud ECS ListServersDetails`（或 NovaListServers） | 出现 hwc-e2e-test，status=ACTIVE（等 1-2 分钟） | |
| 6 | 开安全组：`hcloud VPC CreateSecurityGroupRule`（可选：只测创建规则与端口拦截） | 只开 22 端口；**预期 80/443 开放被插件规则警告/拦截（web-port 修复验证点）** | |
| 7 | 绑定 EIP：`hcloud EIP CreatePublicip` + `AssociatePublicip`（绑定到 server） | 获得公网 IP；可 ssh 连入（可选验证） | |
| 8 | **销毁**：`hcloud ECS DeleteServers --server_ids=...` | 先确认 server_id 再删；**强制建议：测完立即删** | |
| 9 | 验证清理：`hcloud ECS NovaListServers` | 无 hwc-e2e-test 残留；同步删 EIP（`DeletePublicip`） | |

## D3-C2 OBS 静态网站托管（可选，~15 分钟，费用 ≈0.5 元）

| 步 | 操作 | 预期 | 结果 |
|---|---|---|---|
| 1 | 建桶：`hcloud OBS CreateBucket --bucket=hwc-e2e-$(date +%s) --location=cn-north-4` | bucket 创建成功 | |
| 2 | 上传默认页：`hcloud OBS UploadObject`（或 obsutil cp，若可用） | 上传 index.html 成功 | |
| 3 | 开静态托管：控制台/`hcloud OBS`（托管开关若无 CLI，用控制台） | 托管开启 | |
| 4 | URL 验证：`curl http://<bucket>.obs.cn-north-4.myhuaweicloud.com/` | 返回 index.html 内容 | |
| 5 | **删桶**：`hcloud OBS DeleteBucket`（先清对象） | 桶删除成功无残留 | |

## D3-C3 RDS/DCS（可选，费用较高 ≈5-10 元）

| 步 | 操作 | 预期 | 结果 |
|---|---|---|---|
| 1 | 建 MySQL：`hcloud RDS CreateInstance ...`（最小规格） | 实例创建 | |
| 2 | 查询状态 → 连接测试（可选） | NORMAL 状态 | |
| 3 | **删除** RDS 实例 | 删除成功 | |

## 记录模板（每个"结果"格按此填写）

```
✅/❌ 现象简述（如：返回 job_id=xxx / status=ACTIVE / 被插件拦截 deny）
失败时可补：命令原文 + 输出关键行 + 截图
```

## 出口条件与提醒

1. **全部资源必须销毁**：ECS（含 EIP）+ OBS 桶 + RDS——最后 `NovaListServers`/桶列表确认归零
2. 若用 MCP 工具走插件链路：**创建/删除类操作应被 plan 拦截 → 审批后执行**（这正是 D4-4/18 的真云对照）；`hook_check` 对开 80/443 安全组应 allow（web-port 修复）、开 22 应 deny
3. 建议记录每步耗时与截图（方便复现与归档）
4. 跑完把清单结果文件交回（或直接贴结果），我做 P/G/I 分类 + 归档 + 更新报告

## 关联用例

D3-C1→矩阵（真云 E2E）、D4-4/18/19（审批流真云对照）、D4-16b（web-port 规则真云复验，next.16 修复项）、D2-6（obsutil 端到端，若已装）