// EXP-C4-06 probe
// Status: PASS
// CCE list_operations smoke: CCE --help returned 200+ operations. List: ListClusters, Create: CreateCluster. plan_cli_command classifies read-only ops as allow/local_metadata. Service routing works.
// huaweicloud_list_operations("CCE")
// Result: ok=true, operations listed, plan classified as local_metadata
