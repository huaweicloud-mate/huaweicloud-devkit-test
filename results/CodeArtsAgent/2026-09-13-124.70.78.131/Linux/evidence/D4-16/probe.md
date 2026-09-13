# D4-16 命令包裹穿透
工具: huaweicloud_hook_check_command
命令: bash -c "hcloud ECS DeleteServer --servers.1.id=abc"

补充: bash -c 包裹明文 DeleteServer 被识别(见 stdout.log)。但 $(echo ...) 命令替换包裹的内层破坏性命令未识别(见 D4-15 证据)。
分类为部分通过: bash -c 包裹穿透拦截正确，$(...) 命令替换穿透未覆盖。
