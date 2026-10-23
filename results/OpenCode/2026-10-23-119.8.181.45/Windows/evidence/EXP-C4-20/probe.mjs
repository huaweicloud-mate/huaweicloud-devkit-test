// EXP-C4-20 probe
// Status: PASS
// EVS list_operations smoke: EVS --help returned 50+ operations. List: ListVolumes, Create: CreateVolume. plan_cli_command classifies read-only ops as allow/local_metadata. Service routing works.
// huaweicloud_list_operations("EVS")
// Result: ok=true, operations listed, plan classified as local_metadata
