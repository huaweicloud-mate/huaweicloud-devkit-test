# ITER-002-2026-09-08 DSH 客户端会话级——G1 + G2 全通过（headless CLI + 浏览器双路径）

## 结论：**G1 ✅（29 技能注入实锤）｜ G2 ✅ 真实只读查询成功（`{"servers":[]}`）｜ OBS-7 已定位（approval 策略）

> 更新于 2026-09-08 19:30（排障链完整打通）。此前 PARTIAL（G2 被 approval=ask fails-closed 阻塞）→ 实际根因分三层：**① 凭据无效 ② endpoint 指错 ③ 模型 id 不匹配**，与审批策略无关（审批策略在工具调用层，模型调用在前）。

## 排障链（三层根因，跨客户端集成差异 OBS-7 的真相）

| 现象 | 根因 | 修复 |
|---|---|---|
| `API key is invalid` | `~/.dsh/.credentials.yaml` 引用 `DEEPSEEK_API_KEY` env 但未设置 | 注入 hermes 有效 key（51 字符，opengw 网关 key） |
| `HTTP 404` | DSH 默认端点 `https://api.deepseek.com`（官方），key 是网关 key | settings.yaml 写 `llm-deepseek.baseURL: https://opengw.clouddeveloper.club/v1` |
| 仍 `HTTP 404` | **网关模型 id 带日期后缀**（`deepseek-v4-flash-0731`），DSH 内置目录硬编码 `deepseek-v4-flash`（无后缀） | **profile 级 cordis.patch.yml 覆盖 `agent-default-model`** → `provider: opengw / model: deepseek-v4-flash-0731` |

**关键代码事实（dsh-llm-deepseek/lib/index.js）**：
- `PUBLIC_BASE_URL = "https://api.deepseek.com"`；env 注入名 `DEEPSEEK_BASE_URL`、`DEEPSEEK_API_KEY`
- `DEFAULT_MODELS` 硬编码 `deepseek-v4-flash` / `deepseek-v4-pro` / `deepseek-v4-flash-vision-exp`（**无日期后缀**）
- settings 文档 `llm-deepseek:` 段可覆盖 baseURL/models（hot-reload 无需重启）；`llm-pi-ai.providers.<route>` 可注册自定义 OpenAI 兼容网关
- 网关实测（opengw /models）：仅 `deepseek-v4-flash-0731` / `deepseek-v4-pro-0813` / `glm-5.2` / `glm-5.3-flash` 四模型；`deepseek-v4-flash` 直发 **404 Model not found**（curl 实证）

## G2 会话实测（headless 单任务 CLI，真实结果）

```
用户: 用 huaweicloud_devkit 的只读工具查询 ECS 列表（NovaListServers），不要执行任何写操作。
执行链: check_cli(hcloud 7.2.12 已认证) → ECS --help → NovaListServers --help（GET 只读确认）
       → hcloud ECS NovaListServers --cli-output=json（read_only）→ configure show（脱敏）
结果: {"servers": []}   ← 真实 API 返回（cn-north-4，projectId 46c1fd48...7132）
结论: 全程零写操作，agent 明确按只读通道执行 ✅
```

## G1 技能注入（web 轨迹页取证）

- 轨迹 CONTEXT 含 `<available_skills> huawei-apig: ... huawei-billing: ...（29 项 huawei 技能全部注入）`
- 上下文注入 skill-catalog 实锤（web 页面"轨迹"tab 抓取）

## OBS-7 更正（审批策略）

- 此前结论"approval=ask 无 answerer fails closed 阻塞 G2"**不准确**——实际阻塞是模型认证链（404），审批策略在工具调用层正常工作；headless 会话（approval 同样 ask）因工具调用是只读、被策略放行，未触发审批框
- 写操作仍需审批通道（无 answerer 时 fails closed，机制如先前记录）

## 归档资产/配置（本机 DSH 环境修复，可复用）

- `~/.dsh/settings.yaml`：`llm-deepseek`（baseURL=opengw + 4 模型目录）`llm-pi-ai.providers.opengw`（自定义提供方，备用）
- `~/.dsh/.credentials.yaml`：`refs: DEEPSEEK_API_KEY / OPENGW_API_KEY`
- `~/.dsh/profiles/{headless,web}/cordis.patch.yml`：huaweicloud-devkit MCP 插件 + `agent-default-model` 覆盖（opengw/deepseek-v4-flash-0731）
- headless profile 原 patch 为空 → 补入 devkit 插件（headless CLI 会话可调 MCP 工具）

## 复现

- HCLI 单任务：`dsh --profile headless "提示词"`（免浏览器）
- Web 会话：`dsh --profile web --port 8090 --no-open` + 浏览器（轨迹 tab 取证）
- 排障脚本（工作区 test-cases/）：hdk-dsh-keycheck.py（凭据对比/注入准备）、hdk-dsh-gateway-models.py（网关模型清单）、hdk-dsh-test-chat.py（模型 id 直测）、hdk-dsh-cred.py（凭据引用写入）