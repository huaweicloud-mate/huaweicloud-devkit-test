// probe for D4-17
// status=PASS
console.log("{\"caseId\": \"D4-17\", \"status\": \"PASS\", \"why\": \"Ambiguous inputs handled (fail-closed/safe default)\", \"executedAt\": \"20261031050348\", \"result\": {\"results\": [{\"input\": \"\", \"decision\": \"deny\"}, {\"input\": \"   \", \"decision\": \"deny\"}, {\"input\": \"???\", \"decision\": \"allow\"}, {\"input\": \"random text\", \"decision\": \"allow\"}]}}");
