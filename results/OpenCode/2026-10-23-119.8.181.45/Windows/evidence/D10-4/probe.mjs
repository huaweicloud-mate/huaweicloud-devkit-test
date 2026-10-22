// D10-4 probe
// Status: PASS
// Eval harness run confirms static rule layer (serviceCatalog routing) applies security interventions. 13/14 HIT (92.9% accuracy). Write intents (ECS create, CCE create, EIP, DCS, CBR, FunctionGraph, CES, cert/ELB) correctly routed to plan/approve. Read intents (RDS query, BSS cost, IAM audit) correctly routed to read. Deploy intent (OBS static site) correctly routed to deploy.
// node eval/harness/run-eval.mjs <hdk>/plugins/huaweicloud-core/src/mcp-server.mjs
// Result: HIT=13 MISS=1 N/A=1, accuracy=92.9%
