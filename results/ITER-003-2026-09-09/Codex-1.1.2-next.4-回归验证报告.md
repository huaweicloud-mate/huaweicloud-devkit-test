# Codex 回归验证报告：huaweicloud-devkit 1.1.2-next.4

> 执行日期：2026-09-09  
> 测试仓库：`C:\Users\Administrator\devkit-test\huaweicloud-devkit-test`  
> 被测版本：`huaweicloud-devkit@1.1.2-next.4`  
> 操作系统：Windows / PowerShell  
> Node.js：`v22.23.2`  
> Codex CLI：`0.153.4`  
> KooCLI：`7.2.12`

## 1. 总体结论

**结论：有条件通过，不建议直接判定为完全过关。**

- 三个目标 issue 的核心修复验证通过。
- 测试仓库中的插件自动化回归：`79/79` 通过。
- `1.1.2-next.4` 已成功安装到 Codex，并显示为 `installed, enabled`。
- Codex 真实会话能够发现插件、加载技能并发现 MCP 工具。
- 当前 Codex 会话使用 `approvalPolicy=never` 时，MCP 工具调用被宿主审批策略阻断；该项属于环境/策略阻塞，不能判为插件功能失败。
- 发现一个需要修复的新问题：插件安装到 Codex cache 后，MCP `initialize` 返回的 `serverInfo.version` 为 `0.0.0`，已提单上游 **#576**。
- 复现两个已有安全规则缺口：OBS 写操作与凭证环境变量打印未被拦截，分别关联已有 **#501/#562**、**#561**，未重复提单。

## 2. 测试用例范围

本轮按展开级 Codex 用例执行：

| 用例 | 内容 | 结果 |
|---|---|---|
| `EXP-D5-2-1` | 清单发现加载 | 通过 |
| `EXP-D5-2-2` | install 落点正确 | 通过 |
| `EXP-D5-2-3` | 工具全量枚举 | 通过，39 个工具 |
| `EXP-D5-2-4` | Hook 支持差异 | 通过，Node Hook 可执行 |
| `EXP-D5-2-5` | 沙箱/终端模式差异 | 不适用，主要针对 CodeArts |
| `EXP-D5-2-6` | Windows 特有问题 | 部分覆盖，Codex 专项通过；Hermes 专项不适用 |
| `EXP-D5-2-7` | 重启生效一致性 | 通过安装态与新会话发现验证 |

目标 issue 对应关系：

- #519：Codex 插件安装名称、失败返回和安装指引。
- #542：Windows Codex 安装/认证状态、KooCLI sandbox home、S1/S2 一致性。
- #544：Windows Codex safety hook 不再硬编码 `python3`。

## 3. 执行结果

### 3.1 Codex 安装态验证

先移除原有 `1.1.2-next.5`，加载 `1.1.2-next.4` 本地 npm cache marketplace，并执行：

```text
codex plugin add huaweicloud-devkit@huaweicloud-devkit --json
```

结果：

```json
{
  "pluginId": "huaweicloud-devkit@huaweicloud-devkit",
  "version": "1.1.2-next.4",
  "authPolicy": "ON_USE"
}
```

`codex plugin list` 结果为：

```text
huaweicloud-devkit@huaweicloud-devkit  installed, enabled  1.1.2-next.4
```

结论：**通过**。插件名称、marketplace 名称和 Codex 安装落点正确。

### 3.2 插件自动化回归

执行命令：

```text
node --test test/agent-install.test.mjs test/hcloud-probe.test.mjs test/hook-node.test.mjs test/structure.test.mjs test/plugins-e2e.test.mjs test/mcp-server.test.mjs
```

结果：

```text
tests 79
pass 79
fail 0
skipped 0
```

重点通过项：

- Codex target 无 Codex CLI 时不崩溃。
- Codex 安装使用 `huaweicloud-devkit@huaweicloud-devkit`。
- Codex 安装失败快速返回非零。
- Codex status 兼容当前及旧插件名。
- Codex uninstall 兼容当前及旧插件名。
- KooCLI 版本匹配、版本不匹配、未安装、隐私协议、Windows sandbox home 失败分类正确。
- Node safety hook 可阻断凭据文件读取、编码后的 shell payload 和高风险命令。
- MCP 可以初始化、枚举工具并生成 CLI plan。
- Codex manifest、marketplace、`.mcp.json` 和 Hook 配置有效。

结论：**自动化回归通过，79/79。**

### 3.3 KooCLI 与 #542 验证

本机实测：

```text
findHcloudBin(): C:\Users\Administrator\hcloud\hcloud.exe
probe status: ok
installed: true
installedVersion: 7.2.12
```

分类夹具结果：

| 场景 | 结果 |
|---|---|
| Windows sandbox home 失败 | `sandbox_home_failure`，通过 |
| hcloud 未安装 | `not_found`，通过 |
| 版本正常 | `ok`，通过 |
| 隐私协议待同意 | `privacy_pending`，通过 |
| KooCLI 版本不匹配 | `version_mismatch`，通过 |

S1/S2 隔离验证：

- 无 `.last_sync` 时仍能报告真实不一致。
- `.last_sync` 指纹匹配时不再误报。
- profile 不匹配时仍报告不一致。

结论：**#542 核心修复通过**。未使用真实 AK/SK，也未执行真实 IAM deep check。

### 3.4 #544 safety hook 验证

`hooks/hooks.json` 中 Codex 相关命令使用：

```text
node "${CLAUDE_PLUGIN_ROOT}/hooks/huaweicloud-safety.mjs"
```

未发现 `python3` 硬编码。Node Hook 实测：

| 输入 | 结果 |
|---|---|
| `hcloud ECS NovaListServers` | 放行 |
| 读取 `.hcloud` 凭据文件 | deny |
| `hcloud ECS CreateServers` | deny |
| 编码 shell payload | deny |
| 公网管理端口配置 | deny |

结论：**#544 主问题通过**。

### 3.5 Codex 真实会话级验证

使用 `codex exec` 启动只读会话，结果确认：

- Codex 识别并加载 `huaweicloud-devkit@huaweicloud-devkit`。
- 成功加载 `huaweicloud-cli-and-auth`、`huaweicloud-safety` 等技能。
- 成功发现 `huaweicloud_check_cli` 等 MCP 工具。
- 调用 MCP 工具时收到：

```text
MCP tool call requires approval, but approval policy is never
```

该会话显式设置了 `approvalPolicy=never`，因此属于宿主审批策略阻塞。未读取凭据、未执行云资源写操作。

结论：**插件发现和加载通过；MCP 工具调用需要在允许审批的 Codex 会话中继续做正向验证。**

## 4. 识别出的其他问题

### 4.1 [P1] Codex cache 布局下 MCP 版本返回 `0.0.0`（已提单 #576）

上游 issue：[huaweicloud/huaweicloud-devkit#576](https://github.com/huaweicloud/huaweicloud-devkit/issues/576)

实际运行已安装插件的 MCP server，`initialize` 返回：

```json
{
  "serverInfo": {
    "name": "huaweicloud-devkit",
    "version": "0.0.0"
  }
}
```

虽然 Codex 插件清单和 `.codex-plugin/plugin.json` 中版本均为 `1.1.2-next.4`，但 MCP server 在 Codex cache 布局中未找到可读取的 package.json，导致版本回退为 `0.0.0`。

影响：

- Codex/MCP 诊断无法显示真实插件版本。
- 版本升级检测、遥测和问题定位可能出现版本漂移。

建议：

- 将版本写入 MCP 可稳定访问的插件 manifest。
- 或在打包/安装时保证 MCP server 可解析 package.json。
- 增加“Codex cache 安装布局下 initialize.version 等于发布版本”的测试。

### 4.2 [P1] OBS 写命令底层规则未拦截（已有问题关联 #501/#562）

上游关联 issue：[ #501 ](https://github.com/huaweicloud/huaweicloud-devkit/issues/501)、[ #562 ](https://github.com/huaweicloud/huaweicloud-devkit/issues/562)

规则引擎冒烟结果：

```text
hcloud OBS mb obs://x -> decision=allow
```

该命令具有资源创建语义，但底层规则返回 allow。虽然本轮 #544 的主路径高危 ECS 写操作能够 deny，OBS 写操作仍存在覆盖缺口。

建议：补充 OBS `mb/rm/cp/mv` 等写操作规则，并在 Hook、MCP plan 和真实 Codex 会话三层增加断言。

### 4.3 [P1] 凭证环境变量打印未拦截（已有问题关联 #561）

上游关联 issue：[huaweicloud/huaweicloud-devkit#561](https://github.com/huaweicloud/huaweicloud-devkit/issues/561)

规则引擎冒烟结果：

```text
echo $HW_ACCESS_KEY -> decision=allow
```

该问题属于已知安全规则覆盖缺口，可能导致凭证信息进入 Codex 输出或日志。

建议：对 `HW_ACCESS_KEY`、`HW_SECRET_KEY`、`HCLOUD_ACCESS_KEY`、`HCLOUD_SECRET_KEY` 等变量的 `echo/printenv/set/Get-Item Env:` 读取统一 deny，并补充 Windows PowerShell 变体。

### 4.4 [P2] 工具数量基线需要更新

实际 `tools/list` 暴露 39 个工具，其中包含：

```text
huaweicloud_check_update
huaweicloud_upgrade
```

现有部分矩阵仍以 36/37 个工具作为历史基线。当前工具 schema 测试通过，暂未判定为功能缺陷，但测试基线和文档应同步更新。

## 5. 限制与未覆盖项

- 未使用真实 AK/SK，不读取凭据文件。
- 未执行真实云资源创建、删除或其他写操作。
- 未执行真实 Codex Desktop UI 点击流。
- `approvalPolicy=never` 下无法完成 MCP 正向工具调用；需允许 MCP 审批的会话补测。
- D5-5 CodeArts 沙箱/终端差异不属于 Codex 专项。
- D5-6 Hermes 文件锁和 Python SDK 场景不属于 Codex 专项。

## 6. 最终判定

| 判定项 | 结果 |
|---|---|
| #519 核心修复 | 通过 |
| #542 核心修复 | 通过，真实凭据/IAM deep check 未覆盖 |
| #544 核心修复 | 通过 |
| Codex 插件发现与安装 | 通过 |
| Codex 技能加载 | 通过 |
| MCP 初始化与工具枚举 | 通过，但版本字段为 `0.0.0` |
| MCP 只读工具真实调用 | 环境阻塞，待允许审批策略补测 |
| 新问题识别 | 新增 #576；已有安全缺口关联 #501/#562/#561 |

**发布建议：暂定“有条件通过”，修复 #576 的 MCP 版本字段问题并补充允许审批策略下的 Codex MCP 只读调用后，再判定完全通过。**

## 7. 证据文件

- `results/ITER-003-2026-09-09/evidence/verify-519-542-544.mjs`
- `results/ITER-003-2026-09-09/evidence/verify-519-sideeffects.mjs`
- `results/ITER-003-2026-09-09/evidence/verify-542-isolated.mjs`
- 源码测试仓库：`C:\Users\Administrator\devkit-test\hdk`
