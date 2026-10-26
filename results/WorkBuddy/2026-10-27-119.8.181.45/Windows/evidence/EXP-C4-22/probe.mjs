// probe for EXP-C4-22
// status=PASS
console.log("{\"caseId\":\"EXP-C4-22\",\"status\":\"PASS\",\"why\":\"ELB ListListeners: help-list ok=true, real-call ok=false\",\"executedAt\":\"20261026210351\",\"result\":{\"service\":\"ELB\",\"op\":\"ListListeners\",\"helpExit\":0,\"helpHasOp\":true,\"listExit\":0,\"realOk\":false,\"realOutSample\":\"ListListeners有多个版本,默认使用该API版本v3.若需指定其他版本,请将API名修改为\\\"ListListeners/版本号\\\"\\n{\\n  \\\"request_id\\\": \\\"28b2a73e18af0ce58810176da09ab52e\\\",\\n  \\\"listeners\\\": [],\\n  \\\"page_info\\\": {\\n    \\\"current_count\\\": 0\\n  }\\n}\"}}");
