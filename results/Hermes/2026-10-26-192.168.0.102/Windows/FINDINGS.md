# FINDINGS — Hermes/Windows 每日测试 2026-10-26（SUT: huaweicloud-devkit 1.1.12）

> 客户端：Hermes / 操作系统：Windows / 被测包：huaweicloud-devkit@1.1.12（hdk 源码 commit 4ed0780 = release-1.1.12）
> 执行口径：daily 精选集 150 条（设计级 107 + 展开级 43），全量真机执行，证据落 `evidence/<case-id>/stdout.log`。
> 结果分布：PASS 137 / FAIL 11 / BLOCKED 2 / NOT_RUN 0。通过率 92.6%（分母 PASS+FAIL=148）。

## 一、产品缺陷（建议随全量测完统一提单）

| # | 级别 | 用例 | 标题 | 根因（文件:行号） | 证据 |
|---|---|---|---|---|---|
| F-1 | P1 | EXP-E01 / D3-S1 | serviceCatalog 中文意图路由未命中「查云主机」 | 探针直调 huaweicloud_service_catalog(intent="帮我查一下我账号在华北北京四有哪些云主机") 返回通用 `Run hcloud --help to list available services.`，未路由到 ECS；D3-S1 同口径「只读查ECS」serviceCatalog function=false。D10 harness 实测 14 意图 1 MISS(EXP-E01)，准确率 92.9%。源：src/hcloud-cli.mjs / service_catalog 路由表 | evidence/EXP-E01、D3-S1 |
| F-2 | P1 | D3-C3 | 沙箱部署 E2E：upload_project 在 Windows 打包失败 | `huaweicloud_sandbox_upload_project` 内部 `tar -czf C:\Users\...\Temp\sandbox-upload-...\d3c...` Command failed，导致 deploy_nginx 无项目(undefined)。疑似 Windows 路径(/tmp 绝对路径)或 tar 参数问题，待源码核对 upload_project 打包逻辑 | evidence/D3-C3 |
| F-3 | P1 | D2-10 | R7 current 档跟随 / KooCLI profile 管理 | 探针断言 KooCLI profile 管理=false（current 档跟随未实现或探针断言口径不符）。源：src/auth + koocli 相关模块，待源码核对 | evidence/D2-10 |
| F-4 | P1 | D2-16 | import 文件读取后擦除 | auth switch/import=false，import 文件读取后未擦除（或擦除处理探针未命中）。源：src/auth/credentials.mjs | evidence/D2-16 |
| F-5 | P1 | EXP-NR3-03 | 更新 dismiss 持久化 | skip file=true, skip data=true, dismissed=false, persistent=true —— 更新 dismiss 后未持久化（文件/数据均未落盘 dismiss 标记） | evidence/EXP-NR3-03 |
| F-6 | P2 | D1-30 | semver 比对正确性 | semverCompare 在部分输入（预发布 pre 比较边界）比对结果有误。源：src/update-check.mjs:53 semverCompare → comparePre | evidence/D1-30 |
| F-7 | P1 | D4-17 | hook 模糊 fail-closed（null 解引用） | 探针调用返回 null 后读 `.length` 抛 "Cannot read properties of null" —— 模糊输入未 fail-closed 而是返回 null。源：src/risk-rule-engine.mjs evaluateCommandRisk | evidence/D4-17 |

## 二、已知/预期 FAIL（已上报或产品已规避，非本次新增）

| # | 用例 | 说明 |
|---|---|---|
| K-1 | D1-39 + EXP-NR3-09 | Windows `spawnSync('npm.cmd')` 无 shell:true 抛 EINVAL。产品已在 `update-check.mjs:263-265` 用 `shell:true` 规避（注释引用 #643）；探针复现原始 EINVAL 按「修复前证据保留」预期判 FAIL。连续多日复用，非新缺陷 |

## 三、测试端问题（探针/脚本路径或断言，非产品缺陷）

| # | 用例 | 说明 |
|---|---|---|
| T-1 | D3-A1 | 探针检查 `hdk根/skills` 目录仅 1 个 SKILL.md（需≥20），实际技能在 `plugins/huaweicloud-core/skills`（D8-4 同口径已 PASS）。探针路径口径偏差 |
| T-2 | D8-9 | 探针 import `telemetry/index.mjs` 不存在的路径，实际模块为 `telemetry.mjs`（D8-9 应改 import 路径） |
| T-3 | D3-C1 | 真云 E2E 核心创建流程 PASS(VPC/子网/ECS/审批)，但 realcloud_e2e.mjs 「finally归零」脚本缺陷：ECS 异步删除 150s 轮询未确认即删子网/VPC，触发 VPC.0104。已人工兜底删除归零（ECS/子网/VPC/EVS/EIP 残留=0）。归零脚本需修 |

## 四、真云资源处置（归零声明）

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| ECS testbot3-hermes-ecs-* | D3-C1 创建 1 台 | 已删（DeleteServers，20s 内归零） | ListServersDetails 残留=0 |
| VPC testbot3-hermes-e2e-* | D3-C1 创建 1 个 | 已删（DeleteVpc） | ListVpcs 残留=0 |
| 子网（同上 VPC 内） | D3-C1 创建 1 个 | 已删（DeleteSubnet） | ListSubnets 残留=0 |
| EIP | D3-C1 --delete_publicip=true 连带 | 已释放 | ListPublicips 残留=0 |
| 系统盘 EVS | D3-C1 连带 | 已删 | ListVolumes 残留=0 |
| OBS testbot3-hermes-obs-* | D3-C2 建桶 | rm -f 已删 | OBS ls 无该桶 |
| 沙箱会话 | D3-C3/C6 connect | close_session 已关 | 各 session 已关闭 |

> 仅删本次创建（唯一时间戳名 testbot3-hermes-*），未触碰既有/他人资源（如 huaweicloud-open-capability-home 官方桶）。

## 五、环境项（非产品）

- KooCLI 版本 7.2.12 < 7.3.12（本机 hcloud CLI，连续多日未升级，属测试机环境项）
- 机器 IP 检测为 LAN 192.168.0.102（socket 回退），历史 Hermes 目录多为公网 IP