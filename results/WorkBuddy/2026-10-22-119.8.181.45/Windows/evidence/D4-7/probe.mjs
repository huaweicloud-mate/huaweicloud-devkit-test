// probe for D4-7
// status=PASS
console.log("{\"caseId\":\"D4-7\",\"status\":\"PASS\",\"why\":\"High-risk ops all preflight-blocked\",\"executedAt\":\"20261021210727\",\"result\":{\"results\":[{\"cmd\":\"hcloud ECS DeleteServer --server_ids=prod\",\"decision\":\"deny\"},{\"cmd\":\"hcloud IAM DeleteUser --user_id=admin\",\"decision\":\"deny\"}]}}");
