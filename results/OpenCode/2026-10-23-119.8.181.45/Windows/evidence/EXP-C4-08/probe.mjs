// EXP-C4-08 probe
// Status: PASS
// IAM list_operations smoke: IAM --help returned 200+ operations. List: ListUsersV5, Create: CreateUser. plan_cli_command classifies read-only ops as allow/local_metadata. Service routing works.
// huaweicloud_list_operations("IAM")
// Result: ok=true, operations listed, plan classified as local_metadata
