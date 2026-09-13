# ITER-004-2026-09-10 基线记录（T0）

> 迭代：ITER-004-2026-09-10（2026-09-10 建立）｜状态：问题与需求测试启动

## 被测对象基线

| 项 | 值 |
|---|---|
| 仓库 | https://github.com/huaweicloud/huaweicloud-devkit |
| **测试目标分支** | `dev` @ `306c633`（2026-09-10 拉取，Merge PR #566 fix/518-readme-mirror-lag） |
| 上一基线 | `608b120`（2026-09-09，Merge PR #551 release-dev-1.1.2-next.4）——本次增量 **24 commits / 19 文件 +728/−32** |
| 发布基线（对照） | `main` / npm **latest=1.1.2**（2026-09-10 01:22Z ≈ 北京 09:22 发布，gitHead `09a59b93`） |
| next 发布线 | npm **next=1.1.3-next.2**（gitHead `c6c0965f`，比 dev 分支更前，走 release 分支合入） |
| 本地工作副本 | `C:\Users\Administrator\devkit-test\hdk`（本地 HEAD 停在 608b120，落后 origin/dev 24 commits） |
| 本机测试对象 | Hermes 插件 **未安装**（hermes-home 下 huaweicloud-plugins 缺失=ENV-1 再现，需 `@next install` 重装后重启生效） |

> **2026-09-10 增量的主题（T0.5 变更影响分析详见 change-impact.md）**：
> ① auth：新增 `project-id.mjs`（project-id 自动解析，hcloud 无 shell spawn）+ 凭证注入沙箱前校验 + 自动设置 project_id（#259/#262）——**涉及 D2 凭证/认证维度**；
> ② telemetry：proxy 路由、MCP 客户端名分类为 canonical agent harness、凭证切换后 userHash 重生成、hcloud 捕获限界与失败重试隔离——**涉及 D6/隐私维度**；
> ③ docs：#566 README 补充镜像滞后回退官方源说明（#518 文档侧闭环）；
> ④ tools.mjs +80 行（需核对是否新增/变更工具，D5-3 枚举复跑）。

## 执行环境（本机）

| 项 | 值 |
|---|---|
| OS | Windows 10（China Standard Time UTC+8） |
| Node / npm | v22.23.2 / 10.9.x |
| 归档仓库 | `C:\Users\Administrator\devkit-test\huaweicloud-devkit-test`（main 干净，最新 ITER-003-2026-09-09） |

## 上游开放问题（2026-09-10 拉取，open 30 条截取）

- **#578（critical，09-09 新提）**：huawei-iac 自动测试 MCP 审批 token 跨调用失效（plan→approve→run 不可达）+ BSS 询价缺 RDS/DCS/EIP 编码 + 0.0.0.0/0 无专项 finding（54 检查点 39 PASS/0 FAIL/15 BLOCKED）
- **#576（high，09-09）**：Codex cache 安装布局下 MCP serverInfo.version 返回 0.0.0
- **#572（high，09-09）**：AK/SK 登录凭证架构 v4 测试 5 缺陷（44 PASS/4 FAIL/3 WARN）
- **#570（high，09-09）**：MCP 插件连接失败——AK/SK 占位符未替换
- 我方已提：#565（OBS-15 畸形帧）、#564（OBS-14 fail-open）、#563（.mdc 孤儿）、#562（deploy_plan 盲区 critical）、#561（env/secret 规则缺失 critical）、#559/#558/#557（OBS-11/10/9 会话级写无审批）
- 其他：#556/#555（uninstall 系 critical）、#554（更新检测 EINVAL）、#511（Hermes --home）、#502（import region）、#501（测试基建）

## 今日测试方向（待确认）

1. **1.1.2 正式版冒烟**（今天 09:22 刚发布 = 此前已验证 next 内容转 latest，冒烟聚焦安装→版本→status→技能数）
2. **dev 24 commits 增量功能测试**（auth project-id 自动解析 / 凭证预校验 / telemetry 改造 —— 影响 D2/D5/D6 维度）
3. **新问题 #578 审批 token 跨调用失效核验**（与我方 D3-B7 审批闭环契约结论对账）
4. **open issues 状态回流**到缺陷清单/全景图

## 安全红线提醒

- 凭证零进入：AK/SK 不进对话/报告/evidence（脱敏强制）
- 写操作纪律：plan → approved；只读验证用后立删，删除前全量盘点白名单
- 资源释放：本轮创建资源当轮删除并只读验证归零