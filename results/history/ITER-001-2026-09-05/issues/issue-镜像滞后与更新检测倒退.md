# 已提交：issue #518（2026-09-07）——https://github.com/huaweicloud/huaweicloud-devkit/issues/518

# 正文

## 标题
[Bug/发布] 正式版 1.1.1 发布后镜像源同步滞后：latest 安装报 ETARGET/拿到旧版，且更新检测误报"检测到新版本 1.1.0"（版本倒退）

## 概述

2026-09-07 发布 1.1.1 后，在 **npmmirror 与华为云 npm 镜像**两个镜像源上均出现同步滞后，直接影响用户安装与更新检测两条路径：

## P2 产品缺陷：checkForUpdate 更新检测受默认镜像 dist-tag 污染（版本倒退误报）

- **现象**：环境中已安装官方最新 **1.1.1**，执行 `huaweicloud-devkit install` 时提示 **「检测到新版本 1.1.0」**——向"已装最新版"的用户**误报存在可更新版本（且为更旧版本 1.1.0）**。
- **根因**：`checkForUpdate`（setup-cli.mjs）通过 `npm view` 查询 dist-tag，查询走用户默认 registry（镜像）；镜像 dist-tag 未同步（latest 仍指向 1.1.0）→ 与本地已装版本比较得出"有新版本"的错误结论。
- **影响**：误导用户执行无意义的 update（甚至降级）；镜像环境普遍受影响（深圳/国内用户默认镜像）。
- **建议**：① 更新检测固定使用官方 registry（registry.npmjs.org）或带镜像同步超时兜底；② 校验版本比较方向——远端版本 ≤ 本地版本时不得提示（抑制倒退）；③ 提示文案附带频道与已装版本。

## P3 发布/镜像流程：镜像同步滞后导致 latest 安装失败或拿到旧版

- **npmmirror（淘宝）**：`npm install -g huaweicloud-devkit@1.1.1`（.npmrc 默认指向淘宝镜像）报 **ETARGET**（镜像无 1.1.1 版本）——用户按锁定版本安装直接失败；改用 `--registry=https://registry.npmjs.org` 后成功。
- **华为云镜像（mirrors.huaweicloud.com）**：`dist-tags.latest = 1.1.0`（正式发布 1.1.1 后数小时未同步）——镜像环境 `npx huaweicloud-devkit@latest` 实际安装到旧版 1.1.0。
- **间接影响**：与上述 P2 叠加,镜像用户既装不到新版、又被更新检测反复提示。
- **建议**：① 发布检查清单增加"官方 registry dist-tag 更新 + 主要镜像同步确认"；② README/安装文档注明镜像滞后时的官方源命令；③ 评估 npm 发布脚本中镜像同步状态提示。

## 环境与复现信息

- 环境 A（DSH/DeepSeek Harness，ARM64，Node 22.23.2，npm 10.9.8，默认 registry=npmmirror）：安装 1.1.1 → ETARGET；官方源安装成功 → 重启前版本检查提示"检测到新版本 1.1.0"（问题记录见附件报告 4-5 节）
- 环境 B（Windows，Node 22.23.2，默认 registry=华为云镜像）：`npm view huaweicloud-devkit dist-tags` = `{latest: '1.1.0', next: '1.1.1-next.16'}`；`curl registry.npmjs.org` = `{latest: '1.1.1'}`（14:35:05Z 发布）
- 已装插件版本校验：opencode 安装 1.1.1 后 `status` 正常（MCP/Safety/Skills 29）

## 附件参考

- 安装测试报告：huaweicloud-devkit-install-report.md（DSH 环境完整过程：3.1-3.2 镜像 ETARGET、4-5 节问题记录与 doctor 输出）