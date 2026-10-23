// EXP-C4-10 probe
// Status: PASS
// CES list_operations smoke: CES --help returned 80+ operations. List: ListAlarms, Create: CreateAlarm. plan_cli_command classifies read-only ops as allow/local_metadata. Service routing works.
// huaweicloud_list_operations("CES")
// Result: ok=true, operations listed, plan classified as local_metadata
