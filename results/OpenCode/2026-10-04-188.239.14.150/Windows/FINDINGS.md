# FINDINGS - OpenCode-big-pickle

## #1 - P0 - 环境限制导致大量用例标记为 BLOCKED

- **现象**：测试执行中，大量用例因环境限制标记为 BLOCKED。
- **断言**：需要完整的测试环境以执行所有用例。
- **根因**：huaweicloud-devkit:unknown + 当前测试环境缺少部分外部依赖或权限配置。
- **影响**：影响全量测试覆盖率。
- **证据**：evidence/*/stdout.log
- **状态**：待处理
