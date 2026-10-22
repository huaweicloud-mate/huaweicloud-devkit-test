// EXP-C4-19 probe
// Status: PASS
// CBR list_operations smoke: CBR --help returned 60+ operations. List: ListVault, Create: CreateVault. plan_cli_command classifies read-only ops as allow/local_metadata. Service routing works.
// huaweicloud_list_operations("CBR")
// Result: ok=true, operations listed, plan classified as local_metadata
