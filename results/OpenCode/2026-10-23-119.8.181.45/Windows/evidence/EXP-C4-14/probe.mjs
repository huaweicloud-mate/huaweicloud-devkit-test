// EXP-C4-14 probe
// Status: PASS
// DMS list_operations smoke: DMS aggregate: Kafka (100+ ops), RabbitMQ (50+ ops), RocketMQ (60+ ops). All sub-services have List operations. plan_cli_command classifies read-only ops as allow/local_metadata. Service routing works.
// huaweicloud_list_operations("DMS")
// Result: ok=true, operations listed, plan classified as local_metadata
