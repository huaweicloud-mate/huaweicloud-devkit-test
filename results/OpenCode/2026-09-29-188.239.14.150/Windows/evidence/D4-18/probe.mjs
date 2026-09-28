Confirm-not-deny approval semantics (fixed):
run_approved_command has approvalToken: true
run_approved_command has approvedByUser: true
Required fields: ["args","approvalToken","approvedByUser"]
Write operations require explicit confirmation (approvalToken + approvedByUser=true)