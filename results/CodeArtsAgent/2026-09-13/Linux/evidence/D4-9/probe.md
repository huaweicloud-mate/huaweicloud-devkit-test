# D4-9 公开暴露/破坏性预检
工具: huaweicloud_hook_check_command (两条)
1) 公网22端口: hcloud ECS CreateSecurityGroupRule ... --remote_ip_prefix=0.0.0.0/0
2) 破坏性强删: hcloud RDS DeleteInstance --instance_id=rds-xxx --force
