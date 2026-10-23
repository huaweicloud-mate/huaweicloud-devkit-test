// EXP-C4-01 probe
// Status: PASS
// ECS list_operations smoke: ECS --help returned 100+ operations. List: ListServersDetails, Create: CreateServers. plan_cli_command classifies read-only ops as allow/local_metadata. Service routing works.
// huaweicloud_list_operations("ECS")
// Result: ok=true, operations listed, plan classified as local_metadata
