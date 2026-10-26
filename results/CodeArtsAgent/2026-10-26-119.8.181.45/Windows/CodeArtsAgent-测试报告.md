# CodeArtsAgent-CodeArts 每日测试报告

> **报告名**：
> **生成时间**：（北京时间）
> **执行归档**：
> **被测对象**：huaweicloud-devkit（GitHub ）
> **结论**：（有 FAIL 且 P0 缺口）

---

## 一、测试概述

| 项 | 值 |
|---|---|
| 客户端 / Agent |  +  |
| OS / 架构 |  |
| Node / npm / Python |  |
| 被测版本（SUT） | （npm latest，gitHead ） |
| 工具全集 | （ TOOL_DEFINITIONS） |
| hcloud / 依赖 | [1;91m[USE_ERROR]参数doctor的格式错误,正确格式为:--param=value[0m |
| 真云凭证 |  |
| 测试类型 | 源码级探针 / MCP 协议 / 真机 CLI |
| 设计真源 | 设计级 107 / 展开级 39 / 追踪表 216 列 |
| daily 基础用例 | 设计级 81 / 展开级 71 |

---

## 二、执行摘要

| 项 | 值 |
|---|---|
| 计划用例（daily） | 107（设计级）+ 39（展开级） |
| 已执行 | 7 |
| PASS / FAIL / BLOCKED / SPEC-MISMATCH / NOT_RUN |  |
| 通过率（分母 = PASS+FAIL+SPEC-MISMATCH，不含 BLOCKED/NOT_RUN） |  |
| P0 / P1 / P2 新增缺陷 |  |
| 红线（I 类）违规 |  |
| 资源释放 |  |

---

## 三、状态汇总

### 3.1 设计级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 5 | D2-4, D8-7, D9-12, D9-13, D10-4 |
| FAIL | 2 | D1-39, D1-40（同一根因） |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 0 | — |
| **合计** | **7** | 已执行用例 |

### 3.2 展开级

| 状态 | 数量 | 说明 |
|---|---|---|
| PASS | 0 | — |
| FAIL | 0 | — |
| BLOCKED | 0 | — |
| SPEC-MISMATCH | 0 | — |
| NOT_RUN | 39 | 本轮未覆盖 |
| **合计** | **39** | |

---

## 四、缺陷清单

| # | 级别 | 用例ID | 缺陷描述 | 期望结果（精确断言） | 实际结果 | 根因（文件:行号） | P/G/I | 状态 |
|---|---|---|---|---|---|---|---|---|
| 1 | P0 | D1-39 | Windows 升级检测链 EINVAL 静默失败 | queryDistTagsSync 返回有效 dist-tags | 返回 null，spawnSync npm.cmd EINVAL |  | P | 待提单 |
| 2 | P0 | D1-40 | 镜像 lag 下检测正确性 | queryDistTags 返回有效 dist-tags | 返回 null，与 D1-39 同根因 |  | P | 待提单 |

### 根因详情

**#1 [P0] D1-39 Windows 升级检测链 EINVAL 静默失败**

- 期望： 返回有效 dist-tags（）
- 实际：返回 ，spawnSync 执行 npm <command>

Usage:

npm install        install all the dependencies in your project
npm install <foo>  add the <foo> dependency to your project
npm test           run this project's tests
npm run <foo>      run the script named <foo>
npm <command> -h   quick help on <command>
npm -l             display usage info for all commands
npm help <term>    search for help on <term> (in a browser)
npm help npm       more involved overview (in a browser)

All commands:

    access, approve-scripts, audit, bugs, cache, ci,
    completion, config, dedupe, deny-scripts, deprecate, diff,
    dist-tag, docs, doctor, edit, exec, explain, explore,
    find-dupes, fund, get, help, help-search, init, install,
    install-ci-test, install-scripts, install-test, link, ll,
    login, logout, ls, org, outdated, owner, pack, patch, ping,
    pkg, prefix, profile, prune, publish, query, rebuild, repo,
    restart, root, run, sbom, search, set, stage, start, stop,
    team, test, token, trust, undeprecate, uninstall, unpublish,
    update, version, view, whoami

Specify configs in the ini-formatted file:
    C:\Users\Administrator\.npmrc
or on the command line via: npm <command> --key=value

More configuration info: npm help config
Configuration fields: npm help 7 config

npm@12.1.0 C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2-2\node_modules\npm 报 
- 根因：
   函数中  缺少  参数，Windows 下执行 npm <command>

Usage:

npm install        install all the dependencies in your project
npm install <foo>  add the <foo> dependency to your project
npm test           run this project's tests
npm run <foo>      run the script named <foo>
npm <command> -h   quick help on <command>
npm -l             display usage info for all commands
npm help <term>    search for help on <term> (in a browser)
npm help npm       more involved overview (in a browser)

All commands:

    access, approve-scripts, audit, bugs, cache, ci,
    completion, config, dedupe, deny-scripts, deprecate, diff,
    dist-tag, docs, doctor, edit, exec, explain, explore,
    find-dupes, fund, get, help, help-search, init, install,
    install-ci-test, install-scripts, install-test, link, ll,
    login, logout, ls, org, outdated, owner, pack, patch, ping,
    pkg, prefix, profile, prune, publish, query, rebuild, repo,
    restart, root, run, sbom, search, set, stage, start, stop,
    team, test, token, trust, undeprecate, uninstall, unpublish,
    update, version, view, whoami

Specify configs in the ini-formatted file:
    C:\Users\Administrator\.npmrc
or on the command line via: npm <command> --key=value

More configuration info: npm help config
Configuration fields: npm help 7 config

npm@12.1.0 C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2-2\node_modules\npm 报  静默失败



- 证据：，复现命令  实测返回 

---

## 五、未执行用例与原因

| 用例ID | 层级 | 优先级 | 状态 | 分类 | 详细原因 | 改用例建议 |
|---|---|---|---|---|---|---|
| D4-1 | 设计级 | P0 | BLOCKED | 补环境 | 需 hook-capable 客户端（Hermes），CodeArtsAgent 不支持 hook | — |
| D4-2 | 设计级 | P0 | BLOCKED | 补环境 | 需 hook-capable 客户端（Hermes），CodeArtsAgent 不支持 hook | — |
| D4-3 | 设计级 | P0 | BLOCKED | 补环境 | 需 hook-capable 客户端（Hermes），CodeArtsAgent 不支持 hook | — |
| D4-5 | 设计级 | P0 | BLOCKED | 补环境 | 需 hook-capable 客户端（Hermes），CodeArtsAgent 不支持 hook | — |
| D4-9 | 设计级 | P0 | BLOCKED | 补环境 | 需 hook-capable 客户端（Hermes），CodeArtsAgent 不支持 hook | — |
| D4-15 | 设计级 | P0 | BLOCKED | 补环境 | 需 hook-capable 客户端（Hermes），CodeArtsAgent 不支持 hook | — |
| D4-16 | 设计级 | P0 | BLOCKED | 补环境 | 需 hook-capable 客户端（Hermes），CodeArtsAgent 不支持 hook | — |
| D4-18 | 设计级 | P0 | BLOCKED | 补环境 | 需 hook-capable 客户端（Hermes），CodeArtsAgent 不支持 hook | — |
| D4-19 | 设计级 | P0 | BLOCKED | 补环境 | 需 hook-capable 客户端（Hermes），CodeArtsAgent 不支持 hook | — |
| D4-21 | 设计级 | P0 | BLOCKED | 补环境 | 需 hook-capable 客户端（Hermes），CodeArtsAgent 不支持 hook | — |
| D4-22 | 设计级 | P0 | BLOCKED | 补环境 | 需 hook-capable 客户端（Hermes），CodeArtsAgent 不支持 hook | — |
| D4-23 | 设计级 | P0 | BLOCKED | 补环境 | 需逐个安装目标测试，CodeArtsAgent 单一客户端 | — |
| D4-28 | 设计级 | P0 | BLOCKED | 补环境 | 需 hook-capable 客户端（Hermes），CodeArtsAgent 不支持 hook | — |
| D2-11 | 设计级 | P0 | BLOCKED | 补环境 | 需真云 AK/SK + securityToken，测试环境未配置 | — |

---

## 六、安全与红线合规

- [x] 凭证泄漏事件：
- [x] 写操作误判 read-only：
- [x] 红线（I 类）违规：
- [x] 脱敏复核：证据目录无原始凭证/未脱敏日志

---

## 七、资源释放

| 资源 | 创建 | 销毁 | 归零验证 |
|---|---|---|---|
| 无 | — | — | — |

---

## 八、遗留与建议

- 待裁决 SPEC：无
- 本轮未覆盖：展开级 39 用例、D4 安全 hook 用例（需 Hermes 客户端）、D2-11（需真云 token）
- 建议：修复  缺少  参数，Windows 下升级检测链不可用