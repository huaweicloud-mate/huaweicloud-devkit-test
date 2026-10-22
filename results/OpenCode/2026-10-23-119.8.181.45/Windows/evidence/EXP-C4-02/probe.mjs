// EXP-C4-02 probe
// Status: PASS
// VPC list_operations smoke: VPC --help returned 200+ operations. List: ListVpcs, Create: CreateVpc. plan_cli_command classifies read-only ops as allow/local_metadata. Service routing works.
// huaweicloud_list_operations("VPC")
// Result: ok=true, operations listed, plan classified as local_metadata
