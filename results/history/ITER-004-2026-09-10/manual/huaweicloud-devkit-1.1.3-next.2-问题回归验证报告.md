# ITER-004-2026-09-10 问题回归验证报告

## 1. 报告信息

| 项目 | 内容 |
|---|---|
| 上游仓库 | https://github.com/huaweicloud/huaweicloud-devkit |
| 执行日期 | 2026-09-10 |
| 被测版本 | `huaweicloud-devkit@1.1.3-next.2` |
| 源码基线 | tag `v1.1.3-next.2`，commit `c6c0965f0bdf6181abef65edb6fee7ed2115cd68` |
| npm 基线 | `dist-tags.next=1.1.3-next.2`，gitHead 与源码一致 |
| 运行环境 | Windows / PowerShell / Node.js `v22.23.2` / npm `10.9.8` |
| KooCLI | `7.2.12` |
| 测试源码目录 | `C:\Users\Administrator\Documents\Codex\2026-09-10\https-github-com-huaweicloud-huaweicloud-devkit\work\huaweicloud-devkit-lf` |
| 测试归档目录 | `C:\Users\Administrator\devkit-test\huaweicloud-devkit-test\results\ITER-004-2026-09-10` |

本报告只使用不含真实 AK/SK 的夹具、源码分析和只读验证结果。报告中不记录任何凭证值。

## 2. 测试准确性复核

### 2.1 被测版本已重新确认

本轮重新查询 npm 官方源：

```text
latest = 1.1.2
next   = 1.1.3-next.2
next gitHead = c6c0965f0bdf6181abef65edb6fee7ed2115cd68
```

因此，本轮源码回归和 npm `@next` 冒烟实际针对的是同一个 `1.1.3-next.2` 发布基线，不再混用上一轮已经过期的 `1.1.3-next.1` 结论。

### 2.2 执行层级

| 验证层级 | 结果 | 说明 |
|---|---|---|
| 全量单元/集成测试 | 两次结果不完全一致 | 第一次 `389 tests / 369 pass / 7 fail / 13 skipped`；第二次 `389 tests / 370 pass / 6 fail / 13 skipped` |
| 关键专项测试 | 通过 | 规则、工具、认证对账、更新检测共 `66/66` 通过 |
| 认证专项 | 通过 | `auth-credentials` + `cred-reconcile-e2e` 共 `45/45` 通过 |
| 安装、跨平台适配 | 通过 | CodeArts、DSH、跨平台安装专项共 `36/36` 通过 |
| MCP server 专项 | 通过 | `mcp-server.test.mjs` `3/3` 通过 |
| Telemetry 专项 | 18/19 通过 | 仅客户端名称分类用例失败，归因于测试隔离问题，见 #331 |
| npm CLI 冒烟 | 通过 | `npx --yes --package huaweicloud-devkit@next huaweicloud-devkit --version` 返回 `1.1.3-next.2` |
| npm MCP 冒烟 | 通过 | `initialize.serverInfo.version` 返回 `1.1.3-next.2` |
| 包质量检查 | 通过 | `validate`、`pack:verify` 通过；LF 工作树下 `lint:js`、`format:check` 通过 |

### 2.3 全量测试失败项的准确归因

全量测试的失败项不能全部算作产品缺陷：

1. #25、#29、#30、#31 属于安装自动检测测试未隔离当前 Windows 主机。测试预期只看到 `opencode`、`workbuddy`，实际还检测到了本机 `officeace`。其中 #29 还受到 OfficeAce marker 路径未按测试夹具预期生成的影响。
2. #205 的 MCP 安装布局用例在全量运行中曾超时，但单独执行 `node --test test/mcp-server.test.mjs` 时 `3/3` 通过，npm `@next` 实际 MCP 初始化也通过。因此本轮不把 #205 判定为稳定产品缺陷，应修复测试夹具隔离或并发稳定性。
3. #331 的断言期望 `openclaw`，实际返回 `hermes`。`detectAgentHarness` 会优先扫描 `AGENTS` 中的路径/环境匹配；当前测试运行环境存在宿主识别干扰，测试只清理了环境变量，未完全隔离模块路径和宿主环境。因此该项暂不能作为产品回归缺陷。

### 2.4 GitHub 当前状态快照

已于 2026-09-10 通过 GitHub API 重新核对本报告涉及的 issue。这里的 GitHub 状态是上游 issue 的工作流状态，不等同于本轮代码验证结论：

- `OPEN`：issue 仍在处理中，不能因为本轮测试通过就视为上游已关闭。
- `CLOSED / status:resolved`：上游已关闭并标记解决，但仍需结合本轮版本实测确认没有回归。
- `status:triaged`：上游已完成 triage/分派，不表示修复已经发布。

本轮最需要注意的是：#576 本轮代码验证已通过，但 GitHub 仍为 `OPEN / status:triaged`；#560、#533 已为 `CLOSED / status:resolved`，与本轮“已修复”结论相互印证。

## 3. 总体结论

**不能判定当前版本已将所有 GitHub issues 修正完好。**

当前版本可以确认：

- #576 的 MCP `serverInfo.version` 修复已进入 `1.1.3-next.2`，源码、npm 包和专项测试均通过。
- #533 涉及的 KooCLI 加密存储指纹误报，现有认证对账专项通过。
- #560 的 MCP 生命周期修复已进入当前源码，相关 MCP/安装专项通过；未在真实 OfficeAce 客户端 UI 中做独立人工验证。
- 包校验、打包安装、核心认证对账、工具枚举和 MCP 正常协议路径没有发现新的稳定回归。

当前仍有直接证据表明未闭环的问题：

- #578 审批 token 跨 MCP 进程失效，仍存在。
- #554 Windows 更新检测的 `npm.cmd` `EINVAL`，仍存在。
- #555 WorkBuddy hook 场景卸载崩溃，仍存在。
- #565 MCP 畸形 JSON 仍会使进程退出，仍存在。
- #564、#561、#562 规则引擎输入/资源安全检查仍有盲区，仍存在。
- #572 的五项认证架构问题仍未全部修复。
- #570 占位符凭证仍可能被当作有效环境凭证。
- #563 全局规则文件仍未发现加载或注入代码。

## 4. 问题回归总表

判定口径：

- **是否已验证**：本轮是否有直接运行结果、专项测试结果或源码证据支撑。
- **是否已修改好**：是否有足够证据证明问题已闭环；“部分”表示主路径修复但仍有子项或边界未闭环。
- **是否引入其他问题**：本轮是否发现与该问题直接相关的回归、测试隔离缺陷或新的风险。没有证据时写“未发现”，没有执行时写“未判定”。

| Issue | GitHub 当前状态（2026-09-10） | 问题摘要 | 是否已验证 | 是否已修改好 | 是否引入其他问题 | 本轮明确结论 |
|---|---|---|---:|---:|---|---|
| #578 | `OPEN / status:triaged` | MCP 审批 token 跨进程失效；资源风险 finding/BSS 编码缺口 | 是 | 否 | 是：同进程测试通过，但不能代表跨 MCP 进程闭环；资源专项 finding 仍缺 | **未闭环，发布前优先处理** |
| #576 | `OPEN / status:triaged` | Codex cache 布局下 MCP `serverInfo.version=0.0.0` | 是 | 是 | 是：全量运行曾有一次超时，但单独运行和 npm 冒烟均通过，属于测试稳定性问题 | **已修复，但上游 issue 尚未关闭** |
| #572 | `OPEN / status:triaged` | auth init 备份、status 诊断、多 profile、非 TTY、R3 顺序等 5 项 | 是 | 部分 | 未发现产品回归；剩余缺陷仍存在 | **基础链路通过，issue 不能关闭** |
| #570 | `OPEN / status:triaged` | MCP 配置中的 AK/SK 占位符被当作真实凭证 | 是 | 否 | 是：占位符可能遮蔽凭证库中的真实凭证 | **代码级风险仍存在** |
| #565 | `OPEN / status:triaged` | MCP stdio 畸形 JSON 导致进程退出 | 是 | 否 | 未发现其他回归；正常帧和分片帧仍可用 | **未修复** |
| #564 | `OPEN / status:triaged` | `evaluateCommandRisk` 异常输入 fail-open | 是 | 否 | 是：null、空串、数字均静默 allow | **未修复** |
| #562 | `OPEN / status:triaged` | `hook_check_deploy_plan` 对公网 VPC/OBS 资源无专项 finding | 是 | 否 | 是：通用写操作门可能拦截，但没有专项资源风险提示 | **未修复** |
| #561 | `OPEN / status:triaged` | env 凭证打印、明文 secret 参数无规则覆盖 | 是 | 否 | 是：规则引擎对两类输入均返回 allow | **未修复** |
| #554 | `OPEN / status:triaged` | Windows 更新检测 `spawnSync('npm.cmd')` 返回 `EINVAL` | 是 | 否 | 是：失败被静默吞掉，更新提示失效 | **未修复** |
| #555 | `OPEN / status:triaged` | WorkBuddy hook 场景 `uninstall --target all` 崩溃 | 是 | 否 | 是：会阻断后续 agent 卸载和全局清理 | **未修复** |
| #556 | `OPEN / status:triaged` | 回收站删除失败但统计仍报全部成功 | 否 | 未判定 | 未判定：本轮因 #555 未继续执行破坏性批量卸载 | **需要隔离环境补测** |
| #557 | `OPEN / status:triaged` | WorkBuddy MCP 写命令无可见审批 | 否 | 未判定 | 未判定：未执行真实 WorkBuddy 会话级写操作 | **不能宣称已修复** |
| #558 | `OPEN / status:triaged` | DSH `approval=ask` 未拦 MCP 写通道 | 否 | 未判定 | 未判定：未执行真实 DSH headless 会话 | **不能宣称已修复** |
| #559 | `OPEN / status:triaged` | OfficeAce 回退链写命令无审批 | 否 | 未判定 | 未判定：未执行真实 OfficeAce 连接器会话 | **不能宣称已修复** |
| #560 | `CLOSED / status:resolved` | OfficeAce/WorkBuddy MCP 生命周期关闭超时 | 是 | 是 | 未发现稳定回归；OfficeAce 客户端 UI 未独立人工验证 | **源码和专项测试支持已修复** |
| #533 | `CLOSED / status:resolved` | KooCLI 加密 SK 指纹误报 | 是 | 是 | 未发现回归；认证对账 `45/45` 通过 | **已修复** |
| #511 | `OPEN / status:triaged` | Hermes Windows `--home` 被忽略 | 部分 | 未判定 | 未发现常规安装回归；未完成历史黑盒场景 | **需要补完整端到端验证** |
| #502 | `OPEN / status:triaged` | `auth_switch mode=import` 缺省 region | 部分 | 未判定 | 未发现 import 读写/擦除回归；缺省 region 端到端未覆盖 | **需要补测** |
| #501 | `OPEN / status:triaged` | CI/Windows 测试兼容性及 hook 规则覆盖 | 是 | 部分 | 是：宿主 agent 污染仍导致安装测试失败；规则盲区仍存在 | **测试基建部分改善，不能关闭** |
| #563 | `OPEN / status:triaged` | 全局 `huawei-agent-rules.mdc` 未加载/注入 | 是 | 否 | 是：文件存在但未发现 loader/injector，属于“存在但未生效” | **未修复** |
| #351/#349/#348/#347/#346/#345/#344 | `OPEN / triaged 或无 status 标签` | Hermes 文档、超时、deploy_check、OBS、版本等历史问题 | 否 | 未判定 | 未判定：本轮不在独立端到端范围内 | **不作已修复结论** |

**矩阵结论：** 本矩阵中有直接或部分证据的 16 个 issue 项里，明确已修复 3 项（#576、#560、#533），部分修复 2 项（#572、#501），明确未修复 9 项（#578、#570、#565、#564、#562、#561、#554、#555、#563），其余为未覆盖或仅部分覆盖。全量测试中发现的安装检测污染、偶发 MCP 超时和 telemetry 客户端识别冲突，已单独标为测试问题，未冒充产品缺陷。

## 5. 逐问题分析

### #578 MCP 审批 token 跨调用失效，以及资源风险检查缺口

**结论：部分确认，核心审批缺陷仍未修复。**

验证证据：

1. `plugins/huaweicloud-core/src/hcloud-cli.mjs` 中 `approvalStore` 是模块级 `Map`。
2. `createApprovalToken()` 只把 token 写入当前 Node 进程内存。
3. `consumeApprovalToken()` 只从当前进程的 `Map` 读取。
4. 同一进程内 plan 后立即 run 可以消费 token；另起 Node 进程消费同一个 token 返回空值。这与 MCP 每次调用由独立进程承载时的失败模型一致。
5. 因此 `plan -> user approval -> run` 不能依赖当前内存 token 完成跨调用闭环。当前测试中同进程相关用例通过，并不能证明跨 MCP 进程闭环已经修复。

同一 issue 的其他子项需要分开判断：

- BSS 的 RDS/DCS/EIP 询价编码，本轮未重新访问真实 BSS，不作“已修复”结论。
- 公网 VPC/OBS 计划的专项 finding，前一轮直接调用 `evaluateDeployPlan` 已出现 `allow` 且 `findings=[]`，源码仍没有按资源类型展开风险检查；通用写操作审批门与专项资源风险 finding 不是同一层能力。

建议：

- 将审批 token 放入 MCP 进程之间可访问且具备 TTL、一次性消费和参数绑定的存储。
- 为 VPC 公网 CIDR、OBS 公共读写 ACL 增加明确的专项 finding 和修复建议。
- BSS 询价编码应补充可验证的 RDS/DCS/EIP 映射和回归用例。

### #576 Codex cache 布局下 MCP 版本返回 `0.0.0`

**结论：已修复并进入当前 next 版本。**

验证证据：

- `mcp-protocol.mjs` 当前按安装目录和包根目录查找 `package.json`。
- 源码直接启动 MCP server，`initialize.serverInfo.version` 返回 `1.1.3-next.2`。
- npm `@next` 实际启动 MCP server，返回：

```json
{"serverInfo":{"name":"huaweicloud-devkit","version":"1.1.3-next.2"}}
```

- `node --test test/mcp-server.test.mjs` 单独执行 `3/3` 通过。

注意：全量测试中曾出现安装布局用例超时，但单独执行通过，且真实 npm 包冒烟通过。因此该超时应作为测试并发/夹具稳定性问题继续处理，不能反推 #576 回归。

### #572 AK/SK 登录凭证架构 v4 的五项缺陷/偏差

**结论：基础认证链路通过，但 issue 仍未完全修复。**

专项认证测试 `45/45` 通过，说明凭证读写、S1/S2/S3 对账、runtime 凭证、R3 拒绝、import 文件擦除和加密存储对账基础路径没有回归。尤其 #533 的密文指纹误报已有修复迹象。

但源码复核仍发现 issue 中的五项问题：

1. **B-03：`auth init` 重跑不备份 S1。** `cmdAuthInit` 在 `setup-cli.mjs` 直接调用 `writeGlobalCredentials()`，没有先调用 `backupGlobalCredentials()`；`auth_switch persist` 路径才有备份。
2. **F-04：`auth status` 诊断输出不完整。** `getAuthStatus()` 返回 `reconciled`，但 `printAuthStatus()` 只打印 vault、OBS、KooCLI 和 agent registration，没有打印指纹对照、reconciled 和逐 profile 审计结果。
3. **H-05：多 profile 规则未实现。** `syncAuth()` 通过 `resolveManagedProfile()` 只处理当前 profile，没有按 issue 所述处理多个 KooCLI profile。
4. **C-05：`auth sync` 非 TTY 无交互守卫。** `auth reconcile` 有非 TTY 拒绝逻辑，`auth sync` 直接执行同步。
5. **D-2：R3 拒绝顺序仍不理想。** `auth_switch persist` 先进入冲突确认分支，真正的 security token 拒绝发生在后续 `persistCredentials()`；规格要求在进入确认/持久化流程前直接拒绝。

因此本 issue 应标记为“部分通过，不能关闭”。

### #570 MCP 配置中的 AK/SK 占位符未替换

**结论：仍有代码级风险，未修复。**

`resolveCredentials()` 当前只以环境变量是否为 truthy 判断是否存在凭证；`readCodeArtsCredentials()` 也会直接返回 `HW_ACCESS_KEY` 和 `HW_SECRET_KEY` 字段值，没有过滤 `<HW_ACCESS_KEY>`、`<HW_SECRET_KEY>` 等占位符。

影响是占位符可能遮蔽凭证库中的真实凭证，并被当作可用凭证继续进入认证链路。现有认证专项通过的是正常测试凭证场景，不覆盖占位符输入，因此不能将普通认证通过误写成 #570 已修复。

建议增加统一的 placeholder predicate，并在 credential resolve、CodeArts 配置读取、status 指纹展示三个入口复用。

### #565 MCP stdio 畸形 JSON 导致进程退出

**结论：未修复，稳定复现。**

复现方式：向源码 MCP server 的 stdio 输入畸形 JSON 行 `{this is not json}`。

实际结果：

- 进程以退出码 `1` 退出。
- stderr 出现 JSON 解析异常。

源码仍有未捕获的：

- `handleMessage(JSON.parse(line))`
- `handleMessage(JSON.parse(body))`

需要分别保护 newline framing 和 `Content-Length` framing 的 JSON 解析。当前不完整 frame 的等待逻辑已通过测试，但“完整帧内容不是合法 JSON”仍会杀死整个进程。

### #564 `evaluateCommandRisk` 异常输入 fail-open

**结论：未修复。**

前一轮直接调用结果：

| 输入 | 实际结果 |
|---|---|
| `null` | `allow`, `findings=[]` |
| 空字符串 | `allow`, `findings=[]` |
| 数字 | `allow`, `findings=[]` |

根因是 `normalizeText()` 会把非字符串值转换成 JSON 文本，最终没有任何规则命中；规则引擎没有对类型异常设置 deny 或至少 warn。应在公共入口增加输入类型校验，异常值返回明确错误或安全拒绝，而不是静默 allow。

### #562 `hook_check_deploy_plan` 对公网资源无专项拦截

**结论：未修复。**

前一轮通过工具层等价路径验证：

- 公网 VPC `0.0.0.0/0` 计划返回 `allow`、无 finding。
- 公共读写 OBS ACL 计划返回 `allow`、无 finding。

当前 `huaweicloud_hook_check_deploy_plan` 只是把 `args.plan` 交给 `evaluateDeployPlan()`；`evaluateDeployPlan()` 主要把 plan 序列化后套用文本规则，没有对 resources 做 VPC CIDR、OBS ACL 等结构化资源检查。

注意：其他 CLI 写操作可能被通用“需要审批”门拦截，这不能代替 issue 要求的专项风险 finding，也不能提供窄网段或私有 ACL 的针对性建议。

### #561 规则引擎未覆盖凭证 env 打印和明文 secret 参数

**结论：未修复。**

前一轮直接调用结果：

| 命令 | 实际结果 |
|---|---|
| `echo $HW_ACCESS_KEY` | `allow`, 无 finding |
| 带 `--adminPass=` 的命令 | `allow`, 无 finding |

当前规则目录存在凭证文件读取、STS 等规则，但没有针对环境变量转储和明文 secret 参数的规则。需要增加规则条目，并补充 `huaweicloud_hook_check_command` 和 shell hook 的对应测试。

### #554 Windows 更新检测 `npm.cmd` 返回 `EINVAL`

**结论：未修复，稳定复现。**

源码 `update-check.mjs` 仍使用：

```js
spawnSync(NPM_BIN, ['view', 'huaweicloud-devkit', 'dist-tags', '--json'], ...)
```

Windows 下 `NPM_BIN` 为 `npm.cmd`，当前 options 没有 `shell: true`。本机实际验证：

- 不带 shell：`status=null`，错误码 `EINVAL`，函数返回 `null`。
- 加 `shell:true` 对照：命令成功，能返回 npm dist-tags。

因此 Windows 上更新检测仍会静默失效。当前 npm `next` 已是 `1.1.3-next.2`，但该源码路径仍未修改，不能判定修复。

### #555 `uninstall --target all` 在 WorkBuddy hook 场景崩溃

**结论：未修复，已在本机真实配置场景复现。**

当 `settings.hooks` 只剩 `PostToolUse` 时，卸载逻辑先删除空的 `settings.hooks`，随后仍访问 `settings.hooks.PostToolUse?.length`，会抛出：

```text
Cannot read properties of undefined (reading 'PostToolUse')
```

错误发生在写回 `settings.json` 之前，会导致后续 agent 卸载和全局清理流程无法继续。验证后已恢复本机 WorkBuddy/OpenCode 相关配置和插件文件，未将测试副作用留在用户环境中。

修复应在删除 `settings.hooks` 前保存 after length，或对对象本身使用可选链。

### #556 卸载统计与实际删除数量不一致

**结论：本轮未执行破坏性回收站复测，不能判定已修复。**

本轮确认 #555 仍会阻断 `uninstall --target all`，因此没有在真实用户目录继续做批量卸载和回收站删除测试。现有源码/历史报告没有提供足够证据证明 safe-delete 的失败重试、降级和计数修复已经进入 `1.1.3-next.2`。

应在隔离临时 home 中注入 trash 失败，确认：

- 失败项不计入成功数量；
- 有重试或可控降级；
- 最终 status 与磁盘实际残留一致。

### #557、#558、#559 会话级 MCP 写操作缺少可见审批

**结论：本轮未完成真实客户端会话复测，不能判定已修复。**

这三个问题分别涉及 WorkBuddy、DSH、OfficeAce 的真实客户端连接器和 session 级门禁。当前本地测试只验证了通用 MCP 工具的 `approvedByUser` 参数校验，不能证明客户端不会让模型自行填入该参数，也不能证明客户端连接器在写工具调用前展示用户审批。

因此本轮结论是“未形成闭环证据”，不是“已修复”。发布前应在三个真实客户端中各执行一次写操作计划、拒绝、批准和审计链路，并确认没有真实云资源残留。

### #511 Hermes Windows `--home` 参数

**结论：部分验证，未做完整 issue 闭环。**

跨平台安装专项 `36/36` 通过，说明常规 home 隔离、目录复制和安装路径处理没有回归；但本轮没有单独执行历史 issue 的 Hermes Windows `--home` 黑盒命令并逐目录比对“只写入指定 home、不写默认 LOCALAPPDATA”的完整场景。因此不能直接标记为已修复。

### #502 `auth_switch mode=import` 缺省 region

**结论：部分验证，未做完整 issue 闭环。**

认证专项覆盖 import 文件读取、擦除和 region 字段传递，相关 `45/45` 用例通过；但没有用真实 KooCLI/OBS 同步路径验证“省略 region 时的默认解析和失败后的重放路径”。本报告不将其升级为已修复结论，建议补一条缺省 region 的端到端用例。

### #501 测试基建、Windows 兼容性和 hook 覆盖

**结论：问题仍有残留，部分已改善。**

- LF 工作树下 `lint:js`、`format:check` 通过，说明 CRLF 工作树导致的格式噪声不是产品源码问题。
- Windows 安装测试仍受到宿主 agent 检测污染，说明测试隔离问题仍未解决。
- #561、#562、#564 说明 hook/risk rule 覆盖仍有安全盲区。

因此 #501 不能关闭，只能记录为“部分改善”。

## 6. 其他开放 issue 的本轮状态

下列开放 issue 本轮没有形成足够的独立修复证据，不应在回归报告中写成“已修复”：

| Issue | 本轮状态 | 原因 |
|---|---|---|
| #351 | 未独立复测 | Hermes sandbox 有效期 API 文档问题，未做真实 API 返回值核对 |
| #349 | 未独立复测 | Hermes sandbox 超时/重试，需要真实服务端延迟场景 |
| #348 | 未独立复测 | Hermes deploy_check，需要真实检查结果矩阵 |
| #347 | 未独立复测 | OBS 静态网站托管签名路径，需要真实 OBS 只读/写闭环 |
| #346 | 未独立复测 | OBS 凭证预配置，需要真实 Hermes 首次操作 |
| #345 | 未独立复测 | npx 默认频道行为，需要多版本发布包矩阵 |
| #344 | 未独立复测 | status 版本输出，需要 Hermes 客户端黑盒 |
| #304 | 未独立复测 | 登录/扫码授权需求，不属于本轮 next 回归范围 |
| #220 | 不属于缺陷回归 | 活动/代金券信息，不作为产品缺陷判定 |

## 7. 质量门和发布建议

已通过：

- `npm run validate`
- `npm run pack:verify`
- LF 工作树 `npm run lint:js`
- LF 工作树 `npm run format:check`
- 核心专项测试 `66/66`
- 认证专项 `45/45`
- MCP server `3/3`
- npm `@next` CLI/MCP 冒烟

仍需关注：

- 官方 npm audit 报告存在 2 个 high，来源是开发依赖链 `markdownlint-cli2 -> smol-toml`，不是本轮新增业务代码漏洞；修复需要升级到 semver-major 版本并重新确认 markdownlint 兼容性。
- Windows CRLF checkout 下 lint/format 会产生环境型误报，建议 CI 固定 LF checkout 或增加 `.gitattributes`。
- 安装自动检测测试必须隔离所有 agent 路径、环境变量和模块路径，不能只替换 `HOME`。
- MCP 畸形 JSON、跨进程审批 token 和安全规则盲区属于发布前优先级高的问题。

## 8. 最终判定

`huaweicloud-devkit@1.1.3-next.2` 的结论是：

> **核心功能和部分历史问题已验证通过，但不是“所有 issue 已修正完好”的版本。**

发布前至少应优先处理或重新验证：

1. #578：跨 MCP 进程审批 token。
2. #554：Windows 更新检测。
3. #555：WorkBuddy hook 卸载崩溃。
4. #565：畸形 JSON 进程健壮性。
5. #561、#562、#564：规则引擎安全盲区和异常输入 fail-open。
6. #570、#572、#563：凭证占位符、认证架构剩余缺陷、全局规则注入。
7. #557、#558、#559：三个真实客户端的会话级审批闭环。

本报告已保存到测试归档仓库的 `results/ITER-004-2026-09-10/manual/` 目录。
