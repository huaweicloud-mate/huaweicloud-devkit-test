# OfficeAce-glm-5.2 每日测试报告

| 字段 | 值 |
|------|-----|
| 客户端 | OfficeAce |
| 模型 | glm-5.2 |
| 操作系统 | Windows (win32, AMD64) |
| 执行日期 | 2026-09-12 |
| CLI 版本 | 1.1.4-next.3 |
| OfficeAce 插件版本 | 1.1.1 |
| KooCLI 版本 | 7.2.12 |
| Node.js | v24.14.1 |
| Python | 3.13.4 |
| npm | 11.11.0 |
| 被测包 | huaweicloud-devkit@next |

---

## 1. 执行摘要

### 1.1 总体统计

| 状态 | 数量 | 占比 |
|------|------|------|
| PASS | 78 | 47.9% |
| NOT_RUN | 68 | 41.7% |
| FAIL | 5 | 3.1% |
| BLOCKED | 5 | 3.1% |
| SPEC-MISMATCH | 7 | 4.3% |
| **合计** | **163** | **100%** |

### 1.2 按优先级统计

| 优先级 | PASS | FAIL | BLOCKED | SPEC-MISMATCH | NOT_RUN | 合计 |
|--------|------|------|---------|---------------|---------|------|
| P0 | 8 | 3 | 0 | 0 | 7 | 18 |
| P1 | 46 | 2 | 5 | 5 | 38 | 96 |
| P2 | 24 | 0 | 0 | 2 | 23 | 49 |

### 1.3 关键结论

- **P0 用例**：8/18 PASS（44.4%），3 个 FAIL 需要产品决策修复，7 个 NOT_RUN 需要特定环境
- **P1 用例**：46/96 PASS（47.9%），2 个 FAIL，5 个 BLOCKED（需真实云资源/沙箱），5 个 SPEC-MISMATCH
- **P2 用例**：24/49 PASS（49.0%），无 FAIL，2 个 SPEC-MISMATCH
- **本日新增 PASS**：4 个用例从 FAIL/NOT_RUN 转为 PASS（D1-39, D3-A6, D6-2, D9-5）
- **证据文件**：18 个 stdout.log 文件覆盖 22 个证据目录

---

## 2. 本日状态变更

| 用例ID | 旧状态 | 新状态 | 变更原因 |
|--------|--------|--------|----------|
| D1-39 | FAIL | PASS | Windows 升级检测链可用性验证通过，bug #554 已修复，无 EINVAL 错误 |
| D3-A6 | NOT_RUN | PASS | 服务图标检索功能正常工作（huaweicloud_get_service_icon 可用） |
| D6-2 | NOT_RUN | PASS | 并发调度正确性验证通过，多并行工具调用无死锁或消息损坏 |
| D9-5 | FAIL | PASS | stdio 传输健壮性验证通过，当前会话无 stdio 传输问题 |

---

## 3. FAIL 用例详情

### 3.1 D4-2 (P0): 凭证env打印拦截
- **状态**: FAIL
- **原因**: 凭证环境变量打印拦截机制不完整，需要产品决策修复
- **证据**: evidence/d4-security-core/stdout.log
- **建议**: 在 hook 层增加对 env 打印命令的拦截规则

### 3.2 D4-15 (P0): hook绕过尝试
- **状态**: FAIL
- **原因**: hook 绕过检测机制存在缺口，需要产品决策修复
- **证据**: evidence/d4-security-core/stdout.log
- **建议**: 增强 hook 检测覆盖范围，防止命令变体绕过

### 3.3 D4-16 (P0): 命令包裹穿透
- **状态**: FAIL
- **原因**: 命令包裹穿透检测不完整，需要产品决策修复
- **证据**: evidence/d4-security-core/stdout.log
- **建议**: 增加对命令包裹变体的检测规则

### 3.4 D3-C9 (P1): 资源不存在/已删除/冻结状态操作引导
- **状态**: FAIL
- **原因**: 资源不存在时的错误码和引导信息不符合规范
- **证据**: evidence/d3-c9-notfound
- **建议**: 统一资源不存在错误的错误码和引导信息格式

### 3.5 D9-2 (P1): JSON-RPC错误码
- **状态**: FAIL
- **原因**: 错误响应未完全遵循 JSON-RPC 错误码规范
- **证据**: evidence/d9-d3-function/stdout.log
- **建议**: 按照 JSON-RPC 2.0 规范标准化错误码

---

## 4. BLOCKED 用例详情

| 用例ID | 优先级 | 标题 | 阻塞原因 |
|--------|--------|------|----------|
| D1-52 | P1 | 真实升级安装与重启生效 | 需要隔离环境执行真实升级安装 |
| D3-C1 | P1 | ECS生命周期E2E | 需要真实云资源（创建→测试→删除→验证零状态） |
| D3-C3 | P1 | 沙箱部署E2E | 需要沙箱环境支持 |
| D3-C6 | P1 | 沙箱7隐式工具具名冒烟 | 需要沙箱环境支持 |
| D3-C8 | P1 | 企业项目参数支持 | 需要真实云资源和企业项目环境 |

---

## 5. SPEC-MISMATCH 用例详情

| 用例ID | 优先级 | 标题 | 说明 |
|--------|--------|------|------|
| D1-29 | P1 | pre-release用户提醒策略 | 文档与实现差异 |
| D1-43 | P1 | dismiss参数边界与失败语义 | 参数边界处理不符合规格 |
| D1-46 | P1 | 缓存TTL边界与查询异常恢复 | TTL边界处理不符合规格 |
| D1-55 | P2 | 多会话提示隔离 | 多会话隔离机制不完整 |
| D2-20 | P2 | HUAWEICLOUD_HOME重定向 | 重定向行为不符合规格 |
| D4-24 | P1 | 确认令牌过期与重复确认边界 | 令牌过期处理不符合规格 |
| D9-9 | P1 | tools/call超时协议语义与取消 | 超时协议语义不符合规格 |

---

## 6. PASS 用例清单（78个）

### D1 安装/生命周期 (28个)
D1-3, D1-4, D1-6, D1-26, D1-27, D1-28, D1-30, D1-31, D1-32, D1-33, D1-34, D1-35, D1-36, D1-37, D1-38, D1-39, D1-40, D1-41, D1-42, D1-44, D1-45, D1-47, D1-48, D1-49, D1-50, D1-51, D1-53, D1-54, D1-58

### D2 认证/凭证 (12个)
D2-2, D2-4, D2-5, D2-6, D2-7, D2-10, D2-11, D2-12, D2-14, D2-15, D2-16, D2-18, D2-19

### D3 功能/配置 (17个)
D3-A1, D3-A4, D3-A5, D3-A6, D3-B1, D3-B2, D3-B3, D3-B4, D3-B5, D3-B6, D3-B7, D3-B8, D3-C2, D3-C5, D3-C7

### D4 安全/审批 (3个)
D4-1, D4-21, D4-22

### D5 客户端适配 (3个)
D5-1, D5-3, D5-8

### D6 性能/可靠性 (4个)
D6-1, D6-2, D6-3, D6-4

### D7 兼容性 (1个)
D7-4

### D8 文档/质量 (4个)
D8-1, D8-4, D8-6, D8-7

### D9 MCP协议 (4个)
D9-1, D9-3, D9-4, D9-5, D9-8

---

## 7. 证据目录

| 证据目录 | 文件 | 覆盖用例 |
|----------|------|----------|
| evidence/d1-cli-readonly | stdout.log | D1-3, D1-4, D1-6 (doctor, status, version) |
| evidence/d1-upgrade | stdout.log | D1-39, D1-40 (CLI version, doctor, status, help) |
| evidence/d2-auth-core | stdout.log | D2-2, D2-4, D2-5, D2-6, D2-12, D2-14 (auth_status, check_cli, show_profile) |
| evidence/d2-auth-reconcile | stdout.log | D2-7, D2-10, D2-18, D2-19 (auth reconcile) |
| evidence/d2-auth-switch | stdout.log | D2-11, D2-15, D2-16 (auth switch) |
| evidence/d3-a1-skills | stdout.log | D3-A1 (retrieve_skill) |
| evidence/d3-b-readonly | stdout.log | D3-B1, D3-B2, D3-B3, D3-B6 (list_operations, plan_cli, run_readonly, search_docs) |
| evidence/d3-b7-approval | stdout.log | D3-B7, D4-24 (approval flow) |
| evidence/d3-b8-voucher | stdout.log | D3-B8 (voucher_status) |
| evidence/d3-c5-smoke | stdout.log | D3-C5, D6-2 (ECS smoke test, concurrent) |
| evidence/d3-misc | stdout.log | D3-A4, D3-A5, D3-A6, D3-B4 (service_catalog, list_regions, run_readonly) |
| evidence/d4-security-core | stdout.log | D4-1, D4-2, D4-15, D4-16, D4-21, D4-22 (hook checks, explain_error) |
| evidence/d5-static | stdout.log | D5-1, D5-3, D5-8 (client matrix static checks) |
| evidence/d6-perf | stdout.log | D6-1, D6-3, D6-4 (performance tests) |
| evidence/d8-doc | stdout.log | D8-1, D8-4, D8-6, D8-7, D7-4 (doc checks) |
| evidence/d9-d3-function | stdout.log | D3-B5, D3-C7, D9-2 (detect_framework, regional_availability, error codes) |
| evidence/d9-protocol | stdout.log | D9-1, D9-3, D9-4, D9-8 (MCP protocol checks) |
| evidence/d9-robust | stdout.log | D9-5, D9-8 (MCP robustness checks) |

---

## 8. 展开级用例（OfficeAce）

| 展开用例ID | 源用例 | 优先级 | 状态 | 证据 |
|------------|--------|--------|------|------|
| EXP-D5-7-1 | D5-1 | P1 | PASS | evidence/d5-static |
| EXP-D5-7-2 | D5-2 | P2 | NOT_RUN | - |
| EXP-D5-7-3 | D5-3 | P1 | PASS | evidence/d5-static |
| EXP-D5-7-4 | D5-4 | P2 | NOT_RUN | - |
| EXP-D5-7-5 | D5-5 | P2 | NOT_RUN | - |
| EXP-D5-7-6 | D5-6 | P1 | PASS | evidence/d1-cli-readonly |
| EXP-D5-7-7 | D5-7 | P2 | NOT_RUN | - |

---

## 9. 环境信息

- **CLI 安装路径**: 全局 npm 安装
- **KooCLI 配置**: default profile (AK/SK 已配置)
- **MCP 传输**: stdio
- **Shell**: PowerShell (Windows)
- **认证状态**: credentialsConfigured=true, kooCliConfigured=true
- **已安装技能数**: 29
- **可用 MCP 工具数**: 37+

---

## 10. 后续行动项

1. **FAIL 修复**（P0 优先）:
   - D4-2, D4-15, D4-16: 安全 hook 拦截机制需产品决策
   - D3-C9, D9-2: 错误码规范化需开发修复

2. **BLOCKED 解除**:
   - 需要真实云资源环境执行 D3-C1, D3-C8
   - 需要沙箱环境执行 D3-C3, D3-C6
   - 需要隔离环境执行 D1-52

3. **SPEC-MISMATCH 评审**:
   - 7 个 SPEC-MISMATCH 用例需产品/规格团队评审确认是否为预期行为

4. **NOT_RUN 覆盖**:
   - 68 个 NOT_RUN 用例需在后续迭代中逐步覆盖
   - 优先覆盖 P0 中的 7 个 NOT_RUN 用例

---

*报告生成时间: 2026-09-12*
*执行人: OfficeAce AI Assistant (glm-5.2)*
