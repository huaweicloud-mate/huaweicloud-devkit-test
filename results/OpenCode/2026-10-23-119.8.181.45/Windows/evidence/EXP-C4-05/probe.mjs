// EXP-C4-05 probe
// Status: PASS
// GaussDB list_operations smoke: GaussDB --help returned 200+ operations. List: ListGaussMySqlInstances, Create: CreateGaussMySqlInstance. plan_cli_command classifies read-only ops as allow/local_metadata. Service routing works.
// huaweicloud_list_operations("GaussDB")
// Result: ok=true, operations listed, plan classified as local_metadata
