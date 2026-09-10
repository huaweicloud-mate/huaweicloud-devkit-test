# ITER-005-2026-09-10 基线记录

## 被测版本

| 项 | 值 |
|---|---|
| 被测版本 | `huaweicloud-devkit@1.1.3-next.2` |
| npm dist-tags | latest=1.1.2, next=1.1.3-next.2 |
| next gitHead | `c6c0965f0bdf6181abef65edb6fee7ed2115cd68` |
| 发布 commit | `chore(release): 1.1.3-next.2 (#593)` |
| 核心功能 commit | `baa169c feat(install): interactive zero-detection install menu + generic MCP wiring (#592)` |
| 源码基线 | `devkit-test/hdk` checkout detached @ c6c0965（CRLF） |
| 对照基线 | 1.1.2-next.4 = 608b120 |

## 测试范围

根据开发侧《2026-09-09 全量问题集 总设计/总计划文档》，验证 PR #592 的 25 项改动落地：
D1–D8 / C1–C5 / P1–P7 / R1–R2 / O1–O2 / P9。

## 运行环境

| 项 | 值 |
|---|---|
| Windows 本机 | Node v22.23.2 / npm 10.9.8 / PowerShell 5.1 |
| Linux 真机 | zhangshuang 113.44.143.91 (Ubuntu 24.04 aarch64), /opt/node22/bin/node v22.23.2 |
| 验证入口 | 本机 `npx @next` + `bin/setup.cjs`；Linux `node --test test/agent-install.test.mjs` + `script -qec` PTY |

## 关键环境事件

- 隔离 HOME 测试时，`officeace` 检测通过注册表 `readOfficeaceRegistryInstallDir()` 定位真实
  LOCALAPPDATA 安装目录，**不受 USERPROFILE 隔离**，导致 P1-4 场景意外直装到真实 OfficeAce。
  已用 `uninstall --target officeace` 精确反向清理（capabilities.json 58541→53026 字节、
  huawei 条目 0 残留、huaweicloud-plugins/skills 已删）。属测试方法教训，非产品缺陷。
- 0 检测 / 1 检测 / TTY 菜单 / MCP 接入类用例在 Windows 上无法干净隔离 officeace，
  且上游单测对此类用例 `skip: process.platform === 'win32'`，故转 Linux 真机验证。