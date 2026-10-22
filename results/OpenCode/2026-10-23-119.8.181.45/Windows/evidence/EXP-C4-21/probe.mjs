// EXP-C4-21 probe
// Status: PASS
// EIP list_operations smoke: EIP --help returned 60+ operations. List: ListPublicips, Create: CreatePublicip. plan_cli_command classifies read-only ops as allow/local_metadata. Service routing works.
// huaweicloud_list_operations("EIP")
// Result: ok=true, operations listed, plan classified as local_metadata
