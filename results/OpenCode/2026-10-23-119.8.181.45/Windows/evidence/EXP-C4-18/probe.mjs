// EXP-C4-18 probe
// Status: PASS
// DEW list_operations smoke: DEW aggregate: KMS (70+ ops, ListKeys), CSMS (40+ ops, ListSecrets). Both sub-services have List operations. plan_cli_command classifies read-only ops as allow/local_metadata. Service routing works.
// huaweicloud_list_operations("DEW")
// Result: ok=true, operations listed, plan classified as local_metadata
