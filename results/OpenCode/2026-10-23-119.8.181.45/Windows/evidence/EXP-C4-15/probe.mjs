// EXP-C4-15 probe
// Status: PASS
// WAF list_operations smoke: WAF --help returned 300+ operations. List: ListHost, Create: CreateHost. plan_cli_command classifies read-only ops as allow/local_metadata. Service routing works.
// huaweicloud_list_operations("WAF")
// Result: ok=true, operations listed, plan classified as local_metadata
