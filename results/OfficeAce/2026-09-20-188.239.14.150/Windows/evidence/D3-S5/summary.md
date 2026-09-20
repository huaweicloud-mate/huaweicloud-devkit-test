# D3-S5: 场景-复合意图分层路由

**Result: PASS**

## 纯中文复合意图
`物联网设备数据采集时序存储前端托管展示`
- Services: ['Run hcloud --help to list available services.']
- Skills: ['Use huaweicloud-core to route intent.']

## 混合意图（含服务关键词）
`物联网 DDS GaussDB 时序数据 OBS ECS 前端托管 hosting storage`
- Services: ['ECS', 'OBS', 'GaussDB', 'Sandbox', 'DevStation']
- Skills: ['huawei-sandbox', 'huawei-ecs', 'huawei-obs', 'huawei-gaussdb', 'huawei-dds-dcs']
- Multi-service hit: True
- Sandbox first: True

## 单服务路由验证
### storage_obs (`OBS bucket storage hosting`)
- Services: ['OBS', 'Sandbox', 'DevStation']
- Skills: ['huawei-sandbox', 'huawei-obs']

### dds_gaussdb (`DDS GaussDB mongodb distributed`)
- Services: ['GaussDB', 'DDS', 'DCS']
- Skills: ['huawei-gaussdb', 'huawei-dds-dcs']

### ecs_compute (`ECS server compute instance`)
- Services: ['ECS']
- Skills: ['huawei-ecs']

### sandbox_deploy (`sandbox preview 部署 托管`)
- Services: ['Sandbox', 'DevStation']
- Skills: ['huawei-sandbox']

