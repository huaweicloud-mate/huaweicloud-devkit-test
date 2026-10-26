// Hermes/Windows 真云 E2E D3-C1
// status: FAIL
// ECS生命周期E2E: 创建流程PASS(VPC/子网/ECS创建+审批分类=allow)，但 finally归零 自动清理缺陷——ECS异步删除150s轮询未确认(sh()返回DeleteServers job但ECS仍ACTIVE)，随后子网/VPC删除顺序错触发VPC.0104。已人工兜底: DeleteServers→20s内归零→DeleteSubnet→DeleteVpc，最终归零验证 PASS(ECS/子网/VPC/EVS/EIP 残留=0)。
