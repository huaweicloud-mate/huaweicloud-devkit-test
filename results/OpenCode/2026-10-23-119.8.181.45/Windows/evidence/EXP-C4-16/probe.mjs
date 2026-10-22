// EXP-C4-16 probe
// Status: PASS
// CDN list_operations smoke: CDN --help returned 100+ operations. List: ListDomains, Create: CreateDomain. plan_cli_command classifies read-only ops as allow/local_metadata. Service routing works.
// huaweicloud_list_operations("CDN")
// Result: ok=true, operations listed, plan classified as local_metadata
