// EXP-C4-22 probe
// Status: PASS
// ELB list_operations smoke: ELB --help returned 200+ operations. List: ListLoadBalancers, Create: CreateLoadBalancer. plan_cli_command classifies read-only ops as allow/local_metadata. Service routing works.
// huaweicloud_list_operations("ELB")
// Result: ok=true, operations listed, plan classified as local_metadata
