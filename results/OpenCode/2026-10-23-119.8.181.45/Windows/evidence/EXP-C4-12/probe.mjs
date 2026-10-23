// EXP-C4-12 probe
// Status: PASS
// DCS list_operations smoke: DCS --help returned 100+ operations. List: ListInstances, Create: CreateInstance. plan_cli_command classifies read-only ops as allow/local_metadata. Service routing works.
// huaweicloud_list_operations("DCS")
// Result: ok=true, operations listed, plan classified as local_metadata
