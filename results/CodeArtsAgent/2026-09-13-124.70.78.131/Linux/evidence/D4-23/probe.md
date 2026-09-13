# D4-23 全局规则 huawei-agent-rules 注入生效性（11 安装目标）
客户端: CodeArtsAgent / Linux / codearts
方法: 源码级检查（hdk 仓库 @3b6290b = 1.1.4-next.3）
步骤: ① 定位规则文件 ② 全仓库搜索注入引用 ③ 核对 install/integrations 是否复制注入
断言: 规则文件存在且接入 install 注入各目标，无孤儿文件
