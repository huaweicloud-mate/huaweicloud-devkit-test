# D3-C4: 服务创建类回归

**Result: PASS**

## Service Operations
| Service | Operations Count |
|---------|-----------------|
| ECS | 131 |
| VPC | 215 |
| OBS | 26 |
| RDS | 352 |
| IAM | 239 |

## Classification
| Command | Decision | Risk |
|---------|----------|------|
| ECS CreateServers | deny | write |
| VPC CreateVpc | deny | write |
| RDS CreateInstance | deny | write |
| ECS DeleteServers | deny | write |
| ECS ListServers | allow | read_only |

## OBS Commands (26)
abort, bucketpolicy, cat, chattri, cp, create-share, download, lifecycle, ls, mb, mkdir, mv, restore, rm, share-cp, share-ls, sign, stat, sync, update, archive, clear, config, hash, help, version
