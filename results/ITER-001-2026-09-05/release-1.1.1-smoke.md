# ITER-001-2026-09-05 正式版 1.1.1 发布冒烟（2026-09-07）

## 发布信息

- **latest = 1.1.1**（2026-09-07 14:35 发布，main @ 0fad14b，chore(release) #515）
- **next = 1.1.1-next.16**（= 我们的测试基线 dev @ 74b9642）——**正式版即测试内容**

## 冒烟结果（zhangshuang / opencode target）

| 项 | 结果 |
|---|---|
| 安装 `huaweicloud-devkit@latest`（官方 registry） | ✅ |
| 插件版本（package.json） | ✅ **1.1.1** |
| status | ✅ MCP Server: Installed ｜ Safety Policy: Installed ｜ **Skills: 29 installed** ｜ MCP config: Configured ｜ Node 22.23.2/linux |
| 与 next.16 行为一致性 | ✅ 安装/status/技能数一致（同源发布） |

## 本机（Windows）冒烟（2026-09-07 补充）

| 项 | 结果 |
|---|---|
| CLI banner（`npx @latest status`，官方 registry） | ✅ **HuaweiCloud DevKit v1.1.1** |
| 安装 1.1.1 到 openclaw（官方 registry，绕过镜像） | ✅ |
| `version` 列表 | ✅ **OpenClaw: 1.1.1**（Hermes 保持 next.16 未动） |
| status --target openclaw | ✅ MCP Server: Installed ｜ Safety Policy: Installed |
| **镜像验证** | 本机默认镜像 latest 仍 **1.1.0**（滞后确认，必须 `--registry=https://registry.npmjs.org`） |

## ⚠️ 附带发现：npm 镜像 dist-tag 滞后

- **本机默认 registry（华为云镜像 mirrors.huaweicloud.com）：latest=1.1.0**（14:35 发布后未同步）
- 官方 registry.npmjs.org：latest=1.1.1
- **影响**：用户 `npm i -g huaweicloud-devkit` / `npx huaweicloud-devkit@latest` 在镜像环境下**拿到旧版 1.1.0**——开发侧/用户侧可能误以为 latest 未更新；需镜像同步（或镜像环境显式 `--registry=https://registry.npmjs.org`）
- 与既有记录（华为云镜像缺海外包）同根：镜像维护滞后

## 结论

正式版 1.1.1 冒烟 PASS（与 next.16 一致）；镜像滞后问题建议反馈开发/运维（与 #501 基建缺口的镜像话题合并）。