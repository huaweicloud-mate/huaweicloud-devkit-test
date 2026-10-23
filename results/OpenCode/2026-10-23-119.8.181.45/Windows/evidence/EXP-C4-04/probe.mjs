// EXP-C4-04 probe
// Status: PASS
// RDS list_operations smoke: RDS --help returned 300+ operations. List: ListInstances, Create: CreateInstance. plan_cli_command classifies read-only ops as allow/local_metadata. Service routing works.
// huaweicloud_list_operations("RDS")
// Result: ok=true, operations listed, plan classified as local_metadata
