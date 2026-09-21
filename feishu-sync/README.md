# 飞书测试全景图同步工具（feishu-sync）

> **归档说明（2026-09-21）**：本目录是 `feishu-sync` 工具链的版本化归档（随 huaweicloud-devkit-test 仓库 main 分支管理）。
> ① **凭证不入库**：`.credentials.json`（App Secret）、`.user_token.json`（OAuth user token）、`config.json`（app_token）经 DPAPI 加密、只存本机，已被 .gitignore 排除，仓库中绝无明文。
> ② **资源标识经环境变量注入**：`FEISHU_SS_TOKEN`（线上电子表格 token）、`FEISHU_OWNER_OPEN_ID`（表格 owner open_id）、`FEISHU_WIKI_TOKEN`（wiki 页面 token）由本机环境变量提供，脚本不硬编码，公开仓库无泄漏。
> ③ 本机运行版「同一套代码」：资源标识同样经环境变量注入，真值在本机 `devkit-test\feishu-sync\.env.feishu`（已被 .gitignore 排除）；本归档版与运行版零漂移。

把本地测试全景图 xlsx（权威源）同步为**飞书多维表格**（协作视图），供团队在飞书
中查看/筛选/评论测试任务。按主键（用例 ID / 缺陷 ID）做增量 upsert，本地不变更不
打扰飞书端。

## 一、前置：飞书开放平台创建企业自建应用（约 5 分钟，需飞书管理员权限）

1. 打开 https://open.feishu.cn/app →「创建企业自建应用」，名称如
   `HuaweiCloud DevKit 测试机器人`
2. 「添加应用能力」→ 添加 **机器人**（这样它会在飞书里以机器人身份出现）
3. 「权限管理」→ 开通权限（点击 API 会自动提示依赖权限）。按需勾选，**最少可只开第 1 项**：

   ① 读写多维表格（本工具核心，必开）
   | 权限 scope | 控制台显示名 | 用途 |
   |---|---|---|
   | `bitable:app` | 查看、评论、编辑和管理多维表格 | 读写多维表格（全景图同步） |

   ② 发群组消息 / 飞书通知（机器人主动发消息）
   | 权限 scope | 控制台显示名 | 用途 |
   |---|---|---|
   | `im:message:send_as_bot` | 以应用的身份发消息 | **发消息核心权限**（三者任一即可，推荐此项最小） |
   | `im:message` | 获取与发送单聊、群组消息 | 发消息 + 读消息（范围更大，按需） |
   | `im:chat:readonly` | 查看群信息 | 获取群列表/群信息（拿 chat_id） |
   | `im:chat.member:readonly` | 读取群成员列表 | 读群成员（如@提醒场景，可选） |

   ③ 接收群消息指令（机器人在群里被 @ 后响应、触发同步，可选）
   | 权限 scope | 控制台显示名 | 用途 |
   |---|---|---|
   | `im:message.p2p_msg` 或 `im:message.p2p_msg:readonly` | 获取/读取用户发给机器人的单聊消息 | 接收私聊指令 |
   | `im:message.group_at_msg` | 获取用户在群组中@机器人的消息 | 接收群 @ 指令（仅用户，不含机器人） |
   | `im:message.group_at_msg.include_bot:readonly` | 获取群组中其他机器人和用户@当前机器人的消息 | 含群内其他机器人消息的 @ |

   > 对应事件：需在「事件订阅」中订阅 **接收消息 v2.0（im.message.receive_v1）**，
   > 并用长连接（WebSocket）或回调 URL 接收推送。仅做主动通知可不开这组。
4. 「版本管理与发布」→ 创建版本 → 发布（企业管理员审批或自审，取决于企业设置）
5. 「凭证与基础信息」→ 拿到 **App ID** 和 **App Secret**

> App Secret 只显示一次，注意保存。本工具会用 Windows DPAPI 加密存储，不落明文。

## 二、安装依赖（一次性）

```powershell
uv venv C:\Users\Administrator\devkit-test\.venv-feishu
uv pip install --python C:\Users\Administrator\devkit-test\.venv-feishu\Scripts\python.exe openpyxl requests
```

## 三、配置凭证（一次性，交互录入 + DPAPI 加密 + 自动验证）

```powershell
uv run --python C:\Users\Administrator\devkit-test\.venv-feishu\Scripts\python.exe `
  C:\Users\Administrator\devkit-test\feishu-sync\sync_panorama.py --setup
```

按提示输入 App ID / App Secret。验证通过后生成 `.credentials.json`（DPAPI 加密，
仅当前 Windows 用户可解密）。

## 四、使用

### 方式 A：一键新建多维表格（推荐首次）

```powershell
python sync_panorama.py --create "HuaweiCloud DevKit 测试全景图" --sync <全景图.xlsx路径>
```

### 方式 B：复用已有表格

1. 打开目标多维表格，浏览器地址栏复制 `https://feishu.cn/base/<app_token>`
2. 编辑 `feishu-sync\config.json`，填入 `"app_token": "<app_token>"`
3. 增量同步：

```powershell
python sync_panorama.py --sync <全景图.xlsx路径>
```

### 参数说明

| 参数 | 说明 |
|---|---|
| `--setup` | 录入/更换凭证（DPAPI 加密） |
| `--create NAME` | 创建新多维表格 + 数据表 + 全量写入 |
| `--sync XLSX` | 增量同步（新增/更新，按 ID） |
| `--rebuild` | 配合 `--sync`：清空数据表后全量重写 |

## 五、同步的 5 张数据表

| 本地 sheet | 主键 | 记录量 |
|---|---|---|
| 测试矩阵-设计级（14 列） | ID（D1-1…） | ~123 |
| 测试矩阵-展开级（9 列） | ID（EXP-…） | ~107 |
| 缺陷清单（7 列） | ID（P0-1…） | ~18 |
| 验收标准（3 列） | 门禁项 | 8 |
| 执行计划（4 列） | 阶段 | 7 |

> 「总览」为大屏指标卡（合并单元格），不适宜多维表格，暂不同步；需要的话可后续
> 做成一张「总览指标」表。

## 六、线上 Wiki 表格维护（推荐主路径）

**维护约定**：本地 `devkit-test` 为维护入口，线上 wiki 表格为呈现，两侧保持一致。
线上电子表格（wiki 页面）：
- spreadsheet token: `<FEISHU_SS_TOKEN>`（本机经环境变量注入，不入公开仓库）
- wiki 页面: `<FEISHU_WIKI_TOKEN>`（14 个 sheet，同上）

**鉴权说明**：飞书文档协作机制**不支持"应用"对象**（协作者仅限用户/群组/部门），
知识库成员 UI 也无应用类型入口。因此采用 **OAuth 用户授权**——应用以文档 owner 的
user_access_token 身份读写表格，写权限天然满足。

### 首次授权（一次性）
```powershell
python oauth_setup.py
```
浏览器打开脚本输出的链接 → 授权 → token 加密存 `.user_token.json`（DPAPI，
2h 有效，refresh_token 自动轮换续期，无需重新授权）。

### 日常同步（2026-09-10 起：工作源 = `devkit-test\test manage\`）
```powershell
# 本地 xlsx -> 线上（新增/更新按主键，手工表测试机资源/版本计划管理/测试分工不动）
python sync_sheet.py --push "C:\Users\Administrator\devkit-test\test manage\huaweicloud-devkit-测试全景图.xlsx"
#   简写: run_push.bat（内部 subprocess 规避 shell 引号；路径在 feishu_push_runner.py 里）

# 线上 -> 本地镜像（全量 14 sheet 含手工表）
python sync_sheet.py --pull

# 【推荐】线上 wiki 手工更新 -> 合并回本地工作源（一键：pull + 按主键 upsert + 手工表并入 + 备份 .bak-pull）
python pull_merge.py          # 合并回 test manage 工作源
python pull_merge.py --dry-run   # 预览不写回

# 预览差异（不写线上）
python sync_sheet.py --diff <本地全景图.xlsx>
#   简写: run_diff.bat
```

### OAuth 授权（token 过期时，错误码 99991677）
```powershell
python oauth_setup.py   # 本机起 8765 回调 + 打印授权链接 → 浏览器同意 → DPAPI 保存（2h 有效，refresh 自动轮换）
```
> 2026-09-10 实证：长期未同步后 user_access_token 过期报 `99991677`，重跑 oauth_setup.py 授权即恢复。

### 2026-09-10 工具修复记录（首次真实同步时发现并修复）
1. `write_online` 原用 `PUT /sheets/v2/.../values/{range}` —— **飞书无此接口（404）**；改为 `POST /values_batch_update`（body 字段名 **`valueRanges`**，不是 data）
2. `values_append` 写多行会报 `90202 rows of value > range`（range 只给 1 行）；矩阵新增改为**直写表尾空行**（定位 `hrow+2+len(fdata)` 起）
3. 已知差异项：线上「MCP工具清单」B 列在某些行是合并单元格（非左上角）→ push 写不进该格，diff 恒显 1 行差异（工具名主体在 C/E 列已同步，无害）
4. daily_sync.ps1 源改为 test manage 工作源（原 panorama 目录）

### 表类型
| 类型 | sheet | 同步策略 |
|---|---|---|
| 矩阵型 | 测试矩阵-设计级/展开级、缺陷清单、验收标准、执行计划 | 按主键 ID upsert（新增追加/差异更新/线上多余的保留） |
| 快照型 | 总览、被测形态、MCP工具清单、Skill清单、安全规则、测试资产 | 以本地为准整表覆盖 |
| 手工表 | 测试机资源、版本计划管理、测试分工 | push 不动，pull 原样保留 |

## 七、定时自动同步（可选，建议每晚 20:00 与 GitHub 归档同步同节奏）

```powershell
schtasks /Create /TN "feishu-panorama-sync" /TR "cmd /c `"uv run --python ... sync_panorama.py --sync ...`"" /SC DAILY /ST 20:05 /F
```

## 七、安全说明

- 凭证仅存于本机 `.credentials.json`（DPAPI 加密，绑定当前 Windows 用户）
- 所有 API 调用仅发往 `open.feishu.cn` 官方域名
- 飞书端可见范围：默认仅应用创建者；如需团队成员可见，在「安全设置 → 可用范围」添加成员/部门