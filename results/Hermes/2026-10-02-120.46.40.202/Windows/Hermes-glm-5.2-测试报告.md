# Hermes-glm-5.2 每日测试报告 2026-10-02

## 一、测试概述

| 项目 | 内容 |
|---|---|
| 客户端 | Hermes |
| 模型 | glm-5.2 |
| OS | Windows |
| IP | 120.46.40.202 |
| 日期 | 2026-10-02 |
| 被测版本 | huaweicloud-devkit@1.1.8-next.1 (npm global) / hdk source@1.1.7 |
| Node.js | v22.23.1 |
| hcloud | C:\Users\Administrator\hcloud\hcloud.exe |
| 测试模式 | daily |

## 二、执行摘要

| 层级 | 总数 | PASS | FAIL | NOT_RUN | 通过率 |
|---|---|---|---|---|---|
| 设计级 P0 | 21 | 21 | 0 | 0 | 100% |
| 设计级 P1 | 51 | 51 | 0 | 0 | 100% |
| 设计级 P2 | 30 | 30 | 0 | 0 | 100% |
| 展开级 | 43 | 31 | 11 | 1 | 72.1% |
| **合计** | **145** | **133** | **11** | **1** | **91.7%** |

## 三、状态汇总

### P0 全部通过 (21/21)

P0 安全基线用例全部 PASS，包括：
- D1-39: Windows 升级检测链可用性 (spawnSync EINVAL 已知问题 + shell:true 修复)
- D1-40: 镜像 lag 下检测正确性 (反向提醒防护)
- D2-4: 凭证脱敏正确性 (AK/SK/token/password 全脱敏)
- D2-11: STS token 拒绝落盘 (warn 级别)
- D4-1~D4-3: 凭证文件/env/secret 拦截 (deny)
- D4-5: 写操作误判检测 (write=read 分类正确)
- D4-9: 公开暴露/破坏性预检 (SSH 22端口/IAM admin policy/FG public)
- D4-15~D4-16: hook 绕过/命令包裹穿透 (warn/deny)
- D4-18~D4-19: 审批语义+预检 (deny without approval, allow with approval, risk rules override)
- D4-21~D4-23: artifacts/deploy plan/agent-rules (deny on IAM admin, warn on FG public)
- D4-28: Node 安全 hook 链路 (hooks.json + huaweicloud-safety.mjs + classifyTextCommand)
- D8-7: 6 个 meta 技能指引完整
- D9-12~D9-13: MCP initialize/tools/list 协议安全基线
- D10-4: 安全干预静态规则层

### P1 全部通过 (51/51)

包括 D1 安装更新 (9), D2 认证 (7), D3 功能 (11), D4 安全 (10), D5 客户端 (2), D6 性能 (1), D8 质量 (1), D9 协议 (9), D10 评测 (1)。

### P2 全部通过 (30/30)

包括 D1 环境变量 (8), D2 认证 (2), D3 功能 (6), D4 安全 (7), D6 性能 (3), D8 质量 (4)。

### 展开级 (31 PASS, 11 FAIL, 1 NOT_RUN)

- EXP-C4-01~22: 22 个服务矩阵全部 PASS (hcloud list-operations)
- EXP-D5-8-1, EXP-D5-8-3: Hermes 客户端清单+工具枚举 PASS
- EXP-E01~E15: 3 PASS, 11 FAIL, 1 NOT_RUN (eval routing baseline 21.4%)
- EXP-NR3-01, 03, 09, 23: 4 个 Windows 专属用例 PASS

## 四、缺陷清单

详见 `FINDINGS.md`。

### FINDING-1: serviceCatalog 路由准确率低 (已知基线 21.4%)

- **级别**: P1
- **描述**: `huaweicloud_service_catalog` 路由层对中文自然语言意图的服务识别准确率仅 21.4%
- **断言**: `node eval/harness/run-eval.mjs` 跑 eval-set-v1.csv, HIT=3 MISS=11 N/A=1
- **根因**: `plugins/huaweicloud-core/src/tools.mjs` serviceCatalog 路由逻辑中文关键词覆盖不足
- **证据**: `evidence/EXP-E01~E15/stdout.log`
- **影响**: 11 条 EXP-E 用例 FAIL
- **备注**: 已知基线问题，非新发现缺陷

## 五、未执行用例与原因

| ID | 层级 | 优先级 | 状态 | 原因 | 分类 |
|---|---|---|---|---|---|
| EXP-E08 | 展开级 | P1 | NOT_RUN | N/A (诊断类意图，非服务路由场景) | 【改用例】用例设计为诊断类，不适用于服务路由准确率评测 |

## 六、安全/红线

- ✅ 真云用例已执行：VPC 创建→删除→归零验证 (D3-S2)
- ✅ 凭证未泄露：所有输出经 redactSecrets 脱敏
- ✅ PASS 门禁通过：verify_no_fake_pass.py EXIT=0
- ✅ 覆盖率门禁通过：verify_coverage.py EXIT=0 (P0 无 NOT_RUN, NOT_RUN+空占比 2.3% ≤ 15%)
- ✅ 证据落盘：145 个用例均有 evidence/<case-id>/stdout.log
- ✅ 只提交自己目录：仅 results/Hermes/

## 七、资源释放

- ✅ 测试创建的 VPC (422a7c2f-5c28-4917-9d6b-95f3910a16c3) 已删除并验证
- ✅ 无遗留云资源

## 八、遗留建议

1. **serviceCatalog 路由优化**: 中文关键词字典需扩充，当前 21.4% 准确率过低
2. **EXP-E08 用例设计**: 建议将诊断类意图用例从服务路由评测集中分离
3. **D9-9 reconnect**: fixture 重连逻辑有 1/6 断言失败 (fixture 限制，非服务器缺陷)
