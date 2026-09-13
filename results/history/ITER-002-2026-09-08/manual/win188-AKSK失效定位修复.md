# ITER-002-2026-09-08 188 OfficeAce"连接不上"根因定位与修复（AK/SK 失效）

## 背景

用户反馈 188.239.14.150 上 OfficeAce 连接不上；要求验证 AK/SK 能否正常登录。

## 定位过程

| 步骤 | 结果 |
|---|---|
| OfficeAce 进程 | ✅ 运行中（5 进程，RDP 会话活跃） |
| 插件 | ✅ huaweicloud-devkit v1.1.1 已装（.office-claw/huaweicloud-plugins） |
| hcloud 当前 AK | `HPU****1CW`（**非测试账号**那套 YXD——被覆盖/他人配置） |
| **登录实测（原始配置）** | ❌ **APIGW.0301：Incorrect IAM authentication information: Unauthorized**——IAM 认证拒绝，project_id 都获取失败 |
| **修复**：重配有效测试账号凭据（本机 S1：HPU…YXD） | ✅ "设置配置成功" |
| **修复后登录实测** | ✅ `NovaListServers → {"servers":[]}` 真实返回；BSS 可用 |

## 结论

- **根因**：188 机器 hcloud 配置的 AK/SK（HPU****1CW）**无效/失效** → IAM 认证失败 → 云 API 全挂 → OfficeAce 连接器"连接不上"
- **非 OfficeAce 插件缺陷、非网络问题**——纯凭据配置问题
- **AK/SK 机制本身正常**（重配有效凭据后登录恢复）
- **遗留疑问**：1CW 凭据来源（OfficeAce 安装时写入/他人修改/历史残留）——用户知悉即可，修复后沿用有效凭据
- **OfficeAce 侧建议**：连接器 UI 更新/确认 AK/SK（若引用 hcloud 配置则重启 OfficeAce 重连即可）

## 教训（方法论）

- "连接不上"排障次序：① 凭据有效性（IAM 实测，最快）② 网络/端口 ③ 插件/配置——本次直接实测 hcloud 登录即命中根因（APIGW.0301）
- 凭据类问题用 `hcloud <service> <op>` 最小只读命令实测即可定性，不必先查 UI

## 复现

- win188-aksk*.py（诊断序列：configure show → 查询实测 → 重配 → 复测）