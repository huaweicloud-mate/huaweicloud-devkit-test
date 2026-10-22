// EXP-C4-13 probe
// Status: PASS
// SMN list_operations smoke: SMN --help returned 60+ operations. List: ListTopics, Create: CreateTopic. plan_cli_command classifies read-only ops as allow/local_metadata. Service routing works.
// huaweicloud_list_operations("SMN")
// Result: ok=true, operations listed, plan classified as local_metadata
